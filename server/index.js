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

// Initialize Firebase Admin with explicit project ID
admin.initializeApp({
  projectId: "gen-lang-client-0787280773"
});

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

// --- ADMIN API ENDPOINTS ---

// Admin emails allowed to access the dashboard
const ADMIN_EMAILS = ['codykayak@gmail.com', 'test@test.com', 'admin@aibhive.com']; // In production, move to process.env.ADMIN_EMAILS

// Middleware to verify Firebase Auth token and check Admin status
async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    const isEnvAdmin = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.includes(decodedToken.email) : false;

    if (!ADMIN_EMAILS.includes(decodedToken.email) && !isEnvAdmin) {
      console.warn(`Unauthorized admin access attempt by ${decodedToken.email}`);
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

app.get('/api/admin/leads', verifyAdmin, async (req, res) => {
  try {
    const leadsRef = db.collection('leads');
    // Fetch last 50 leads, ordered by creation date
    const snapshot = await leadsRef.orderBy('createdAt', 'desc').limit(50).get();

    const leads = [];
    snapshot.forEach(doc => {
      leads.push({ id: doc.id, ...doc.data() });
    });

    return res.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.get('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const settingsDoc = await db.collection('system').doc('settings').get();
    if (!settingsDoc.exists) {
      return res.json({ settings: { preferredModel: 'gemini' } }); // Default
    }
    return res.json({ settings: settingsDoc.data() });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const { preferredModel } = req.body;
    if (!['gemini', 'claude', 'grok'].includes(preferredModel)) {
       return res.status(400).json({ error: 'Invalid model preference' });
    }

    await db.collection('system').doc('settings').set({ preferredModel }, { merge: true });
    return res.json({ success: true, settings: { preferredModel } });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});
// ---------------------------

// Pricing tables (kept in sync with frontend)
const TEXT_RATES = { transcribeTranslate: 0.025, legalMedical: 0.035, voiceCloning: 0.035 };
const AUDIO_RATES = { transcribeTranslate: 2.49,  legalMedical: 3.29,  voiceCloning: 1.99  };

function calculatePrice(lead) {
  const { fileType, fileLengthWords, audioMinutes, services } = lead || {};
  if (!services) return 0;

  const isAudio = fileType === 'audio' || fileType === 'video';
  const rates = isAudio ? AUDIO_RATES : TEXT_RATES;
  const unit = isAudio ? Math.max(1, audioMinutes || 1) : Math.max(1, fileLengthWords || 1);

  let total = 0;
  for (const key of Object.keys(rates)) {
    if (services[key]) total += unit * rates[key];
  }
  return Number(total.toFixed(2));
}

app.post('/api/create-checkout-session', async (req, res) => {
  const { leadId, email } = req.body || {};
  console.log('[checkout] request received', { leadId, email });

  try {
    if (!leadId) {
      return res.status(400).json({ error: 'Missing leadId.' });
    }

    console.log('[checkout] loading lead from Firestore');
    const leadSnap = await db.collection('leads').doc(leadId).get();
    if (!leadSnap.exists) {
      return res.status(404).json({ error: 'Lead not found.' });
    }
    const lead = leadSnap.data();

    console.log('[checkout] verifying price');
    const amount = calculatePrice(lead);
    const amountCents = Math.round(amount * 100);
    if (amountCents < 50) {
      return res.status(400).json({ error: `Price ($${amount}) is below the $0.50 minimum.` });
    }

    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
    console.log('[checkout] creating Stripe session', { amountCents, origin });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: 'AiBhive Project',
            description: `Order ${leadId}`,
          },
        },
      }],
      customer_email: email || lead.email || undefined,
      client_reference_id: leadId,
      metadata: { leadId },
      success_url: `${origin}/get-started?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/get-started?canceled=true`,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }

    console.log('[checkout] session created', { id: session.id });
    return res.json({ url: session.url });
  } catch (err) {
    console.error('[checkout] failed:', err);
    return res.status(500).json({ error: err.message || 'Checkout failed.' });
  }
});

// --- Serve Frontend Static Files for Production ---
// In production (Cloud Run), the Express server acts as the host for the built Vite React app

// Serve the standalone Cody website at /cody (static assets + fallback to cody/index.html)
app.use('/cody', express.static(path.join(__dirname, '../dist/cody')));
app.get(['/cody', '/cody/*'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/cody/index.html'));
});

app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve the React index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
