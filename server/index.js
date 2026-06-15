import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { processLeadJob, rerunPass3Only } from './processing.js';
import { getAssistantReply } from './assistantChat.js';
import { createRagSourcesService, initRagSourcesService } from './ragSources.js';
import { getPipelineSettings, normalizeVerificationModels } from './pipelineSettings.js';
import { performRagContextAccuracyCheck } from './ragSources.js';
import { persistLeadProcessingResult, fetchTextFromUrl } from './leadPersistence.js';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// For Google Cloud Run, we listen on PORT (default 8080).
const port = process.env.PORT || 8080;

// Load the shared Firebase config so the frontend and backend always point
// at the SAME project AND the SAME named Firestore database.
//
// Why this matters: the frontend writes leads to a NAMED Firestore database
// (firebaseConfig.firestoreDatabaseId), but `admin.firestore()` with no
// arguments always returns the `(default)` database. With that mismatch
// every checkout returned `5 NOT_FOUND` because the lead simply did not
// exist in the database the server was reading from.
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../firebase-applet-config.json'), 'utf8')
);
const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || '(default)';

admin.initializeApp({ projectId: firebaseConfig.projectId });
console.log('[startup] Firebase Admin initialized', {
  projectId: firebaseConfig.projectId,
  databaseId: FIRESTORE_DATABASE_ID,
  // GOOGLE_APPLICATION_CREDENTIALS only set when running outside GCP; on Cloud
  // Run the service uses the runtime service account automatically.
  serviceAccountFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || '(metadata-server)',
});

const db = getFirestore(admin.app(), FIRESTORE_DATABASE_ID);

// Maps a gRPC error code from Firestore Admin SDK into an actionable hint.
// Codes are the gRPC canonical codes (https://grpc.io/docs/guides/status-codes/).
function describeFirestoreError(code) {
  switch (code) {
    case 5: // NOT_FOUND
      return 'NOT_FOUND — the named Firestore database does not exist in this project, or the document was never written. Check firestoreDatabaseId in firebase-applet-config.json.';
    case 7: // PERMISSION_DENIED
      return 'PERMISSION_DENIED — the Cloud Run service account is missing IAM permission to read this Firestore database. Grant it `roles/datastore.user` on project `' + firebaseConfig.projectId + '` (or restrict via a condition to database `' + FIRESTORE_DATABASE_ID + '`).';
    case 16: // UNAUTHENTICATED
      return 'UNAUTHENTICATED — Firebase Admin could not get application-default credentials. On Cloud Run this means the service is missing a runtime service account, or GOOGLE_APPLICATION_CREDENTIALS points to an invalid file.';
    case 8: // RESOURCE_EXHAUSTED
      return 'RESOURCE_EXHAUSTED — Firestore quota exceeded. Check Firestore quota usage in the Google Cloud Console.';
    case 14: // UNAVAILABLE
      return 'UNAVAILABLE — Firestore was temporarily unreachable. This is usually transient; retry the request.';
    default:
      return `gRPC status ${code} — see https://grpc.io/docs/guides/status-codes/`;
  }
}

// Startup probe: do one cheap Firestore read so an IAM/config problem shows up
// in the boot logs instead of waiting for the first checkout to fail.
(async () => {
  try {
    await db.collection('leads').limit(1).get();
    console.log('[startup] Firestore probe OK — server can read leads collection.');
  } catch (err) {
    console.error('[startup] Firestore probe FAILED:', {
      code: err.code,
      message: err.message,
      hint: describeFirestoreError(err.code),
      projectId: firebaseConfig.projectId,
      databaseId: FIRESTORE_DATABASE_ID,
    });
  }
})();

// Setup Google Cloud Storage
const storage = new Storage();
const bucketName = 'aibhive-media'; // Must be lowercase for GCS
const gcsBucket = storage.bucket(bucketName);
const ragSourcesService = createRagSourcesService({ db, gcsBucket });
initRagSourcesService(ragSourcesService);

const ragUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});
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
        email: userEmail || null,
        stripeSessionId: session.id,
      });

      // 2. Fetch full lead data
      const leadSnap = await leadRef.get();
      if (leadSnap.exists) {
        const leadData = { id: leadSnap.id, ...leadSnap.data() };

        const { verificationModels } = await getPipelineSettings(db);

        processLeadJob(leadData, { verificationModels })
          .then(async (result) => {
            await persistLeadProcessingResult({
              leadRef,
              leadId,
              result,
              gcsStorage: storage,
              userEmail,
              transporter,
              emailUser: process.env.EMAIL_USER,
            });
          })
          .catch((err) => {
            console.error('Job processing error:', err);
            leadRef.update({
              status: 'failed',
              error: err.message,
              errorStack: err.stack,
            });
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

// --- Admin API (uses named Firestore DB — same as checkout) ---
const DEFAULT_ADMIN_EMAILS = [
  'codykayak@gmail.com',
  'test@test.com',
  'admin@aibhive.com',
];

function getAdminEmails() {
  const fromEnv = process.env.ADMIN_EMAILS;
  const parsed = fromEnv
    ? fromEnv.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return [...new Set([...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...parsed])];
}

const ADMIN_EMAILS = getAdminEmails();

function isAdminEmail(email) {
  return Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));
}

async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!isAdminEmail(decodedToken.email)) {
      console.warn(`[admin] Unauthorized access attempt by ${decodedToken.email}`);
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[admin] Token verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

app.get('/api/admin/leads', verifyAdmin, async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    let snapshot;
    try {
      snapshot = await db.collection('leads').orderBy('createdAt', 'desc').limit(limit).get();
    } catch (orderErr) {
      console.warn('[admin/leads] orderBy failed, using unordered fetch:', orderErr.message);
      snapshot = await db.collection('leads').limit(limit).get();
    }

    const leads = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    leads.sort(
      (a, b) => (b.createdAt?.seconds ?? b.createdAt?._seconds ?? 0) - (a.createdAt?.seconds ?? a.createdAt?._seconds ?? 0)
    );

    return res.json({ leads });
  } catch (error) {
    console.error('[admin/leads] Error:', error);
    return res.status(500).json({
      error: 'Failed to fetch leads',
      hint: describeFirestoreError(error.code),
    });
  }
});

