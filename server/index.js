import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import admin from 'firebase-admin';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { processLeadJob } from './processing.js';
import { getAssistantReply } from './assistantChat.js';
import {
  triageHiveTask,
  spawnCursorAgent,
  startCursorRunPoller,
  findPreviousTaskForIteration,
} from './hiveOrchestrator.js';
import { isAutoMergeConfigured } from './hiveAutoMerge.js';
import { registerDeviceToken, sendBuildReadyPush } from './hivePush.js';
import { generateAppSpec } from './hiveSpecBuilder.js';
import {
  listUserApps,
  getUserApp,
  saveUserApp,
  deleteUserApp,
  normalizeAppSpec,
  searchCommunityToolkit,
  listCommunityToolkit,
  shareAppToCommunity,
  installCommunityApp,
  findToolkitMatch,
  getCommunityApp,
  getPublicToolkitApp,
  getStoreCatalog,
} from './hiveAppsApi.js';
import { listPublishedWebApps } from './hiveWebAppsRegistry.js';
import { listPlatformWebApps } from './platformWebApps.js';
import { getExampleApp, installExampleApp, listExampleApps } from './hiveExampleApps.js';
import { loadHiveMissionMarkdown } from '../shared/hiveMission.js';
import {
  ensureHiveUser,
  getHiveAccount,
  reserveBuildCredits,
  createCreditsCheckout,
  applyCreditPurchase,
  checkBuildCredits,
  createPlanCheckout,
} from './hiveBilling.js';
import { getPlan, listPlansForClient, TOKEN_MARKUP } from './hivePlans.js';
import { ensureUsagePeriod, setUserPlan, recordTokenUsage, checkTokenBudget } from './hiveUsage.js';
import { verifyHiveAuth } from './hiveAuth.js';
import { isHiveFreeBuildEmail } from './hiveAdmin.js';
import { priceEstimate, getPricingConfig, getAutoApproveDefaultUsd } from './hivePricing.js';
import { estimateCursorBuildCost } from './hiveCursorEstimate.js';
import { assertCanStartBuild, getBuildUsage, recordBuildStart } from './hiveBuildLimits.js';
import { createRagSourcesService, initRagSourcesService } from './ragSources.js';
import { createHomeworkRagService } from './homeworkRag.js';
import { completeHomeworkAssignment, extractAssignmentText } from './homeworkChat.js';
import { runOcrOnImages } from './ocr.js';
import {
  initSocialPostsService,
  handleSocialPostsRequest,
  runScheduledSocialPost,
} from './socialPosts/index.js';
import { startAutoposterScheduler } from './socialPosts/scheduler.js';
import { runIntelCloudTool, INTEL_CLOUD_TOOL_IDS, intelToolCostUsd } from './intelOsint.js';
import { runIntelResearchChat } from './intelResearchChat.js';
import { runIntelSynthesis } from './intelSynthesize.js';
import {
  FREE_INTEL_TOOL_IDS,
  resolveResearchDomain,
  runFreeIntelBatch,
  runFreeIntelTool,
} from './intelFreeTools.js';
import { inferIntelTargetType } from './intelDiscovery.js';
import { getFailureToolOffer } from './homeAssistOrchestrate.js';
import { extractDocumentText } from './intelDocuments.js';
import { getHomeAssistantKnowledgeMarkdown, runHomeAssistantWebSearch, runHomeAssistantChat } from './homeOrchestrator.js';
import { runProactiveDailyBrief, runProactiveInsights } from './proactiveBrief.js';
import { generateResumeKit } from './resumeBot.js';
import { runJobHunterSearch } from './jobHunter.js';
import { runSocialPostSearch, runTopicResearchBrief } from './socialHunter.js';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { processOcr } from './ocr.js';

dotenv.config({ path: '.env.local' });
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
const homeworkRagService = createHomeworkRagService({ db, gcsBucket });
initSocialPostsService({ db, bucket: gcsBucket });
startAutoposterScheduler();

const ragUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

/** Multipart homework OCR — avoids JSON/base64 payload limits (10–50 images per batch). */
const homeworkOcrUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 50,
    fieldSize: 4 * 1024 * 1024,
  },
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

// --- Admin auth (needed before large-body homework OCR route) ---
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

// --- OCR API ---
// Must be registered before global express.json() (default 100kb) so large image payloads work.
app.post('/api/ocr-process', express.json({ limit: '50mb' }), processOcr);

app.post(
  '/api/homework/ocr-ingest',
  verifyAdmin,
  (req, res, next) => {
    homeworkOcrUpload.array('files', 50)(req, res, (err) => {
      if (err) {
        const msg =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'An image exceeds 15MB. Use phone photos or JPEG — the app compresses before upload.'
            : err.code === 'LIMIT_FILE_COUNT'
              ? 'Maximum 50 images per upload batch.'
              : err.message || 'Upload failed';
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const createdBy = req.user.email;
      const files = req.files || [];
      if (!files.length) {
        return res.status(400).json({ error: 'No image files uploaded.' });
      }
      const format = req.body?.format || 'Markdown';
      const title = req.body?.title;
      const images = files.map((f) => f.buffer.toString('base64'));
      const pageCount = images.length;
      const text = await runOcrOnImages(images, format);
      const batchTitle =
        String(title || '').trim() ||
        `OCR reference (${pageCount} page${pageCount === 1 ? '' : 's'})`;
      const document = await homeworkRagService.addTextDocument(
        { title: batchTitle, text, source: 'ocr', pageCount },
        createdBy
      );
      return res.json({
        ok: true,
        document,
        pageCount,
        chars: text.length,
      });
    } catch (error) {
      console.error('[homework/ocr-ingest] error:', error);
      const status =
        error.message?.includes('Maximum') ||
        error.message?.includes('No images') ||
        error.message?.includes('GEMINI')
          ? 400
          : 500;
      return res.status(status).json({ error: error.message || 'OCR ingest failed' });
    }
  }
);

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

    if (session.metadata?.purpose === 'hive_credits' && session.metadata?.hiveUserId) {
      try {
        await applyCreditPurchase(db, {
          userId: session.metadata.hiveUserId,
          amountUsd: Number(session.metadata.creditAmountUsd) || 0,
          stripeSessionId: session.id,
        });
        console.log(`[hive] credits added for ${session.metadata.hiveUserId}`);
      } catch (err) {
        console.error('[hive] credit purchase failed:', err);
      }
      return res.json({ received: true });
    }

    if (session.metadata?.purpose === 'hive_plan' && session.metadata?.hiveUserId) {
      try {
        const planId = session.metadata.planId || 'starter';
        const plan = getPlan(planId);
        await setUserPlan(db, session.metadata.hiveUserId, planId, {
          applyStarterCredit: plan.interval === 'once',
          stripeCustomerId: session.customer ?? null,
          stripeSubscriptionId: session.subscription ?? null,
        });
        if (plan.interval === 'once') {
          await db.collection('hive_ledger').doc().set({
            userId: session.metadata.hiveUserId,
            type: 'plan_purchase',
            planId,
            amountUsd: plan.priceUsd,
            summary: `AiBhive ${plan.name} plan`,
            stripeSessionId: session.id,
            createdAt: new Date().toISOString(),
          });
        }
        console.log(`[hive] plan ${planId} activated for ${session.metadata.hiveUserId}`);
      } catch (err) {
        console.error('[hive] plan purchase failed:', err);
      }
      return res.json({ received: true });
    }

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
              const bucketName = 'aibhive-media';
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
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const userId = sub.metadata?.hiveUserId;
    if (userId) {
      try {
        await setUserPlan(db, userId, 'free', { stripeSubscriptionId: null });
        console.log(`[hive] subscription ended — ${userId} on free plan`);
      } catch (err) {
        console.error('[hive] subscription downgrade failed:', err);
      }
    }
  }

  res.send();
});

// Regular JSON middleware for other endpoints
// Resume kit — large base64 payloads (resume PDF + job screenshots)
app.post('/api/hive/resume/generate', express.json({ limit: '12mb' }), async (req, res) => {
  try {
    const authUser = await verifyHiveAuth(req);
    const { userId, ...payload } = req.body || {};
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId) {
      return res.status(400).json({ error: 'userId required.' });
    }
    await ensureHiveUser(db, resolvedUserId);
    const result = await generateResumeKit(db, resolvedUserId, payload);
    if (!result.ok) {
      const status = result.needPayment ? 402 : 400;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[hive/resume/generate]', err);
    return res.status(500).json({ error: err.message || 'Resume generation failed.' });
  }
});

