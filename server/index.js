import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { processLeadJob } from './processing.js';
import nodemailer from 'nodemailer';
import { Storage } from '@google-cloud/storage';

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

// Setup Google Cloud Storage
const storage = new Storage();
const bucketName = 'aibhive-media'; // Must be lowercase for GCS
// Note: To automatically delete files after 72 hours,
// Object Lifecycle Management should be configured on the 'aibhive-media' bucket
// via the Google Cloud Console or gsutil:
// gsutil lifecycle set lifecycle.json gs://aibhive-media
// (where lifecycle.json specifies a Delete action with Age: 3 days).

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

            let gcsCleanTextUrl = null;
            let gcsAnnotatedTextUrl = null;
            let gcsAudioUrl = null;

            // Generate signed URLs valid for 72 hours
            const urlOptions = {
              version: 'v4',
              action: 'read',
              expires: Date.now() + 72 * 60 * 60 * 1000, // 72 hours
            };

            try {
              // Upload clean text to AiBhive-media bucket
              const cleanTextFilename = `clean_output_${leadId}.txt`;
              const cleanTextFile = storage.bucket(bucketName).file(cleanTextFilename);
              await cleanTextFile.save(result.cleanTranslatedText, { contentType: 'text/plain' });
              const [cleanUrl] = await cleanTextFile.getSignedUrl(urlOptions);
              gcsCleanTextUrl = cleanUrl;

              // Upload annotated text to AiBhive-media bucket
              const annotatedTextFilename = `annotated_output_${leadId}.txt`;
              const annotatedTextFile = storage.bucket(bucketName).file(annotatedTextFilename);
              await annotatedTextFile.save(result.annotatedText, { contentType: 'text/plain' });
              const [annotatedUrl] = await annotatedTextFile.getSignedUrl(urlOptions);
              gcsAnnotatedTextUrl = annotatedUrl;

              // Upload cloned audio to AiBhive-media bucket if it exists
              if (result.clonedAudioBuffer) {
                const audioFilename = `cloned_audio_${leadId}.mp3`;
                const audioFile = storage.bucket(bucketName).file(audioFilename);
                await audioFile.save(result.clonedAudioBuffer, { contentType: 'audio/mpeg' });
                const [audioUrl] = await audioFile.getSignedUrl(urlOptions);
                gcsAudioUrl = audioUrl;
              }
            } catch (storageError) {
              console.error("Error saving files to Google Cloud Storage:", storageError);
            }

            // Save results back to Firestore
            await leadRef.update({
              status: 'completed',
              rawTranscript: result.originalText || null,
              finalOutputTextUrl: gcsAnnotatedTextUrl, // Keep backward compatibility for frontend
              cleanTranslatedTextUrl: gcsCleanTextUrl,
              annotatedTextUrl: gcsAnnotatedTextUrl,
              finalAudioUrl: gcsAudioUrl || null,
              voiceModelId: result.voiceModelId || null,
              translatedTitle: result.translatedTitle || null,
              translatedSummary: result.translatedSummary || null,
              flags: result.flags || []
            });

            // Send email to user using the email provided during Stripe checkout
            if (userEmail) {
              let emailText = `Your Media files from AiBhive are complete.\n\n`;
              if (result.translatedTitle) emailText += `Title: ${result.translatedTitle}\n`;
              if (result.translatedSummary) emailText += `Summary: ${result.translatedSummary}\n\n`;
              emailText += `Download your files here (links expire in 72 hours):\n`;
              if (gcsCleanTextUrl) emailText += `Clean Text: ${gcsCleanTextUrl}\n`;
              if (gcsAnnotatedTextUrl) emailText += `Annotated Text: ${gcsAnnotatedTextUrl}\n`;
              if (gcsAudioUrl) emailText += `Cloned Audio: ${gcsAudioUrl}\n`;
              emailText += `\nSimply click the links above to view or download your files. Please note that files are deleted from our servers after 72 hours.`;

              let emailHtml = `<h3>Your Media files from AiBhive are complete.</h3>`;
              if (result.translatedTitle) emailHtml += `<h4>${result.translatedTitle}</h4>`;
              if (result.translatedSummary) emailHtml += `<p><em>${result.translatedSummary}</em></p>`;
              emailHtml += `<p>Download your files here (links expire in 72 hours):</p><ul>`;
              if (gcsCleanTextUrl) emailHtml += `<li><a href="${gcsCleanTextUrl}">Download Clean Text File</a></li>`;
              if (gcsAnnotatedTextUrl) emailHtml += `<li><a href="${gcsAnnotatedTextUrl}">Download Annotated Text File</a></li>`;
              if (gcsAudioUrl) emailHtml += `<li><a href="${gcsAudioUrl}">Download Cloned Audio File</a></li>`;
              emailHtml += `</ul><p>Simply click the links above to view or download your files. Please note that files are deleted from our servers after 72 hours.</p>`;

              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: 'Your AiBhive Files are Ready!',
                text: emailText,
                html: emailHtml
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

// Endpoint to create a checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { leadId, email } = req.body;

    if (!leadId) {
      return res.status(400).json({ error: 'Missing required leadId parameter.' });
    }

    const leadSnap = await db.collection('leads').doc(leadId).get();
    if (!leadSnap.exists) {
      return res.status(404).json({ error: 'Lead data could not be found in the database. Please try uploading your files again.' });
    }

    const leadData = leadSnap.data();

    // Secure verification: Redo the math based on stored values
    let total = 0;
    const { fileType, fileLengthWords, audioMinutes, services } = leadData;
    const { transcribeTranslate, voiceCloning, legalMedical } = services || {};

    if (fileType === 'text') {
      const words = Math.max(1, fileLengthWords || 1);
      if (transcribeTranslate) total += words * 0.025;
      if (legalMedical) total += words * 0.035;
      if (voiceCloning) total += words * 0.035;
    } else if (fileType === 'audio' || fileType === 'video') {
      const minutes = Math.max(1, audioMinutes || 1);
      if (transcribeTranslate) total += minutes * 2.49;
      if (legalMedical) total += minutes * 3.29;
      if (voiceCloning) total += minutes * 1.99;
    }

    const verifiedAmount = Number(total.toFixed(2));
    const amountInCents = Math.round(verifiedAmount * 100);

    // Stripe enforces a minimum charge amount (usually $0.50 USD).
    // If the calculation results in less than 50 cents, it will fail.
    if (amountInCents < 50) {
      return res.status(400).json({ error: `Calculated price (${verifiedAmount}) is below the minimum processing amount of $0.50.` });
    }

    const frontendUrl = req.headers.origin || 'http://localhost:3000';

    // Create checkout session with explicit try-catch to surface Stripe-specific errors
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Project Checkout',
              description: `Processing fee for request ID: ${leadId}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${frontendUrl}/get-started?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/get-started?canceled=true`,
        customer_email: email || undefined,
        metadata: { leadId },
        client_reference_id: leadId,
      });

      if (!session.url) {
        throw new Error("Stripe did not return a valid checkout URL.");
      }

      res.json({ url: session.url });
    } catch (stripeErr) {
      console.error('Stripe API error:', stripeErr);
      // Pass the specific Stripe error message back to the frontend so the user knows what failed
      return res.status(502).json({ error: `Payment provider error: ${stripeErr.message}` });
    }

  } catch (error) {
    console.error('Internal server error during checkout creation:', error);
    res.status(500).json({ error: 'Internal server error while preparing checkout.' });
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
