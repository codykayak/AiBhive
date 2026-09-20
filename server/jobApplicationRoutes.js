import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

const RESUME_EXTS = new Set(['.pdf', '.doc', '.docx', '.txt', '.rtf']);
const RESUME_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'text/rtf',
]);
const DEFAULT_JOBS_NOTIFY_EMAIL = 'codykayak@gmail.com';
const EMPLOYEE_APP_LABEL = 'employee app';
const PRODUCT_IDS = new Set(['aibhive', 'manydoors', 'macrorei']);
const CALL_TIMES = new Set([
  'weekday-morning',
  'weekday-afternoon',
  'weekday-evening',
  'weekend',
  'specific',
]);

const PRODUCT_LABELS = {
  aibhive: 'AiBhive — AI for businesses',
  manydoors: 'ManyDoors AI — property management',
  macrorei: 'MacroREI — houses to flip',
};

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (RESUME_EXTS.has(ext) || RESUME_MIMES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Please upload a PDF, Word, or text resume.'));
  },
});

function clip(value, max) {
  return String(value || '').trim().slice(0, max);
}

function parseProducts(raw) {
  const list = Array.isArray(raw)
    ? raw
    : String(raw || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  return [...new Set(list.filter((id) => PRODUCT_IDS.has(id)))];
}

function safeResumeName(original) {
  const ext = path.extname(original || '').toLowerCase() || '.pdf';
  const base = path
    .basename(original || 'resume', ext)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'resume'}${RESUME_EXTS.has(ext) ? ext : '.pdf'}`;
}

function jobsNotifyTo() {
  return (process.env.JOBS_NOTIFY_EMAIL || DEFAULT_JOBS_NOTIFY_EMAIL).trim().toLowerCase();
}

function emailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function productLine(products) {
  return products.map((p) => PRODUCT_LABELS[p] || p).join(', ');
}

function buildApplicationSummary({ id, name, email, phone, products, callTime, callTimeNote, timezone, aboutYou }) {
  return [
    EMPLOYEE_APP_LABEL,
    '',
    `New employee application (${id})`,
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Products: ${productLine(products)}`,
    `Best call time: ${callTime}${callTimeNote ? ` — ${callTimeNote}` : ''}`,
    `Timezone: ${timezone || '—'}`,
    '',
    'What we should know:',
    aboutYou,
  ].join('\n');
}

async function sendJobApplicationEmail(transporter, payload) {
  const {
    id,
    name,
    email,
    phone,
    products,
    callTime,
    callTimeNote,
    timezone,
    aboutYou,
    resumeName,
    resumeBuffer,
    resumeContentType,
  } = payload;

  if (!emailConfigured()) {
    throw new Error('EMAIL_USER and EMAIL_PASS are not configured on the server.');
  }

  const line = productLine(products);
  const summary = buildApplicationSummary({
    id,
    name,
    email,
    phone,
    products,
    callTime,
    callTimeNote,
    timezone,
    aboutYou,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: jobsNotifyTo(),
    replyTo: email,
    subject: `[${EMPLOYEE_APP_LABEL}] ${name} — ${line}`,
    text: summary,
    attachments: resumeBuffer
      ? [
          {
            filename: resumeName,
            content: resumeBuffer,
            contentType: resumeContentType || 'application/octet-stream',
          },
        ]
      : [],
  });
}

async function loadResumeBuffer(gcsBucket, doc) {
  const storagePath = doc.resumeStoragePath;
  if (!gcsBucket || !storagePath) return null;
  const [buf] = await gcsBucket.file(storagePath).download();
  return buf;
}

function serializeJobApplicationDoc(id, data) {
  const createdAt = data.createdAt;
  let createdAtIso = null;
  if (createdAt && typeof createdAt.toDate === 'function') {
    createdAtIso = createdAt.toDate().toISOString();
  } else if (createdAt instanceof Date) {
    createdAtIso = createdAt.toISOString();
  }
  return {
    id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    products: data.products || [],
    aboutYou: data.aboutYou || '',
    callTime: data.callTime || '',
    callTimeNote: data.callTimeNote || '',
    timezone: data.timezone || '',
    resumeFileName: data.resumeFileName || '',
    resumeStoragePath: data.resumeStoragePath || '',
    emailNotifiedAt: data.emailNotifiedAt || null,
    createdAt: createdAtIso,
    status: data.status || 'new',
    source: data.source || '',
  };
}

/**
 * Public hiring applications from aibhive.com/jobs.
 */