app.post('/api/hive/job-hunter/search', express.json(), async (req, res) => {
  try {
    const authUser = await verifyHiveAuth(req);
    const { userId, criteria, resumes } = req.body || {};
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId) return res.status(400).json({ ok: false, error: 'userId required.' });
    await ensureHiveUser(db, resolvedUserId);
    const result = await runJobHunterSearch(db, resolvedUserId, criteria || {}, resumes || []);
    if (!result.ok) {
      const status = result.needPayment ? 402 : 400;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[hive/job-hunter/search]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Job search failed.' });
  }
});

app.post('/api/hive/social-hunter/search', express.json(), async (req, res) => {
  try {
    const authUser = await verifyHiveAuth(req);
    const { userId, criteria } = req.body || {};
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId) return res.status(400).json({ ok: false, error: 'userId required.' });
    await ensureHiveUser(db, resolvedUserId);
    const result = await runSocialPostSearch(db, resolvedUserId, criteria || {});
    if (!result.ok) {
      const status = result.needPayment ? 402 : 400;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[hive/social-hunter/search]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Post search failed.' });
  }
});

app.post('/api/hive/social-hunter/research', express.json(), async (req, res) => {
  try {
    const authUser = await verifyHiveAuth(req);
    const { userId, topics } = req.body || {};
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId) return res.status(400).json({ ok: false, error: 'userId required.' });
    await ensureHiveUser(db, resolvedUserId);
    const result = await runTopicResearchBrief(db, resolvedUserId, topics);
    if (!result.ok) {
      const status = result.needPayment ? 402 : 400;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[hive/social-hunter/research]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Research failed.' });
  }
});

app.use(express.json());

// Lightweight health check for local dev / sandbox smoke tests
app.get('/api/health', async (_req, res) => {
  let firestoreOk = false;
  let firestoreError = null;
  try {
    const probe = db.collection('leads').limit(1).get();
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore probe timed out (check GOOGLE_APPLICATION_CREDENTIALS)')), 3000)
    );
    await Promise.race([probe, timeout]);
    firestoreOk = true;
  } catch (err) {
    firestoreError = err.message || String(err);
  }
  return res.json({
    ok: true,
    uptimeSec: Math.round(process.uptime()),
    port: Number(process.env.PORT) || 8080,
    env: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      grok: Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      googleCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    },
    firestore: { ok: firestoreOk, error: firestoreError },
  });
});

// --- Admin API (uses named Firestore DB — same as checkout) ---

app.get('/api/intel-gathering/dbpr', async (req, res) => {
  try {
    const limit = 100;
    let snapshot;
    try {
      snapshot = await db.collection('intel_dbpr_records').limit(limit).get();
    } catch (dbError) {
      console.error('Initial DB fetch failed (possibly missing ADC credentials):', dbError.message);
      // Fallback for local testing or credential issues
      const fallbackApp = admin.apps.find(a => a.name === 'fallback_adc') || admin.initializeApp({}, 'fallback_adc');
      const defaultDb = getFirestore(fallbackApp);
      try {
        snapshot = await defaultDb.collection('intel_dbpr_records').limit(limit).get();
      } catch (fallbackError) {
        console.error('Fallback DB fetch failed:', fallbackError.message);
        // If both fail, return empty records instead of 500 to avoid breaking the UI
        return res.json({ records: [] });
      }
    }

    if (!snapshot) {
      return res.json({ records: [] });
    }

    const records = [];
    snapshot.forEach(doc => {
      records.push({ id: doc.id, ...doc.data() });
    });

    res.json({ records });
  } catch (error) {
    console.error('Error in DBPR records endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch DBPR records' });
  }
});