app.get('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const settings = await getPipelineSettings(db);
    const settingsDoc = await db.collection('system').doc('settings').get();
    const data = settingsDoc.exists ? settingsDoc.data() : {};
    return res.json({
      settings: {
        ...data,
        verificationModels: settings.verificationModels,
        preferredModel: settings.verificationModels[0],
      },
    });
  } catch (error) {
    console.error('[admin/settings] GET error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const verificationModels = normalizeVerificationModels(req.body.verificationModels);

    await db.collection('system').doc('settings').set(
      {
        verificationModels,
        preferredModel: verificationModels[0],
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: req.user.email,
      },
      { merge: true }
    );
    return res.json({ success: true, settings: { verificationModels, preferredModel: verificationModels[0] } });
  } catch (error) {
    console.error('[admin/settings] POST error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/admin/leads/:id', verifyAdmin, async (req, res) => {
  try {
    const doc = await db.collection('leads').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Lead not found.' });
    return res.json({ lead: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('[admin/leads/:id] error:', error);
    return res.status(500).json({ error: 'Failed to load lead' });
  }
});

app.post('/api/admin/leads/:id/retry-pass3', verifyAdmin, async (req, res) => {
  try {
    const leadRef = db.collection('leads').doc(req.params.id);
    const snap = await leadRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Lead not found.' });

    const leadData = { id: snap.id, ...snap.data() };
    let cleanText = req.body?.text;

    if (!cleanText && leadData.cleanTranslatedTextUrl) {
      try {
        cleanText = await fetchTextFromUrl(leadData.cleanTranslatedTextUrl);
      } catch (err) {
        console.warn('[retry-pass3] Could not fetch clean text URL:', err.message);
      }
    }

    if (!cleanText) {
      return res.status(400).json({
        error: 'No clean text available. Re-run full job or provide text in request body.',
      });
    }

    await leadRef.update({ status: 'processing', pass3RetryAt: FieldValue.serverTimestamp() });

    const result = await rerunPass3Only(leadData, cleanText);
    if (!result.success) {
      await leadRef.update({
        status: 'failed',
        error: result.error,
        errorStack: result.errorStack || null,
      });
      return res.status(500).json({ error: result.error });
    }

    const bucket = storage.bucket('aibhive-media');
    const urlOptions = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 72 * 60 * 60 * 1000,
    };

    const annotatedFile = bucket.file(`annotated_output_${leadData.id}.txt`);
    await annotatedFile.save(result.annotatedText, { contentType: 'text/plain' });
    const [annotatedUrl] = await annotatedFile.getSignedUrl(urlOptions);

    const cleanFile = bucket.file(`clean_output_${leadData.id}.txt`);
    await cleanFile.save(result.cleanTranslatedText, { contentType: 'text/plain' });
    const [cleanUrl] = await cleanFile.getSignedUrl(urlOptions);

    const existingRun = leadData.pipelineRun || { passes: [] };
    const passes = [...(existingRun.passes || [])];
    if (result.pipelinePass) passes.push(result.pipelinePass);

    await leadRef.update({
      status: 'completed',
      cleanTranslatedTextUrl: cleanUrl,
      annotatedTextUrl: annotatedUrl,
      finalOutputTextUrl: annotatedUrl,
      flags: result.flags || [],
      ragCitations: result.ragCitations || [],
      pipelineRun: { ...existingRun, passes },
      error: null,
      errorStack: null,
    });

    return res.json({ success: true, flags: result.flags, ragCitations: result.ragCitations });
  } catch (error) {
    console.error('[admin/retry-pass3] error:', error);
    return res.status(500).json({ error: error.message || 'Pass 3 retry failed' });
  }
});

app.get('/api/admin/consultations', verifyAdmin, async (req, res) => {
  try {
    const interestParam = req.query.interests;
    const filterInterests = interestParam
      ? String(interestParam)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    let snap;
    try {
      snap = await db.collection('consultationRequests').orderBy('createdAt', 'desc').limit(100).get();
    } catch {
      snap = await db.collection('consultationRequests').limit(100).get();
    }

    let requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (filterInterests.length > 0) {
      requests = requests.filter((r) =>
        filterInterests.some((tag) => Array.isArray(r.interests) && r.interests.includes(tag))
      );
    }

    requests.sort(
      (a, b) =>
        (b.createdAt?.seconds ?? b.createdAt?._seconds ?? 0) -
        (a.createdAt?.seconds ?? a.createdAt?._seconds ?? 0)
    );

    return res.json({ requests });
  } catch (error) {
    console.error('[admin/consultations] error:', error);
    return res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

app.patch('/api/admin/consultations/:id', verifyAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body || {};
    const patch = { updatedAt: FieldValue.serverTimestamp() };
    if (status) patch.status = status;
    if (adminNotes !== undefined) patch.adminNotes = adminNotes;
    await db.collection('consultationRequests').doc(req.params.id).update(patch);
    const doc = await db.collection('consultationRequests').doc(req.params.id).get();
    return res.json({ request: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('[admin/consultations/patch] error:', error);
    return res.status(400).json({ error: error.message || 'Update failed' });
  }
});

app.post('/api/admin/rag-test-pass3', verifyAdmin, async (req, res) => {
  try {
    const { text, targetLanguage } = req.body || {};
    if (!text?.trim()) return res.status(400).json({ error: 'text is required' });
    const ragService = ragSourcesService;
    const ragSources = await ragService.loadActiveSourcesForPipeline({ legal: true, medical: true });
    const result = await performRagContextAccuracyCheck(
      text.trim(),
      { legal: true, medical: true },
      targetLanguage || 'English',
      ragSources
    );
    return res.json({
      flags: result.flags,
      citations: result.citations,
      correctedText: result.checkedText,
      sourcesUsed: ragSources.map((s) => ({ id: s.id, title: s.title, type: s.type, url: s.url })),
    });
  } catch (error) {
    console.error('[admin/rag-test-pass3] error:', error);
    return res.status(500).json({ error: error.message || 'RAG test failed' });
  }
});

// --- Admin RAG sources (Pass 3 verification corpora) ---
app.get('/api/admin/rag-sources', verifyAdmin, async (req, res) => {
  try {
    const sources = await ragSourcesService.listSources();
    return res.json({ sources });
  } catch (error) {
    console.error('[admin/rag-sources] GET error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list RAG sources' });
  }
});

app.get('/api/admin/rag-sources/:id/view', verifyAdmin, async (req, res) => {
  try {
    const view = await ragSourcesService.getSourceView(req.params.id);
    return res.json(view);
  } catch (error) {
    console.error('[admin/rag-sources/view] error:', error);
    return res.status(error.message === 'Source not found.' ? 404 : 500).json({
      error: error.message || 'Failed to load source',
    });
  }
});

app.post('/api/admin/rag-sources/website', verifyAdmin, async (req, res) => {
  try {
    const { title, url, categories } = req.body || {};
    const source = await ragSourcesService.addWebsite(
      { title, url, categories },
      req.user.email
    );
    return res.json({ source });
  } catch (error) {
    console.error('[admin/rag-sources/website] error:', error);
    return res.status(400).json({ error: error.message || 'Failed to add website' });
  }
});

app.post(
  '/api/admin/rag-sources/document',
  verifyAdmin,
  ragUpload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }
      const ext = path.extname(req.file.originalname || '').toLowerCase();
      const mimeByExt = {
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.csv': 'text/csv',
        '.json': 'application/json',
      };
      const mimeType =
        mimeByExt[ext] ||
        (req.file.mimetype && req.file.mimetype !== 'application/octet-stream'
          ? req.file.mimetype
          : 'application/pdf');
      const title = req.body.title || req.file.originalname;
      let categories = ['legal', 'medical'];
      if (req.body.categories) {
        try {
          categories = JSON.parse(req.body.categories);
        } catch {
          categories = String(req.body.categories)
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
        }
      }
      const source = await ragSourcesService.addDocument(
        {
          title,
          buffer: req.file.buffer,
          mimeType,
          originalFilename: req.file.originalname,
          categories,
        },
        req.user.email
      );
      return res.json({ source });
    } catch (error) {
      console.error('[admin/rag-sources/document] error:', error);
      return res.status(400).json({ error: error.message || 'Failed to upload document' });
    }
  }
);

app.patch('/api/admin/rag-sources/:id', verifyAdmin, async (req, res) => {
  try {
    const source = await ragSourcesService.updateSource(req.params.id, req.body || {});
    return res.json({ source });
  } catch (error) {
    console.error('[admin/rag-sources/patch] error:', error);
    return res.status(400).json({ error: error.message || 'Failed to update source' });
  }
});

app.post('/api/admin/rag-sources/:id/resync', verifyAdmin, async (req, res) => {
  try {
    const source = await ragSourcesService.resyncSource(req.params.id, req.body || {});
    return res.json({ source });
  } catch (error) {
    console.error('[admin/rag-sources/resync] error:', error);
    return res.status(400).json({ error: error.message || 'Re-sync failed' });
  }
});

app.delete('/api/admin/rag-sources/:id', verifyAdmin, async (req, res) => {
  try {
    await ragSourcesService.deleteSource(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    console.error('[admin/rag-sources/delete] error:', error);
    return res.status(400).json({ error: error.message || 'Failed to delete source' });
  }
});

// --- Public site assistant (Gemini + site knowledge) ---
app.post('/api/assistant-chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long.' });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m.text === 'string' &&
              (m.role === 'user' || m.role === 'model')
          )
          .slice(-8)
          .map((m) => ({ role: m.role, text: m.text.slice(0, 2000) }))
      : [];

    const { reply, source } = await getAssistantReply(safeHistory, message);
    return res.json({ reply, source });
  } catch (err) {
    console.error('[assistant-chat] Error:', err);
    return res.status(500).json({
      error: 'Assistant is temporarily unavailable. Try /book-consultation or hello@aibhive.com.',
    });
  }
});