export function registerJobApplicationRoutes(app, { db, gcsBucket, transporter, verifyAdmin }) {
  app.post('/api/job-application', (req, res, next) => {
    resumeUpload.single('resume')(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Resume must be 8MB or smaller.' });
      }
      return res.status(400).json({ error: err.message || 'Could not read the resume file.' });
    });
  }, async (req, res) => {
    try {
      const body = req.body || {};
      const name = clip(body.name, 120);
      const email = clip(body.email, 200).toLowerCase();
      const phone = clip(body.phone, 40);
      const aboutYou = clip(body.aboutYou, 4000);
      const callTime = clip(body.callTime, 40);
      const callTimeNote = clip(body.callTimeNote, 500);
      const products = parseProducts(body.products);
      const file = req.file;

      if (!name) return res.status(400).json({ error: 'Name is required.' });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'A valid email is required.' });
      }
      if (phone.replace(/\D/g, '').length < 10) {
        return res.status(400).json({ error: 'A phone number is required so we can call you.' });
      }
      if (!products.length) {
        return res.status(400).json({ error: 'Pick at least one product you want to sell.' });
      }
      if (!aboutYou || aboutYou.length < 12) {
        return res.status(400).json({ error: 'Tell us what we should know about you.' });
      }
      if (!CALL_TIMES.has(callTime)) {
        return res.status(400).json({ error: 'Choose the best time for a phone call.' });
      }
      if (!file?.buffer) {
        return res.status(400).json({ error: 'Please upload your resume.' });
      }

      if (!emailConfigured()) {
        console.error('[job-application] EMAIL_USER/EMAIL_PASS missing — cannot notify hiring inbox.');
        return res.status(503).json({
          error:
            'Applications are temporarily unavailable. Please email your resume to codykayak@gmail.com with subject "employee app".',
        });
      }

      const id = randomUUID();
      const resumeName = safeResumeName(file.originalname);
      const storagePath = `hiring/applications/${id}/${resumeName}`;
      let resumeStored = false;

      if (gcsBucket) {
        try {
          await gcsBucket.file(storagePath).save(file.buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            resumable: false,
            metadata: { cacheControl: 'private, max-age=0' },
          });
          resumeStored = true;
        } catch (gcsErr) {
          console.error('[job-application] GCS save failed:', gcsErr?.message || gcsErr);
        }
      }

      let emailNotifiedAt = null;
      try {
        await sendJobApplicationEmail(transporter, {
          id,
          name,
          email,
          phone,
          products,
          callTime,
          callTimeNote,
          timezone: clip(body.timezone, 80),
          aboutYou,
          resumeName,
          resumeBuffer: file.buffer,
          resumeContentType: file.mimetype,
        });
        emailNotifiedAt = new Date().toISOString();
        console.log('[job-application] Email sent to', jobsNotifyTo(), id);
      } catch (mailErr) {
        console.error('[job-application] Email notify failed:', mailErr?.message || mailErr);
        return res.status(502).json({
          error:
            'We could not deliver your application email. Please try again or email codykayak@gmail.com with subject "employee app".',
        });
      }

      const doc = {
        name,
        email,
        phone,
        products,
        aboutYou,
        callTime,
        callTimeNote,
        timezone: clip(body.timezone, 80),
        resumeFileName: resumeName,
        resumeContentType: file.mimetype || '',
        resumeBytes: file.size,
        resumeStoragePath: resumeStored ? storagePath : '',
        status: 'new',
        source: 'aibhive.com/jobs',
        label: EMPLOYEE_APP_LABEL,
        notifyEmail: jobsNotifyTo(),
        emailNotifiedAt,
        createdAt: FieldValue.serverTimestamp(),
      };

      try {
        await db.collection('jobApplications').doc(id).set(doc);
      } catch (dbErr) {
        console.error('[job-application] Firestore save failed (email was sent):', dbErr?.message || dbErr);
      }

      return res.json({ success: true, id });
    } catch (err) {
      console.error('[job-application] Error:', err);
      return res.status(500).json({ error: 'Failed to submit application. Please email codykayak@gmail.com.' });
    }
  });

  if (!verifyAdmin) return;

  app.get('/api/admin/job-applications', verifyAdmin, async (req, res) => {
    try {
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
      const snap = await db
        .collection('jobApplications')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      const applications = snap.docs.map((d) => serializeJobApplicationDoc(d.id, d.data()));
      return res.json({ applications, notifyEmail: jobsNotifyTo() });
    } catch (err) {
      console.error('[job-application] admin list failed:', err);
      return res.status(500).json({ error: err.message || 'Could not list applications.' });
    }
  });

  app.post('/api/admin/job-applications/:id/resend-email', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const ref = db.collection('jobApplications').doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        return res.status(404).json({ error: 'Application not found.' });
      }
      if (!emailConfigured()) {
        return res.status(503).json({ error: 'EMAIL_USER/EMAIL_PASS not configured on server.' });
      }

      const data = snap.data();
      let resumeBuffer = null;
      try {
        resumeBuffer = await loadResumeBuffer(gcsBucket, data);
      } catch (gcsErr) {
        console.error('[job-application] resend resume download failed:', gcsErr?.message || gcsErr);
      }

      await sendJobApplicationEmail(transporter, {
        id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        products: data.products || [],
        callTime: data.callTime,
        callTimeNote: data.callTimeNote,
        timezone: data.timezone,
        aboutYou: data.aboutYou,
        resumeName: data.resumeFileName || 'resume.pdf',
        resumeBuffer,
        resumeContentType: data.resumeContentType,
      });

      const emailNotifiedAt = new Date().toISOString();
      await ref.set({ emailNotifiedAt, notifyEmail: jobsNotifyTo() }, { merge: true });

      return res.json({
        success: true,
        id,
        resentTo: jobsNotifyTo(),
        resumeAttached: Boolean(resumeBuffer),
      });
    } catch (err) {
      console.error('[job-application] resend failed:', err);
      return res.status(500).json({ error: err.message || 'Resend failed.' });
    }
  });
}