app.post('/api/intel-gathering/firecrawl', express.json(), async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Firecrawl API key is not configured' });
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown']
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`, { cause: errorData });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error calling Firecrawl:', error);
    res.status(500).json({ error: 'Failed to scrape URL' });
  }
});

/** Hive Cloud Intel — SerpAPI / Firecrawl via server keys (never hits google.com directly). */
app.get('/api/intel-gathering/tool-registry', (_req, res) => {
  res.json({
    freeTools: FREE_INTEL_TOOL_IDS.map((id) => ({
      id,
      tier: 'free',
      name: id.replace(/_/g, ' '),
    })),
    cloudTools: INTEL_CLOUD_TOOL_IDS,
    costsUsd: Object.fromEntries(INTEL_CLOUD_TOOL_IDS.map((id) => [id, intelToolCostUsd(id)])),
  });
});

app.get('/api/intel-gathering/cloud-tools', (_req, res) => {
  res.json({
    tools: INTEL_CLOUD_TOOL_IDS,
    costsUsd: Object.fromEntries(INTEL_CLOUD_TOOL_IDS.map((id) => [id, intelToolCostUsd(id)])),
  });
});

app.post('/api/intel-gathering/cloud-tool', express.json(), async (req, res) => {
  try {
    const { userId, toolId, params } = req.body ?? {};
    if (!userId || !toolId) {
      return res.status(400).json({ error: 'userId and toolId are required' });
    }
    if (!INTEL_CLOUD_TOOL_IDS.includes(toolId)) {
      return res.status(400).json({ error: 'Unsupported cloud tool' });
    }
    await ensureHiveUser(db, userId);
    const result = await runIntelCloudTool(db, { checkTokenBudget, recordTokenUsage }, {
      userId,
      toolId,
      params: params ?? {},
    });
    if (!result.ok && (result.needPayment || result.needUpgrade)) {
      return res.status(402).json(result);
    }
    if (!result.ok) {
      return res.status(500).json({ error: result.error ?? 'Cloud tool failed' });
    }
    res.json(result);
  } catch (error) {
    console.error('[intel/cloud-tool]', error);
    res.status(500).json({ error: 'Intel cloud tool failed' });
  }
});

/** Free OSINT tools — server-side (no browser CORS), no Hive credits (osint_on_device). */
app.post('/api/intel-gathering/run-free', express.json(), async (req, res) => {
  try {
    const { userId, toolId, toolIds, params } = req.body ?? {};
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }
    const label = String(params?.company || params?.label || '').trim();
    const userIntent = String(params?.userIntent || label || '').trim();
    const targetType =
      params?.targetType && params.targetType !== 'company'
        ? params.targetType
        : inferIntelTargetType(label, userIntent);
    const company = label || userIntent;
    const domain =
      targetType === 'discovery' ? '' : resolveResearchDomain(company, targetType, params?.domain);
    const ctx = {
      targetType,
      domain,
      company,
      userIntent,
      region: params?.restrictToRegion
        ? { restrictToRegion: true, location: params?.location || '' }
        : undefined,
    };

    if (Array.isArray(toolIds) && toolIds.length) {
      const ids = toolIds.filter((id) => FREE_INTEL_TOOL_IDS.includes(id));
      const results = await runFreeIntelBatch(ids, ctx);
      return res.json({ ok: true, results, domain });
    }

    if (!toolId || !FREE_INTEL_TOOL_IDS.includes(toolId)) {
      return res.status(400).json({ error: 'Invalid free toolId' });
    }
    const out = await runFreeIntelTool(toolId, ctx);
    return res.json({ ok: true, toolId, status: 'done', ...out, domain });
  } catch (error) {
    console.error('[intel/run-free]', error);
    return res.status(500).json({ error: error.message || 'Free OSINT tool failed' });
  }
});

/** Parse uploaded .txt / .pdf for Grok research analysis */
app.post('/api/intel-gathering/parse-document', express.json({ limit: '8mb' }), async (req, res) => {
  try {
    const { name, mimeType, base64 } = req.body ?? {};
    if (!base64) return res.status(400).json({ error: 'base64 required' });
    const text = await extractDocumentText({ name, mimeType, base64 });
    return res.json({ ok: true, name: name || 'document', text, chars: text.length });
  } catch (error) {
    console.error('[intel/parse-document]', error);
    return res.status(400).json({ error: error.message || 'Document parse failed' });
  }
});

/** Intel Agent Grok/Gemini chat — same Hive credit pricing as mobile cloud intel. */
app.post('/api/intel-gathering/chat', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { userId, message, history, systemInstruction, targetContext, documentContext } = req.body ?? {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId || !message?.trim()) {
      return res.status(400).json({ error: 'userId and message required.' });
    }
    await ensureHiveUser(db, resolvedUserId);
    const sys = targetContext
      ? `${systemInstruction || ''}\n\nCURRENT RESEARCH TARGET:\n${String(targetContext).slice(0, 4000)}`
      : systemInstruction;
    const result = await runIntelResearchChat(db, resolvedUserId, {
      message: message.trim(),
      history: history || [],
      systemInstruction: sys,
      targetContext,
      documentContext,
    });
    if (!result.ok) {
      const status = result.needPayment ? 402 : 502;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (error) {
    console.error('[intel/chat]', error);
    return res.status(500).json({ error: 'Intel chat failed.' });
  }
});

/** Grok synthesis — filter raw OSINT noise; return inquiry-relevant findings only. */
app.post('/api/intel-gathering/synthesize', express.json({ limit: '4mb' }), async (req, res) => {
  try {
    const { userId, target, toolResults, userIntent, documentContext } = req.body ?? {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId || !target) {
      return res.status(400).json({ error: 'userId and target required.' });
    }
    await ensureHiveUser(db, resolvedUserId);
    const result = await runIntelSynthesis(db, resolvedUserId, {
      target,
      toolResults: toolResults || [],
      userIntent,
      documentContext,
    });
    if (!result.ok) {
      const status = result.needPayment ? 402 : 502;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (error) {
    console.error('[intel/synthesize]', error);
    return res.status(500).json({ error: 'Intel synthesis failed.' });
  }
});

/** When built-in tools cannot complete a task — offer community install or custom build. */
app.post('/api/hive/orchestrate/failure-offer', express.json(), async (req, res) => {
  try {
    const { userId, query, reason } = req.body ?? {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId || !query?.trim()) {
      return res.status(400).json({ error: 'userId and query required.' });
    }
    await ensureHiveUser(db, resolvedUserId);
    const offer = await getFailureToolOffer(db, query.trim(), String(reason || '').trim());
    return res.json(offer);
  } catch (err) {
    console.error('[hive/orchestrate/failure-offer]', err);
    return res.status(500).json({ error: err.message || 'Failure offer failed.' });
  }
});

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
    const settingsDoc = await db.collection('system').doc('settings').get();
    if (!settingsDoc.exists) {
      return res.json({ settings: { preferredModel: 'gemini' } });
    }
    return res.json({ settings: settingsDoc.data() });
  } catch (error) {
    console.error('[admin/settings] GET error:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const { preferredModel } = req.body;
    if (!['gemini', 'claude', 'grok'].includes(preferredModel)) {
      return res.status(400).json({ error: 'Invalid model preference' });
    }

    await db.collection('system').doc('settings').set(
      { preferredModel, updatedAt: FieldValue.serverTimestamp(), updatedBy: req.user.email },
      { merge: true }
    );
    return res.json({ success: true, settings: { preferredModel } });
  } catch (error) {
    console.error('[admin/settings] POST error:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
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

app.delete('/api/admin/rag-sources/:id', verifyAdmin, async (req, res) => {
  try {
    await ragSourcesService.deleteSource(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    console.error('[admin/rag-sources/delete] error:', error);
    return res.status(400).json({ error: error.message || 'Failed to delete source' });
  }
});

// --- Homework RAG (admin-only, private assignment completion) ---
app.get('/api/homework/documents', verifyAdmin, async (req, res) => {
  try {
    const documents = await homeworkRagService.listDocuments(req.user.email);
    return res.json({ documents });
  } catch (error) {
    console.error('[homework/documents] GET error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list documents' });
  }
});

app.get('/api/homework/documents/:id/view', verifyAdmin, async (req, res) => {
  try {
    const document = await homeworkRagService.getDocumentText(req.params.id, req.user.email);
    return res.json({ document });
  } catch (error) {
    console.error('[homework/documents/view] error:', error);
    return res.status(error.message === 'Document not found.' ? 404 : 500).json({
      error: error.message || 'Failed to load document',
    });
  }
});

app.post(
  '/api/homework/documents',
  verifyAdmin,
  ragUpload.single('file'),
  async (req, res) => {
    try {
      const createdBy = req.user.email;

      if (req.body?.text?.trim()) {
        const document = await homeworkRagService.addTextDocument(
          { title: req.body.title || 'Untitled', text: req.body.text },
          createdBy
        );
        return res.json({ document });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Upload a file or provide text.' });
      }

      const ext = path.extname(req.file.originalname || '').toLowerCase();
      const mimeByExt = {
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.csv': 'text/csv',
      };
      const mimeType =
        mimeByExt[ext] ||
        (req.file.mimetype && req.file.mimetype !== 'application/octet-stream'
          ? req.file.mimetype
          : 'text/plain');
      const title = req.body.title || req.file.originalname;
      const document = await homeworkRagService.addDocument(
        {
          title,
          buffer: req.file.buffer,
          mimeType,
          originalFilename: req.file.originalname,
        },
        createdBy
      );
      return res.json({ document });
    } catch (error) {
      console.error('[homework/documents] POST error:', error);
      return res.status(400).json({ error: error.message || 'Failed to upload document' });
    }
  }
);

app.delete('/api/homework/documents/:id', verifyAdmin, async (req, res) => {
  try {
    await homeworkRagService.deleteDocument(req.params.id, req.user.email);
    return res.json({ success: true });
  } catch (error) {
    console.error('[homework/documents] DELETE error:', error);
    return res.status(400).json({ error: error.message || 'Failed to delete document' });
  }
});

app.post('/api/homework/complete', verifyAdmin, async (req, res) => {
  try {
    const createdBy = req.user.email;
    let assignmentText = String(req.body?.assignmentText || '').trim();

    if (!assignmentText && req.body?.assignmentBase64) {
      assignmentText = await extractAssignmentText({
        name: req.body.assignmentName || 'assignment.txt',
        mimeType: req.body.assignmentMimeType || 'text/plain',
        base64: req.body.assignmentBase64,
      });
    }

    const ragContext = await homeworkRagService.buildRagContext(createdBy);
    const customPrompt = String(req.body?.customPrompt || '').trim();
    const result = await completeHomeworkAssignment(assignmentText, ragContext, customPrompt);
    if (!result.ok) {
      return res.status(400).json({ error: result.error || 'Completion failed' });
    }
    return res.json(result);
  } catch (error) {
    console.error('[homework/complete] error:', error);
    return res.status(500).json({ error: error.message || 'Homework completion failed' });
  }
});

// --- AutoPoster API (Google admin auth, runs on Cloud Run with GEMINI_API_KEY) ---
app.all('/api/autoposter', verifyAdmin, async (req, res) => {
  try {
    const { status, data } = await handleSocialPostsRequest(req, req.user);
    return res.status(status).json(data);
  } catch (error) {
    console.error('[autoposter] error:', error);
    return res.status(500).json({ error: error.message || 'AutoPoster request failed' });
  }
});

// Cloud Scheduler hook (optional) — POST with X-Cron-Secret header
app.post('/api/autoposter/cron', async (req, res) => {
  const secret = process.env.AUTOPOSTER_CRON_SECRET;
  if (secret) {
    const provided = req.get('X-Cron-Secret') || req.get('x-cron-secret') || '';
    if (provided !== secret) {
      return res.status(401).json({ error: 'Unauthorized cron request' });
    }
  }
  try {
    const result = await runScheduledSocialPost();
    return res.json({
      ok: true,
      skipped: result.skipped,
      reason: result.reason,
      date: result.post?.date,
    });
  } catch (error) {
    console.error('[autoposter/cron] error:', error);
    return res.status(500).json({ error: error.message || 'Scheduler failed' });
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

    // 2. Process job directly
    processLeadJob(leadData).then(async (result) => {
      if (result.success) {

        let gcsCleanTextUrl = null;
        let gcsAnnotatedTextUrl = null;
        let gcsAudioUrl = null;

        const urlOptions = {
          version: 'v4',
          action: 'read',
          expires: Date.now() + 72 * 60 * 60 * 1000,
        };

        try {
          const bucketName = 'aibhive-media'; // Assumed from context
          const cleanTextFilename = `clean_output_${leadId}.txt`;
          const cleanTextFile = storage.bucket(bucketName).file(cleanTextFilename);
          await cleanTextFile.save(result.cleanTranslatedText, { contentType: 'text/plain' });
          const [cleanUrl] = await cleanTextFile.getSignedUrl(urlOptions);
          gcsCleanTextUrl = cleanUrl;

          const annotatedTextFilename = `annotated_output_${leadId}.txt`;
          const annotatedTextFile = storage.bucket(bucketName).file(annotatedTextFilename);
          await annotatedTextFile.save(result.annotatedText, { contentType: 'text/plain' });
          const [annotatedUrl] = await annotatedTextFile.getSignedUrl(urlOptions);
          gcsAnnotatedTextUrl = annotatedUrl;

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

        await leadRef.update({
          status: 'completed',
          rawTranscript: result.originalText || null,
          finalOutputTextUrl: gcsAnnotatedTextUrl,
          cleanTranslatedTextUrl: gcsCleanTextUrl,
          annotatedTextUrl: gcsAnnotatedTextUrl,
          finalAudioUrl: gcsAudioUrl || null,
          voiceModelId: result.voiceModelId || null,
          translatedTitle: result.translatedTitle || null,
          translatedSummary: result.translatedSummary || null,
          flags: result.flags || []
        });

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

    console.log('[checkout] session created', { id: session.id });
    return res.json({ url: session.url });
  } catch (err) {
    console.error('[checkout] failed:', err);
    return res.status(500).json({ error: err.message || 'Checkout failed.' });
  }
});

// --- Hive Magic: self-evolving task orchestrator ---
const HIVE_TASKS = 'hive_tasks';

app.get('/api/hive/status', async (_req, res) => {
  const cursorConfigured = !!process.env.CURSOR_API_KEY;
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY && !String(process.env.STRIPE_SECRET_KEY).startsWith('sk_test_123');
  const autoMergeConfigured = isAutoMergeConfigured();
  let usage = null;
  try {
    usage = await getBuildUsage(db);
  } catch {
    // non-fatal
  }
  return res.json({
    online: geminiConfigured,
    cursorConfigured,
    stripeConfigured,
    autoMergeConfigured,
    triageModel: process.env.HIVE_TRIAGE_MODEL || 'gemini-2.5-flash',
    buildModel: process.env.HIVE_CURSOR_MODEL || 'composer-2.5',
    pricing: getPricingConfig(),
    plans: listPlansForClient(),
    tokenMarkup: TOKEN_MARKUP,
    autoApproveDefaultUsd: getAutoApproveDefaultUsd(),
    buildUsage: usage,
    message: !geminiConfigured
      ? 'Server missing GEMINI_API_KEY'
      : cursorConfigured
        ? autoMergeConfigured
          ? 'Hive + Cursor + auto-merge ready'
          : 'Hive + Cursor ready (set HIVE_GITHUB_TOKEN to auto-merge)'
        : 'Hive ready; set CURSOR_API_KEY to enable builds',
  });
});

app.get('/api/hive/mission', (_req, res) => {
  const markdown = loadHiveMissionMarkdown();
  return res.json({
    version: '1.1',
    markdown,
    updatedAt: new Date().toISOString(),
  });
});

app.post('/api/hive/auth/register', async (req, res) => {
  try {
    const authUser = await verifyHiveAuth(req);
    if (!authUser) return res.status(401).json({ error: 'Invalid or missing auth token.' });

    const { userId, email } = req.body || {};
    const uid = authUser.uid;
    if (userId && userId !== uid) {
      return res.status(400).json({ error: 'userId must match authenticated uid.' });
    }

    const account = await ensureHiveUser(db, uid);
    if (email || authUser.email) {
      await db.collection('hive_users').doc(uid).set(
        { email: email || authUser.email, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }

    return res.json({
      account: {
        userId: uid,
        creditBalanceUsd: account.creditBalanceUsd,
        welcomeCreditUsd: Number(process.env.HIVE_WELCOME_CREDIT_USD ?? 0),
      },
    });
  } catch (err) {
    console.error('[hive/auth/register]', err);
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

app.get('/api/hive/plans', (_req, res) => {
  res.json({
    plans: listPlansForClient(),
    tokenMarkup: TOKEN_MARKUP,
    currencyName: 'AiBhive Tokens',
    freeFeatures: [
      'On-device OSINT (no tokens)',
      'Job tracker & resume tools',
      'Build & chat with your own API keys',
    ],
  });
});

app.get('/api/hive/home-assist/knowledge', (_req, res) => {
  try {
    const markdown = getHomeAssistantKnowledgeMarkdown();
    return res.json({ markdown, updatedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Knowledge unavailable.' });
  }
});

app.post('/api/hive/home-assist/web-search', express.json(), async (req, res) => {
  try {
    const { userId, query } = req.body || {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId || !query?.trim()) {
      return res.status(400).json({ error: 'userId and query required.' });
    }
    await ensureHiveUser(db, resolvedUserId);
    const result = await runHomeAssistantWebSearch(db, resolvedUserId, query.trim());
    if (!result.ok) {
      const status = result.needPayment ? 402 : 502;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[hive/home-assist/web-search]', err);
    return res.status(500).json({ error: err.message || 'Web search failed.' });
  }
});

app.post('/api/hive/home-assist/chat', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const {
      userId,
      history,
      message,
      systemInstruction,
      attachmentBase64,
      attachmentMime,
      attachmentWidth,
      attachmentHeight,
    } = req.body || {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId || !message?.trim()) {
      return res.status(400).json({ error: 'userId and message required.' });
    }
    await ensureHiveUser(db, resolvedUserId);
    const result = await runHomeAssistantChat(db, resolvedUserId, {
      history: history || [],
      message: message.trim(),
      systemInstruction: systemInstruction || '',
      failureContext: req.body?.failureContext || '',
      attachment:
        attachmentBase64 && typeof attachmentBase64 === 'string'
          ? {
              base64: attachmentBase64,
              mime: attachmentMime || 'image/jpeg',
              width: attachmentWidth || null,
              height: attachmentHeight || null,
            }
          : null,
    });
    if (!result.ok) {
      const status = result.needPayment ? 402 : 502;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[hive/home-assist/chat]', err);
    return res.status(500).json({ error: err.message || 'Home chat failed.' });
  }
});

app.post('/api/hive/proactive/daily-brief', express.json(), async (req, res) => {
  try {
    const { userId, snapshot } = req.body || {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId) {
      return res.status(400).json({ error: 'userId required.' });
    }
    await ensureHiveUser(db, resolvedUserId);
    const result = await runProactiveDailyBrief(db, resolvedUserId, snapshot);
    if (!result.ok) {
      const status = result.needPayment ? 402 : 502;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[hive/proactive/daily-brief]', err);
    return res.status(500).json({ error: err.message || 'Daily brief failed.' });
  }
});

app.post('/api/hive/proactive/insights', express.json(), async (req, res) => {
  try {
    const { userId, snapshot } = req.body || {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId) {
      return res.status(400).json({ error: 'userId required.' });
    }
    await ensureHiveUser(db, resolvedUserId);
    const result = await runProactiveInsights(db, resolvedUserId, snapshot);
    if (!result.ok) {
      const status = result.needPayment ? 402 : 502;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error('[hive/proactive/insights]', err);
    return res.status(500).json({ error: err.message || 'Insights failed.' });
  }
});

app.post('/api/hive/account/:userId/plan-checkout', async (req, res) => {
  try {
    const { planId, successUrl, cancelUrl } = req.body || {};
    if (!planId || planId === 'free') {
      return res.status(400).json({ error: 'planId required (starter, pro, unlimited).' });
    }
    await ensureHiveUser(db, req.params.userId);
    const session = await createPlanCheckout(stripe, {
      userId: req.params.userId,
      planId,
      successUrl,
      cancelUrl,
    });
    return res.json({ checkoutUrl: session.url, planId });
  } catch (err) {
    console.error('[hive/plan-checkout]', err);
    return res.status(500).json({ error: err.message || 'Plan checkout failed.' });
  }
});

app.get('/api/hive/account/:userId', async (req, res) => {
  try {
    const account = await getHiveAccount(db, req.params.userId);
    return res.json({ account });
  } catch (err) {
    console.error('[hive/account] get error:', err);
    return res.status(400).json({ error: err.message || 'Could not load account.' });
  }
});

app.post('/api/hive/account/:userId/checkout', async (req, res) => {
  try {
    const { amountUsd, successUrl, cancelUrl } = req.body || {};
    await ensureHiveUser(db, req.params.userId);
    const session = await createCreditsCheckout(stripe, {
      userId: req.params.userId,
      amountUsd: amountUsd ?? 10,
      taskId: '',
      successUrl,
      cancelUrl,
    });
    return res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error('[hive/account] checkout error:', err);
    return res.status(500).json({ error: err.message || 'Checkout failed.' });
  }
});

app.post('/api/hive/tasks/:taskId/prepare-pay', async (req, res) => {
  try {
    const { userId, amountUsd } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required.' });

    const cost = Number(amountUsd) || 0;
    const check = await checkBuildCredits(db, userId, cost);

    if (check.ok) {
      return res.json({ ready: true, creditBalanceUsd: check.creditBalanceUsd });
    }

    const session = await createCreditsCheckout(stripe, {
      userId,
      amountUsd: check.amountUsd,
      taskId: req.params.taskId,
    });
    return res.json({
      ready: false,
      needPayment: true,
      amountUsd: check.amountUsd,
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error('[hive/tasks] prepare-pay error:', err);
    return res.status(500).json({ error: err.message || 'Payment check failed.' });
  }
});

app.post('/api/hive/tasks', async (req, res) => {
  try {
    const { message, userId, attachmentBase64, attachmentMime, attachmentWidth, attachmentHeight } =
      req.body || {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId || 'anonymous';
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message is too long.' });
    }

    const previous = await findPreviousTaskForIteration(db, resolvedUserId, message.trim());
    const triage = await triageHiveTask(message.trim(), { previous });
    const taskId = `hive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const freeBuild = Boolean(authUser?.email && isHiveFreeBuildEmail(authUser.email));
    const isIteration = triage.target === 'iteration';
    const buildMethod = triage.buildMethod || (triage.target === 'host_screen' ? 'spec' : 'cursor');
    const isSpecBuild = buildMethod === 'spec' && triage.route !== 'clarify';

    let buildPrompt = triage.buildPrompt || message.trim();
    if (attachmentBase64 && typeof attachmentBase64 === 'string') {
      if (attachmentBase64.length > 900_000) {
        return res.status(400).json({ error: 'Image attachment is too large. Try a smaller screenshot.' });
      }
      buildPrompt += `\n\nUser attached a reference image (${attachmentWidth || '?'}x${attachmentHeight || '?'}). Match layout, colors, and icon style where it helps.`;
    }
    if (isIteration && previous) {
      buildPrompt += `\n\nThis is an ITERATION on the previous build with slug "${previous.slug}" (task ${previous.taskId}). Edit existing files for that slug; do not create a parallel folder.`;
    }

    let status = 'complete';
    let reply = triage.localReply || triage.summary;
    let estimateBase = null;
    let estimate = triage.estimate || null;
    let cursorEstimateMeta = null;
    let appId = null;
    let appSpec = null;

    if (triage.route === 'clarify') {
      status = 'clarify';
      reply = triage.clarifyingQuestion || triage.summary;
    } else if (isSpecBuild) {
      if (!isIteration) {
      const toolkitHit = await findToolkitMatch(db, message.trim());
      if (toolkitHit && resolvedUserId && resolvedUserId !== 'anonymous') {
        const installed = await installCommunityApp(db, resolvedUserId, toolkitHit.id);
        if (installed.ok) {
          appId = installed.app.id;
          appSpec = installed.app;
          status = 'complete';
          estimate = { costUsd: 0, minutes: 0 };
          reply =
            `Great news — the community already built something close!\n\n` +
            `"${toolkitHit.title}" is now in My Apps (free install from the AiBhive toolkit).\n\n` +
            `${toolkitHit.summary || toolkitHit.tagline || ''}\n\n` +
            `Open it, use it, or ask me to tweak it if you want changes.`;
        }
      }
      }

      if (!appSpec) {
      // INSTANT path — no Cursor, no Play Store update.
      // Charge a small fixed fee (the "spec" tier) and write a HiveAppSpec
      // doc that the mobile app renders dynamically.
      const priced = priceEstimate(
        { costUsd: 0, minutes: 0 },
        { free: freeBuild, iteration: isIteration, target: 'host_screen', buildMethod: 'spec' }
      );
      estimate = priced.user;
      estimateBase = priced.base;
      const cost = priced.user.costUsd;

      // If signed-in, reserve credits up-front for the spec build. If they
      // don't have the credit we still let it through for free this turn
      // (welcome credit covers it), but record the charge in their ledger.
      if (resolvedUserId && resolvedUserId !== 'anonymous' && !freeBuild && cost > 0) {
        try {
          await reserveBuildCredits(db, resolvedUserId, taskId, cost);
        } catch {
          // Insufficient credit — still allow this build (it's <= $1) but
          // log so we can surface a soft warning.
        }
      }

      let previousSpec = null;
      if (isIteration && previous?.appId) {
        try {
          previousSpec = await getUserApp(db, resolvedUserId, previous.appId);
        } catch {
          previousSpec = null;
        }
      }
      try {
        appSpec = await generateAppSpec({
          message: message.trim(),
          ownerId: resolvedUserId,
          slug: triage.slug,
          title: triage.title,
          previous: previousSpec,
          sourceTaskId: taskId,
        });
      } catch (err) {
        console.error('[hive/tasks] spec build failed, falling back to cursor:', err.message);
        // Fall back to Cursor path on spec failure.
        appSpec = null;
      }

      if (appSpec) {
        try {
          const saved = await saveUserApp(db, appSpec.ownerId, appSpec);
          appId = saved.id;
        } catch (err) {
          console.error('[hive/tasks] saving spec failed:', err.message);
          appSpec = null;
        }
      }

      if (appSpec) {
        status = 'complete';
        const priceLine = freeBuild || cost === 0 ? 'Free' : `$${cost.toFixed(2)}`;
        reply = `${priceLine} · "${appSpec.title}" is ready — open it from My Apps.\n\n${appSpec.summary || appSpec.tagline || ''}`;
      } else {
        // Spec build failed; ask for clarification instead of silently
        // routing through Cursor (which would charge much more).
        status = 'clarify';
        reply = 'I had trouble drafting that one. Try describing it as a list, tracker, note, calculator, or info page — or add a screenshot.';
      }
      }
    } else if (triage.route === 'cursor') {
      status = 'awaiting_approval';
      const cursorEst = await estimateCursorBuildCost({
        message: message.trim(),
        buildPrompt,
        summary: triage.summary,
      });
      cursorEstimateMeta = cursorEst;
      const priced = priceEstimate(
        { costUsd: cursorEst.costUsd, minutes: cursorEst.minutes },
        {
          free: freeBuild,
          iteration: isIteration,
          target: triage.target,
          buildMethod: 'cursor',
        }
      );
      const cost = priced.user.costUsd;
      const mins = priced.user.minutes;
      const priceLine = freeBuild
        ? 'Free for your account (beta testing)'
        : cost < 1
          ? `About $${cost.toFixed(2)}`
          : `About $${cost}`;
      const targetLine =
        triage.target === 'play_store'
          ? 'I\'ll make this Play-Store-ready (signed AAB + listing assets + step-by-step Play Console walkthrough).'
          : triage.target === 'native_app'
            ? 'I\'ll scaffold a standalone branded APK you can install directly.'
            : triage.target === 'web_app'
              ? 'I\'ll ship this as a shareable web app at a personal URL.'
              : isIteration
                ? `I\'ll iterate on your "${previous?.slug}" build.`
                : 'I\'ll build it as a custom in-app feature (advanced — most apps only need the spec build).';
      reply = `Custom build available.\n\n${triage.summary}\n${targetLine}\n\n${priceLine} · about ${mins} minutes\n\nTap Approve & Build when you're ready.`;
      estimate = priced.user;
      estimateBase = priced.base;
      if (freeBuild) triage.freeBuild = true;
    }

    const doc = {
      id: taskId,
      message: message.trim(),
      userId: resolvedUserId,
      route: triage.route,
      target: triage.target,
      buildMethod,
      slug: triage.slug,
      title: triage.title,
      appId,
      previousTaskId: isIteration && previous ? previous.taskId : null,
      status,
      summary: triage.summary,
      estimate: estimate || null,
      estimateBase: estimateBase || null,
      cursorEstimate: cursorEstimateMeta,
      freeBuild: triage.freeBuild || false,
      buildPrompt,
      attachment:
        attachmentBase64 && typeof attachmentBase64 === 'string'
          ? {
              mime: attachmentMime || 'image/jpeg',
              width: attachmentWidth || null,
              height: attachmentHeight || null,
              base64: attachmentBase64,
            }
          : null,
      reply,
      deliverable: appSpec
        ? {
            kind: 'spec_app',
            appId,
            slug: appSpec.slug,
            title: appSpec.title,
            label: 'Open your app',
          }
        : null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(HIVE_TASKS).doc(taskId).set(doc);

    // Fire a push if this was an instant spec build that already shipped.
    if (status === 'complete' && appSpec && resolvedUserId && resolvedUserId !== 'anonymous') {
      try {
        await sendBuildReadyPush(db, doc, doc);
      } catch (err) {
        console.warn('[hive/tasks] push send failed:', err.message);
      }
    }

    return res.json({ task: doc, app: appSpec ? { id: appId, ...appSpec } : null });
  } catch (err) {
    console.error('[hive/tasks] create error:', err);
    return res.status(500).json({ error: err.message || 'Hive task failed.' });
  }
});