// --- Consultation / strategy call requests ---
app.post('/api/consultation-request', async (req, res) => {
  try {
    const body = req.body || {};
    const {
      companyName,
      contactName,
      email,
      interests,
      projectGoals,
    } = body;

    if (!companyName?.trim() || !contactName?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Company name, contact name, and email are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (!Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: 'Select at least one project interest.' });
    }
    if (!projectGoals?.trim() || projectGoals.trim().length < 20) {
      return res.status(400).json({
        error: 'Please describe your project goals in at least a few sentences.',
      });
    }

    const doc = {
      ...body,
      email: email.trim().toLowerCase(),
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('consultationRequests').add(doc);
    console.log('[consultation] New request', ref.id, email);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const summary = [
        `New AiBHive consultation request (${ref.id})`,
        '',
        `Company: ${companyName}`,
        `Contact: ${contactName} <${email}>`,
        `Interests: ${interests.join(', ')}`,
        `Timeline: ${body.timeline || '—'}`,
        `Budget: ${body.budget || '—'}`,
        '',
        'Project goals:',
        projectGoals,
        '',
        body.painPoints ? `Pain points:\n${body.painPoints}` : '',
        body.currentStack ? `Stack:\n${body.currentStack}` : '',
        body.preferredTimes ? `Preferred times: ${body.preferredTimes} (${body.timezone || ''})` : '',
      ]
        .filter(Boolean)
        .join('\n');

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.CONSULTATION_NOTIFY_EMAIL || process.env.EMAIL_USER,
          replyTo: email,
          subject: `[AiBHive] Consultation request — ${companyName}`,
          text: summary,
        });
      } catch (mailErr) {
        console.error('[consultation] Email notify failed:', mailErr);
      }
    }

    return res.json({ success: true, id: ref.id });
  } catch (err) {
    console.error('[consultation] Error:', err);
    return res.status(500).json({ error: 'Failed to submit request. Please email hello@aibhive.com.' });
  }
});

