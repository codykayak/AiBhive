import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { processLeadJob } from './processing.js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Firebase Admin (Uses service account from GOOGLE_APPLICATION_CREDENTIALS or process.env)
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
    } else {
      // In development, if no webhook secret is set, just parse the body
      event = JSON.parse(req.body.toString());
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
      // 1. Update status to paid
      const leadRef = db.collection('leads').doc(leadId);
      await leadRef.update({ status: 'paid' });

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

            // Send email to user (assuming you have the user's email saved,
            // or you get it from the stripe session `session.customer_details.email`)
            const userEmail = session.customer_details?.email;
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
    const { leadId } = req.body;

    const leadRef = db.collection('leads').doc(leadId);
    await leadRef.update({ status: 'processing_free' });

    const leadSnap = await leadRef.get();
    if (!leadSnap.exists) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const leadData = { id: leadSnap.id, ...leadSnap.data() };

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

        // In a real scenario we could send an email here too, but for a free sample
        // they might just check the dashboard. We'll send an email if they provided one.
        // The user auth email isn't directly on the lead usually, so we'll skip for now.
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
    const { leadId, amount } = req.body;

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
            unit_amount: Math.round(amount * 100), // Stripe expects amounts in cents
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