app.get('/api/hive/tasks/:taskId', async (req, res) => {
  try {
    const snap = await db.collection(HIVE_TASKS).doc(req.params.taskId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Task not found.' });
    return res.json({ task: snap.data() });
  } catch (err) {
    console.error('[hive/tasks] get error:', err);
    return res.status(500).json({ error: 'Could not load task.' });
  }
});

app.post('/api/hive/tasks/:taskId/approve', async (req, res) => {
  try {
    const ref = db.collection(HIVE_TASKS).doc(req.params.taskId);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Task not found.' });

    const task = snap.data();
    if (task.status !== 'awaiting_approval') {
      return res.status(400).json({ error: 'Task is not awaiting approval.' });
    }

    const userId = task.userId || req.body?.userId;
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;

    const cost = task.estimate?.costUsd ?? 0;
    const capacity = await assertCanStartBuild(db, resolvedUserId || 'anonymous', cost);
    if (!capacity.ok) {
      return res.status(429).json({ error: capacity.reason, buildUsage: capacity.usage });
    }

    const skipCharge = cost === 0 || task.freeBuild;
    if (resolvedUserId && resolvedUserId !== 'anonymous' && !skipCharge) {
      const reservation = await reserveBuildCredits(db, resolvedUserId, task.id, cost);
      if (!reservation.ok) {
        const session = await createCreditsCheckout(stripe, {
          userId: resolvedUserId,
          amountUsd: reservation.amountUsd,
          taskId: task.id,
        });
        return res.status(402).json({
          error: 'Insufficient Hive credit.',
          needPayment: true,
          amountUsd: reservation.amountUsd,
          checkoutUrl: session.url,
        });
      }
    }

    const cursor = await spawnCursorAgent(task.buildPrompt || task.message, task.id, {
      target: task.target || 'host_screen',
      slug: task.slug,
      title: task.title,
      userId: resolvedUserId,
    });
    await recordBuildStart(db, resolvedUserId || 'anonymous', cost);
    const now = new Date().toISOString();

    await ref.update({
      status: 'building',
      cursorAgentId: cursor.agentId,
      cursorRunId: cursor.runId,
      cursorAgentUrl: cursor.agentUrl,
      cursorBranchHint: cursor.branchHint,
      reply: 'Build started. We\'ll notify you when it\'s ready.',
      approvedAt: now,
      updatedAt: now,
    });

    startCursorRunPoller(db, task.id);
    const updated = (await ref.get()).data();
    return res.json({ task: updated });
  } catch (err) {
    console.error('[hive/tasks] approve error:', err);
    return res.status(500).json({ error: err.message || 'Could not start build agent.' });
  }
});

// --- Hive device registration (Expo push tokens) ---

app.post('/api/hive/devices', async (req, res) => {
  try {
    const { userId, token, platform } = req.body || {};
    const authUser = await verifyHiveAuth(req);
    const resolvedUserId = authUser?.uid || userId;
    if (!resolvedUserId || resolvedUserId === 'anonymous') {
      return res.status(400).json({ error: 'A user id is required to register a device.' });
    }
    if (!token) {
      return res.status(400).json({ error: 'Expo push token is required.' });
    }
    const result = await registerDeviceToken(db, { userId: resolvedUserId, token, platform });
    return res.json({ ok: true, deviceId: result.id });
  } catch (err) {
    console.error('[hive/devices] register error:', err);
    return res.status(400).json({ error: err.message || 'Could not register device.' });
  }
});

// --- Hive user apps (instantly-operational specs rendered by the mobile app) ---

async function resolveOwnerForApps(req) {
  const authUser = await verifyHiveAuth(req);
  const userId = authUser?.uid || req.query?.userId || req.body?.userId;
  if (!userId) return null;
  return userId;
}

app.get('/api/hive/apps', async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    const apps = await listUserApps(db, ownerId);
    return res.json({ apps });
  } catch (err) {
    console.error('[hive/apps] list error:', err);
    return res.status(500).json({ error: 'Could not load apps.' });
  }
});

