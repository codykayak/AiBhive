import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { processLeadJob } from './processing.js';
import nodemailer from 'nodemailer';

dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// For Google Cloud Run, we listen on PORT (default 8080).
const port = process.env.PORT || 8080;

// Initialize Firebase Admin (Uses service account from GOOGLE_APPLICATION_CREDENTIALS or process.env)
// Trigger deployment to check Cloud Run stability
try {
  // Usually this reads from GOOGLE_APPLICATION_CREDENTIALS environment variable
  admin.initializeApp();
} catch (e) {
  // If not running in Google Cloud or missing env var, try initializing with a fake/mock for dev
  console.warn("Could not initialize Firebase Admin automatically. Falling back to default app config if available.", e.message);
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
}

const db = admin.firestore();

// Setup Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or another service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Use your test stripe API key from environment variables, or fallback to a dummy key for now
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_123', {
  apiVersion: '2023-10-16',
});

// Middleware
app.use(cors());

// Webhook endpoint needs raw body
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else if (process.env.NODE_ENV !== 'production') {
      // In local development ONLY, if no webhook secret is set, just parse the body
      event = JSON.parse(req.body.toString());
    } else {
       console.error("Webhook secret is missing in production. Cannot verify signature.");
       return res.status(400).send("Webhook Error: Signature verification required in production.");
    }
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const leadId = session.client_reference_id;

    console.log(`Payment successful for lead: ${leadId}`);

    try {
      const userEmail = session.customer_details?.email;

      // 1. Update status to paid and save the customer email since they checked out anonymously
      const leadRef = db.collection('leads').doc(leadId);
      await leadRef.update({
        status: 'paid',
        email: userEmail || null
      });

      // 2. Fetch full lead data
      const leadSnap = await leadRef.get();
      if (leadSnap.exists) {
        const leadData = { id: leadSnap.id, ...leadSnap.data() };

        // 3. Process the job (running asynchronously so we don't block the webhook response)
        processLeadJob(leadData).then(async (result) => {
          if (result.success) {
            // Save results back to Firestore
            await leadRef.update({
              status: 'completed',
              rawTranscript: result.originalText || null,
              finalOutputText: result.finalOutputText,
              finalAudioUrl: result.finalAudioUrl || null,
              flags: result.flags || []
            });

            // Note: In a real app, we'd also upload result.finalOutputText to Firebase Storage
            // and save that URL instead of the raw text if it's large.

            // Send email to user using the email provided during Stripe checkout
            if (userEmail) {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: 'Your AiBhive Files are Ready!',
                text: `Your processing is complete. You can view your results in your dashboard.`,
                html: `<h3>Your files are ready!</h3><p>Your processing for request ID: ${leadId} is complete. Log into your dashboard to view the results.</p>`
              });
            }
          } else {
             await leadRef.update({ status: 'failed', error: result.error });
          }
        }).catch(err => {
          console.error("Job processing error:", err);
        });
      }
    } catch (err) {
      console.error("Error updating firestore or processing job:", err);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

// Regular JSON middleware for other endpoints
app.use(express.json());

// Endpoint to process free samples
app.post('/api/process-free-sample', async (req, res) => {
  try {
    const { leadId, email } = req.body;

    const leadRef = db.collection('leads').doc(leadId);
    await leadRef.update({
      status: 'processing_free',
      email: email || null
    });

    const leadSnap = await leadRef.get();
    if (!leadSnap.exists) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const leadData = { id: leadSnap.id, ...leadSnap.data() };

    // Security Check: Ensure the job is actually free
    if (leadData.calculatedPrice !== 0) {
      return res.status(403).json({ error: 'This job requires payment.' });
    }

    // Process asynchronously
    processLeadJob(leadData).then(async (result) => {
      if (result.success) {
        await leadRef.update({
          status: 'completed',
          rawTranscript: result.originalText || null,
          finalOutputText: result.finalOutputText,
          finalAudioUrl: result.finalAudioUrl || null,
          flags: result.flags || []
        });

        // Send email with results if provided
        if (email) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Free AiBhive Sample is Ready!',
            text: `Your free sample processing is complete. You can view your results in your dashboard.`,
            html: `<h3>Your free sample is ready!</h3><p>Your processing for request ID: ${leadId} is complete. Log into your dashboard to view the results.</p>`
          });
        }
      } else {
        await leadRef.update({ status: 'failed', error: result.error });
      }
    }).catch(err => {
      console.error("Free job processing error:", err);
    });

    res.json({ success: true, message: 'Free sample processing started' });
  } catch (error) {
    console.error('Error processing free sample:', error);
    res.status(500).json({ error: 'Failed to process free sample' });
  }
});

// Endpoint to create a checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { leadId } = req.body;

    // Fetch the lead from the database to securely get the price
    const leadSnap = await db.collection('leads').doc(leadId).get();
    if (!leadSnap.exists) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const leadData = leadSnap.data();
    const verifiedAmount = leadData.calculatedPrice;

    if (verifiedAmount === undefined || verifiedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid price for checkout' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AiBhive Translation and Voice Services',
              description: `Processing fee for request ID: ${leadId}`,
            },
            unit_amount: Math.round(verifiedAmount * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // We'll update these URLs to match the frontend later
      success_url: `${req.headers.origin || 'http://localhost:3000'}/get-started?success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/get-started?canceled=true`,
      client_reference_id: leadId,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// --- Serve Frontend Static Files for Production ---
// In production (Cloud Run), the Express server acts as the host for the built Vite React app
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve the React index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