app.post('/api/contact-message', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ error: 'Please enter a longer message.' });
    }

    const doc = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      status: 'new',
      source: 'about-contact',
      createdAt: FieldValue.serverTimestamp(),
    };

    const ref = await db.collection('contactMessages').add(doc);

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.CONSULTATION_NOTIFY_EMAIL || process.env.EMAIL_USER,
          replyTo: email,
          subject: `[AiBHive] Contact form — ${name}`,
          text: `From: ${name} <${email}>\n\n${message}`,
        });
      } catch (mailErr) {
        console.error('[contact] Email notify failed:', mailErr);
      }
    }

    return res.json({ success: true, id: ref.id });
  } catch (err) {
    console.error('[contact] Error:', err);
    return res.status(500).json({ error: 'Failed to send message. Email hello@aibhive.com directly.' });
  }
});

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
  if (total > 0 && total < 0.50) {
    total = 0.50;
  }
  return Number(total.toFixed(2));
}


// TEST ENDPOINT - BYPASS STRIPE
app.post('/api/test-checkout-session', async (req, res) => {
  const { leadId, email } = req.body || {};
  console.log('[test-checkout] request received', { leadId, email });

  try {
    if (!leadId) {
      return res.status(400).json({ error: 'Missing leadId.' });
    }

    const leadRef = db.collection('leads').doc(leadId);
    let leadSnap;
    try {
      leadSnap = await leadRef.get();
    } catch (err) {
      console.error('[test-checkout] Firestore lookup failed:', err);
      return res.status(500).json({ error: 'Could not load order.' });
    }

    if (!leadSnap.exists) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // 1. Mark as paid
    await leadRef.update({
      status: 'paid',
      email: email || leadSnap.data().email || null
    });

    const leadData = { id: leadSnap.id, ...leadSnap.data(), email: email || leadSnap.data().email || null };
    const userEmail = leadData.email;

    const { verificationModels } = await getPipelineSettings(db);

    processLeadJob(leadData, { verificationModels })
      .then(async (result) => {
        await persistLeadProcessingResult({
          leadRef,
          leadId,
          result,
          gcsStorage: storage,
          userEmail,
          transporter,
          emailUser: process.env.EMAIL_USER,
        });
      })
      .catch((err) => {
        console.error('Job processing error:', err);
        leadRef.update({ status: 'failed', error: err.message, errorStack: err.stack });
      });

    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
    return res.json({ url: `${origin}/test?success=true` });

  } catch (err) {
    console.error('[test-checkout] failed:', err);
    return res.status(500).json({ error: err.message || 'Test checkout failed.' });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  const { leadId, email } = req.body || {};
  console.log('[checkout] request received', { leadId, email, databaseId: FIRESTORE_DATABASE_ID });

  try {
    if (!leadId) {
      return res.status(400).json({ error: 'Missing leadId.' });
    }

    console.log('[checkout] loading lead from Firestore', { leadId });
    let leadSnap;
    try {
      leadSnap = await db.collection('leads').doc(leadId).get();
    } catch (firestoreErr) {
      const hint = describeFirestoreError(firestoreErr.code);
      console.error('[checkout] Firestore lookup failed:', {
        code: firestoreErr.code,
        message: firestoreErr.message,
        hint,
        projectId: firebaseConfig.projectId,
        databaseId: FIRESTORE_DATABASE_ID,
      });
      const userFacing =
        firestoreErr.code === 7
          ? 'Server is missing permission to read your order from Firestore. The site administrator needs to grant the Cloud Run service account the `Cloud Datastore User` (`roles/datastore.user`) role.'
          : `We could not load your order from Firestore (${hint}). Please try again in a moment.`;
      return res.status(500).json({ error: userFacing });
    }

    if (!leadSnap.exists) {
      console.warn('[checkout] lead not found', { leadId });
      return res.status(404).json({ error: 'Lead not found. Please re-upload your file and try again.' });
    }
    const lead = leadSnap.data();

    console.log('[checkout] verifying price');
    const amount = calculatePrice(lead);
    const amountCents = Math.round(amount * 100);
    if (amountCents < 50 && amountCents > 0) {
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

    await leadRef.update({ stripeSessionId: session.id });

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