app.get('/api/hive/apps/:appId', async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    const app = await getUserApp(db, ownerId, req.params.appId);
    if (!app) return res.status(404).json({ error: 'App not found.' });
    return res.json({ app });
  } catch (err) {
    console.error('[hive/apps] get error:', err);
    return res.status(500).json({ error: 'Could not load app.' });
  }
});

app.put('/api/hive/apps/:appId', async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    const existing = await getUserApp(db, ownerId, req.params.appId);
    if (!existing) return res.status(404).json({ error: 'App not found.' });
    const next = { ...existing, ...(req.body?.app || req.body || {}), id: req.params.appId };
    const normalized = normalizeAppSpec(next, { ownerId });
    const saved = await saveUserApp(db, ownerId, { ...normalized, id: req.params.appId });
    return res.json({ app: saved });
  } catch (err) {
    console.error('[hive/apps] update error:', err);
    return res.status(400).json({ error: err.message || 'Could not update app.' });
  }
});

app.delete('/api/hive/apps/:appId', async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    const result = await deleteUserApp(db, ownerId, req.params.appId);
    if (!result.ok) return res.status(404).json({ error: 'App not found.' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[hive/apps] delete error:', err);
    return res.status(500).json({ error: 'Could not delete app.' });
  }
});

app.post('/api/hive/apps/:appId/tweak', express.json(), async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'message is required.' });
    if (message.length > 2000) return res.status(400).json({ error: 'Message is too long.' });

    const existing = await getUserApp(db, ownerId, req.params.appId);
    if (!existing) return res.status(404).json({ error: 'App not found.' });

    const authUser = await verifyHiveAuth(req);
    const freeBuild = Boolean(authUser?.email && isHiveFreeBuildEmail(authUser.email));
    const taskId = `hive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const priced = priceEstimate(
      { costUsd: 0, minutes: 0 },
      { free: freeBuild, iteration: true, target: 'host_screen', buildMethod: 'spec' }
    );
    const cost = priced.user.costUsd;

    if (ownerId && ownerId !== 'anonymous' && !freeBuild && cost > 0) {
      try {
        await reserveBuildCredits(db, ownerId, taskId, cost);
      } catch {
        // Soft-fail — welcome credit may cover small tweaks.
      }
    }

    let appSpec;
    try {
      appSpec = await generateAppSpec({
        message,
        ownerId,
        slug: existing.slug,
        title: existing.title,
        previous: existing,
        sourceTaskId: taskId,
      });
    } catch (err) {
      console.error('[hive/apps] tweak spec failed:', err.message);
      return res.status(500).json({ error: 'Could not apply tweak. Try a simpler change.' });
    }

    const saved = await saveUserApp(db, ownerId, {
      ...appSpec,
      id: req.params.appId,
      visibility: existing.visibility,
      sourceCommunityAppId: existing.sourceCommunityAppId || null,
      sharedAt: existing.sharedAt || null,
      installCount: existing.installCount || 0,
    });

    const now = new Date().toISOString();
    await db.collection(HIVE_TASKS).doc(taskId).set({
      id: taskId,
      message,
      userId: ownerId,
      route: 'spec',
      target: 'host_screen',
      buildMethod: 'spec',
      slug: existing.slug,
      title: existing.title,
      appId: req.params.appId,
      previousTaskId: existing.sourceTaskId || null,
      status: 'complete',
      summary: `Tweak "${existing.title}"`,
      estimate: priced.user,
      estimateBase: priced.base,
      reply: `Updated "${saved.title}" — your data stays on this device.`,
      deliverable: {
        kind: 'spec_app',
        appId: req.params.appId,
        slug: saved.slug,
        title: saved.title,
        label: 'Open your app',
      },
      createdAt: now,
      updatedAt: now,
    });

    return res.json({ ok: true, app: saved, estimate: priced.user });
  } catch (err) {
    console.error('[hive/apps] tweak error:', err);
    return res.status(500).json({ error: err.message || 'Could not tweak app.' });
  }
});

app.post('/api/hive/apps/:appId/customize', express.json(), async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'message is required.' });
    if (message.length > 2000) return res.status(400).json({ error: 'Message is too long.' });

    const app = await getUserApp(db, ownerId, req.params.appId);
    if (!app) return res.status(404).json({ error: 'App not found.' });

    const buildPrompt = [
      `Hive customize build: upgrade the user's spec app to custom in-app code (host_screen).`,
      `User customization request: ${message}`,
      `Current HiveAppSpec (JSON — preserve data model and page intent):`,
      '```json',
      JSON.stringify(app, null, 2),
      '```',
      `Implement as a polished React Native feature under cody/apps/${ownerId}/${app.slug}/.`,
      'Match the spec title, tagline, theme colors, and icon. Add any branding or UX the user asked for.',
      'Wire it into the AiBhive mobile app shell if needed, or enhance the dynamic page types.',
    ].join('\n');

    const cursorEst = await estimateCursorBuildCost({
      message: `Customize ${app.title}: ${message}`,
      buildPrompt,
      summary: `Full Cursor customize "${app.title}"`,
    });
    const priced = priceEstimate(
      { costUsd: cursorEst.costUsd, minutes: cursorEst.minutes },
      { target: 'host_screen', buildMethod: 'cursor' }
    );

    const taskId = `hive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const doc = {
      id: taskId,
      message: `Customize ${app.title}: ${message}`,
      userId: ownerId,
      route: 'cursor',
      target: 'host_screen',
      buildMethod: 'cursor',
      slug: app.slug,
      title: app.title,
      appId: req.params.appId,
      previousTaskId: app.sourceTaskId || null,
      status: 'awaiting_approval',
      summary: `Full customize "${app.title}" — branding, layout, and behavior beyond spec pages.`,
      estimate: priced.user,
      estimateBase: priced.base,
      cursorEstimate: cursorEst,
      buildPrompt,
      reply:
        `Custom upgrade ready.\n\n${message}\n\nAbout $${priced.user.costUsd} · ~${priced.user.minutes} min\n\nTap Approve & Build when you're ready.`,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(HIVE_TASKS).doc(taskId).set(doc);
    return res.json({ task: doc });
  } catch (err) {
    console.error('[hive/apps] customize error:', err);
    return res.status(500).json({ error: err.message || 'Could not start customize build.' });
  }
});

app.post('/api/hive/apps/:appId/share', express.json(), async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    const result = await shareAppToCommunity(db, ownerId, req.params.appId);
    if (!result.ok) return res.status(404).json({ error: result.error || 'Could not share app.' });
    return res.json({ ok: true, app: result.app });
  } catch (err) {
    console.error('[hive/apps] share error:', err);
    return res.status(500).json({ error: 'Could not share app.' });
  }
});

app.get('/api/hive/toolkit', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Number(req.query.limit) || 24, 48);
    const apps = q ? await searchCommunityToolkit(db, q, limit) : await listCommunityToolkit(db, limit);
    return res.json({ apps, query: q || null });
  } catch (err) {
    console.error('[hive/toolkit] list error:', err);
    return res.status(500).json({ error: 'Could not load toolkit.' });
  }
});

app.get('/api/hive/toolkit/:appId', async (req, res) => {
  try {
    const app = (await getPublicToolkitApp(db, req.params.appId)) || getExampleApp(req.params.appId);
    if (!app) return res.status(404).json({ error: 'App not found in community toolkit.' });
    return res.json({ app });
  } catch (err) {
    console.error('[hive/toolkit] detail error:', err);
    return res.status(500).json({ error: 'Could not load app.' });
  }
});

app.get('/api/hive/store', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const limit = Math.min(Number(req.query.limit) || 48, 48);
    const catalog = await getStoreCatalog(db, { query: q, category, limit });
    const webApps = [...listPlatformWebApps(), ...listPublishedWebApps()];
    return res.json({ ...catalog, webApps });
  } catch (err) {
    console.error('[hive/store] catalog error:', err);
    return res.status(500).json({ error: 'Could not load store.' });
  }
});

app.get('/api/hive/web-apps', async (_req, res) => {
  try {
    return res.json({ apps: [...listPlatformWebApps(), ...listPublishedWebApps()] });
  } catch (err) {
    console.error('[hive/web-apps] list error:', err);
    return res.status(500).json({ error: 'Could not load web apps.' });
  }
});

app.post('/api/hive/toolkit/:appId/install', express.json(), async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    await ensureHiveUser(db, ownerId);
    const result = await installCommunityApp(db, ownerId, req.params.appId);
    if (!result.ok && getExampleApp(req.params.appId)) {
      const exampleResult = await installExampleApp(db, ownerId, req.params.appId);
      if (exampleResult.ok) {
        return res.json({ ok: true, app: exampleResult.app, sourceAppId: exampleResult.sourceAppId });
      }
    }
    if (!result.ok) return res.status(404).json({ error: result.error || 'Install failed.' });
    return res.json({ ok: true, app: result.app, sourceAppId: result.sourceAppId });
  } catch (err) {
    console.error('[hive/toolkit] install error:', err);
    return res.status(500).json({ error: 'Could not install app.' });
  }
});

// Kick off a paid export build (web app / installable APK / Play Store).
// Reuses the existing /api/hive/tasks pipeline but with a pre-baked prompt
// that tells the Cursor agent to read the user's spec and emit the right
// artifact.
app.post('/api/hive/apps/:appId/export', async (req, res) => {
  try {
    const ownerId = await resolveOwnerForApps(req);
    if (!ownerId) return res.status(400).json({ error: 'userId required.' });
    const targetRaw = req.body?.target;
    const target = ['web_app', 'native_app', 'play_store'].includes(targetRaw) ? targetRaw : null;
    if (!target) return res.status(400).json({ error: 'target must be web_app, native_app, or play_store.' });

    const app = await getUserApp(db, ownerId, req.params.appId);
    if (!app) return res.status(404).json({ error: 'App not found.' });

    const buildPrompt = [
      `Hive export build: target=${target}.`,
      `User app spec (JSON):`,
      '```json',
      JSON.stringify(app, null, 2),
      '```',
      target === 'web_app'
        ? 'Implement this spec as a static web app under cody/apps/${ownerId}/${slug}/. Use plain HTML/CSS/JS (or Vite + React if helpful). All page types and theme tokens must match the spec.'
        : target === 'native_app'
          ? 'Scaffold a standalone Expo project under apps/native/${slug}/ that implements this spec. Use the spec\'s title, icon, and theme. Provide eas.json and a README explaining `eas build --platform android --profile preview`.'
          : 'Make this spec Play-Store-ready under apps/native/${slug}/: signed AAB profile, icon set (48-512px), feature graphic placeholder, listing copy in PLAY_STORE_LISTING.md, and a numbered Play Console walkthrough in PLAY_STORE_STEPS.md.',
    ]
      .join('\n')
      .replace(/\$\{ownerId\}/g, ownerId)
      .replace(/\$\{slug\}/g, app.slug);

    const triage = {
      route: 'cursor',
      target,
      buildMethod: 'cursor',
      slug: app.slug,
      title: app.title,
      summary: `Export "${app.title}" as ${target.replace('_', ' ')}`,
      buildPrompt,
    };

    const cursorEst = await estimateCursorBuildCost({
      message: `Export ${app.title} as ${target}`,
      buildPrompt,
      summary: triage.summary,
    });
    const priced = priceEstimate(
      { costUsd: cursorEst.costUsd, minutes: cursorEst.minutes },
      { target, buildMethod: 'cursor' }
    );

    const taskId = `hive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const doc = {
      id: taskId,
      message: `Export ${app.title} as ${target}`,
      userId: ownerId,
      route: 'cursor',
      target,
      buildMethod: 'cursor',
      slug: app.slug,
      title: app.title,
      appId: req.params.appId,
      previousTaskId: app.sourceTaskId || null,
      status: 'awaiting_approval',
      summary: triage.summary,
      estimate: priced.user,
      estimateBase: priced.base,
      cursorEstimate: cursorEst,
      buildPrompt,
      reply: `Ready to ${target === 'web_app' ? 'publish the web app' : target === 'native_app' ? 'build your APK' : 'make it Play Store ready'}. About $${priced.user.costUsd} · ~${priced.user.minutes} min. Tap Approve & Build to start.`,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(HIVE_TASKS).doc(taskId).set(doc);
    return res.json({ task: doc });
  } catch (err) {
    console.error('[hive/apps] export error:', err);
    return res.status(500).json({ error: err.message || 'Could not start export.' });
  }
});

// --- Mobile release manifest (APK + OTA metadata) ---

const MOBILE_RELEASE_CACHE_MS = 30_000;
let mobileReleaseCache = { at: 0, manifest: null };

function loadMobileReleaseManifestFromDisk() {
  const manifestPath = path.join(__dirname, '../public/mobile-releases.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

/** Read taylored-mobile/app.json so stale mobile-releases.json never hides updates. */
function loadMobileVersionFromAppJson() {
  const appJsonPath = path.join(__dirname, '../taylored-mobile/app.json');
  if (!fs.existsSync(appJsonPath)) return null;
  try {
    const expo = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).expo ?? {};
    if (!expo.version) return null;
    return {
      shippedNativeVersion: expo.version,
      versionCode: expo.android?.versionCode,
      sourceVersion: expo.version,
    };
  } catch {
    return null;
  }
}

function mergeManifestWithAppJson(manifest) {
  const fromApp = loadMobileVersionFromAppJson();
  if (!fromApp) return manifest;
  const base = manifest ?? {};
  if (!isManifestNewer(fromApp, base)) return base;
  return {
    ...base,
    ...fromApp,
    downloadUrl: base.downloadUrl || 'https://aibhive.com/api/download/apk',
    fullApkUrl: base.fullApkUrl || 'https://aibhive.com/api/download/apk',
    publishedAt: base.publishedAt || new Date().toISOString(),
    otaChannel: base.otaChannel || 'production',
  };
}

function parseVersionParts(version) {
  return String(version || '0')
    .split('.')
    .map((part) => parseInt(part, 10) || 0);
}

function isManifestNewer(a, b) {
  if (!a) return false;
  if (!b) return true;
  const codeA = a.versionCode ?? 0;
  const codeB = b.versionCode ?? 0;
  if (codeA !== codeB) return codeA > codeB;
  const partsA = parseVersionParts(a.shippedNativeVersion);
  const partsB = parseVersionParts(b.shippedNativeVersion);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i += 1) {
    const diff = (partsA[i] || 0) - (partsB[i] || 0);
    if (diff !== 0) return diff > 0;
  }
  return false;
}

function pickNewerMobileReleaseManifest(remote, disk) {
  if (isManifestNewer(remote, disk)) return remote;
  if (isManifestNewer(disk, remote)) return disk;
  return remote || disk;
}

async function fetchMobileReleaseFromRemote() {
  const bucket = firebaseConfig.storageBucket;
  if (!bucket) return null;
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/mobile%2Fmobile-releases.json?alt=media`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[mobile/releases] remote manifest fetch failed:', err.message);
    return null;
  }
}

async function getMobileReleaseManifest() {
  const now = Date.now();
  if (mobileReleaseCache.manifest && now - mobileReleaseCache.at < MOBILE_RELEASE_CACHE_MS) {
    return mobileReleaseCache.manifest;
  }

  const [remote, disk] = await Promise.all([
    fetchMobileReleaseFromRemote(),
    Promise.resolve(loadMobileReleaseManifestFromDisk()),
  ]);
  const manifest = mergeManifestWithAppJson(pickNewerMobileReleaseManifest(remote, disk));
  mobileReleaseCache = { at: now, manifest };
  return manifest;
}

app.get('/api/mobile/releases', async (_req, res) => {
  const manifest = await getMobileReleaseManifest();
  if (!manifest) {
    return res.status(404).json({ error: 'Release manifest not available.' });
  }
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.json(manifest);
});

// --- Hive personal web apps: /u/:owner/:slug/* ---
// Serves the static bundles produced by `web_app` Hive builds.
// Source layout: cody/apps/<owner>/<slug>/  (committed by build agents)
// Built layout (preferred): dist/cody/apps/<owner>/<slug>/  (vite build output)

function safeSegment(value) {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(value || '');
}

app.get('/u/:owner/:slug/*', (req, res, next) => {
  const { owner, slug } = req.params;
  if (!safeSegment(owner) || !safeSegment(slug)) return next();

  const rest = req.params[0] || 'index.html';
  const safeRest = path.posix.normalize('/' + rest).replace(/^\/+/, '');
  if (safeRest.includes('..')) return next();

  const builtPath = path.join(__dirname, '..', 'dist', 'cody', 'apps', owner, slug, safeRest);
  const sourcePath = path.join(__dirname, '..', 'cody', 'apps', owner, slug, safeRest);
  const fallbackIndex = (root) => path.join(root, 'index.html');

  for (const candidate of [
    builtPath,
    fallbackIndex(path.dirname(builtPath)),
    sourcePath,
    fallbackIndex(path.dirname(sourcePath)),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return res.sendFile(candidate);
    }
  }
  return res
    .status(404)
    .type('html')
    .send(
      '<!doctype html><meta charset=utf-8><title>Hive app not built yet</title>' +
        '<style>body{font-family:system-ui;background:#0c0a09;color:#fde68a;max-width:520px;margin:48px auto;padding:24px;line-height:1.5}</style>' +
        '<h1>This Hive web app is on its way</h1>' +
        `<p>We do not have a build for <code>${owner}/${slug}</code> yet. The Hive build pipeline publishes web apps to this URL within a few minutes of completion.</p>` +
        '<p><a style="color:#fbbf24" href="/">Back to AiBhive</a></p>'
    );
});

app.get('/u/:owner/:slug', (req, res) => {
  res.redirect(301, `/u/${req.params.owner}/${req.params.slug}/`);
});

// --- Serve Frontend Static Files for Production ---
// In production (Cloud Run), the Express server acts as the host for the built Vite React app

function resolveApkPath() {
  const candidates = [
    path.join(__dirname, '../dist/taylored-mobile.apk'),
    path.join(__dirname, '../public/taylored-mobile.apk'),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

app.get('/api/download/apk', async (req, res) => {
  const manifest = await getMobileReleaseManifest();
  if (req.query.compressed === '1' && manifest?.firebaseGzUrl) {
    return res.redirect(302, manifest.firebaseGzUrl);
  }

  if (manifest?.firebaseApkUrl && req.query.compressed !== '1' && req.query.local !== '1') {
    return res.redirect(302, manifest.firebaseApkUrl);
  }

  const apkPath = resolveApkPath();
  if (!apkPath) {
    if (manifest?.firebaseApkUrl) {
      return res.redirect(302, manifest.firebaseApkUrl);
    }
    if (req.query.compressed === '1' && manifest?.firebaseGzUrl) {
      return res.redirect(302, manifest.firebaseGzUrl);
    }
    return res.status(404).json({ error: 'APK not available yet. Try again after the mobile build finishes.' });
  }

  if (req.query.compressed === '1') {
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', 'attachment; filename="taylored-mobile.apk.gz"');
    return fs.createReadStream(apkPath).pipe(zlib.createGzip()).pipe(res);
  }

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="taylored-mobile.apk"');
  return res.sendFile(apkPath);
});

app.get('/taylored-mobile.apk', async (req, res) => {
  const manifest = await getMobileReleaseManifest();
  if (manifest?.firebaseApkUrl && req.query.local !== '1') {
    return res.redirect(302, manifest.firebaseApkUrl);
  }
  const apkPath = resolveApkPath();
  if (!apkPath) {
    if (manifest?.firebaseApkUrl) {
      return res.redirect(302, manifest.firebaseApkUrl);
    }
    return res.status(404).send('APK not available yet.');
  }
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="taylored-mobile.apk"');
  return res.sendFile(apkPath);
});

app.get('/privacy-policy.html', (_req, res) => {
  const policyPath = path.join(__dirname, '../public/privacy-policy.html');
  if (!fs.existsSync(policyPath)) {
    return res.status(404).send('Privacy policy not found.');
  }
  return res.sendFile(policyPath);
});

app.get('/privacy', (_req, res) => res.redirect(301, '/privacy-policy.html'));

app.use('/cody', express.static(path.join(__dirname, '../dist/cody')));
app.get(['/cody', '/cody/*'], (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/cody/index.html'));
});

// Legacy /autoposter URL → admin Auto Social tab (provider settings live there)
app.get(['/autoposter', '/autoposter/*'], (req, res) => {
  res.redirect(302, '/admin?tab=auto-social');
});

app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve the React index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
