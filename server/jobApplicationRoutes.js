import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { deliverJobApplicationEmail, jobsNotifyTo } from './jobEmailDelivery.js';

const RESUME_EXTS = new Set(['.pdf', '.doc', '.docx', '.txt', '.rtf']);
const RESUME_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
  'text/rtf',
]);
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

function productLine(products) {
  return products.map((p) => PRODUCT_LABELS[p] || p).join(', ');
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
    adminNotes: data.adminNotes || '',
    hired: Boolean(data.hired),
    contacted: Boolean(data.contacted),
    grokScore: data.grokScore ?? null,
    grokRelativeRank: data.grokRelativeRank ?? null,
    grokRankSummary: data.grokRankSummary || '',
    grokScoredAt: data.grokScoredAt || null,
    resumeExcerpt: data.resumeExcerpt ? String(data.resumeExcerpt).slice(0, 500) : '',
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

      const productLineText = productLine(products);
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
        emailChannel: null,
        emailNotifiedAt: null,
        emailPending: true,
        createdAt: FieldValue.serverTimestamp(),
      };

      try {
        await db.collection('jobApplications').doc(id).set(doc);
      } catch (dbErr) {
        console.error('[job-application] Firestore save failed:', dbErr?.message || dbErr);
        return res.status(503).json({
          error: 'We could not save your application. Please email codykayak@gmail.com with subject "employee app".',
        });
      }

      let emailDelivered = false;
      let emailChannel = null;
      let emailNotifiedAt = null;
      try {
        const delivery = await deliverJobApplicationEmail(transporter, {
          id,
          name,
          email,
          phone,
          productLine: productLineText,
          callTime,
          callTimeNote,
          timezone: clip(body.timezone, 80),
          aboutYou,
          resumeName,
          resumeBuffer: file.buffer,
          resumeContentType: file.mimetype,
        });
        emailChannel = delivery.channel;
        emailNotifiedAt = new Date().toISOString();
        emailDelivered = true;
        await db.collection('jobApplications').doc(id).set(
          { emailChannel, emailNotifiedAt, emailPending: false },
          { merge: true }
        );
      } catch (mailErr) {
        console.error(
          '[job-application] Server email failed (client may notify):',
          mailErr?.message || mailErr
        );
      }

      return res.json({
        success: true,
        id,
        emailDelivered,
        notifyEmail: jobsNotifyTo(),
        productLine: productLineText,
      });
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
      applications.sort((a, b) => (b.grokScore ?? -1) - (a.grokScore ?? -1));
      return res.json({ applications, notifyEmail: jobsNotifyTo() });
    } catch (err) {
      console.error('[job-application] admin list failed:', err);
      return res.status(500).json({ error: err.message || 'Could not list applications.' });
    }
  });

  app.patch('/api/admin/job-applications/:id', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const ref = db.collection('jobApplications').doc(id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: 'Application not found.' });

      const body = req.body || {};
      const patch = { updatedAt: FieldValue.serverTimestamp() };
      if (typeof body.adminNotes === 'string') patch.adminNotes = body.adminNotes.slice(0, 8000);
      if (typeof body.hired === 'boolean') patch.hired = body.hired;
      if (typeof body.contacted === 'boolean') patch.contacted = body.contacted;
      if (typeof body.status === 'string') patch.status = body.status.slice(0, 40);

      await ref.set(patch, { merge: true });
      const updated = await ref.get();
      return res.json({ application: serializeJobApplicationDoc(id, updated.data()) });
    } catch (err) {
      console.error('[job-application] admin patch failed:', err);
      return res.status(500).json({ error: err.message || 'Update failed.' });
    }
  });

  app.get('/api/admin/job-applications/:id/resume', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const snap = await db.collection('jobApplications').doc(id).get();
      if (!snap.exists) return res.status(404).json({ error: 'Application not found.' });
      const data = snap.data();
      const buf = await loadResumeBuffer(gcsBucket, data);
      if (!buf) return res.status(404).json({ error: 'Resume file not found in storage.' });
      const name = data.resumeFileName || 'resume.pdf';
      res.setHeader('Content-Type', data.resumeContentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`);
      return res.send(buf);
    } catch (err) {
      console.error('[job-application] resume download failed:', err);
      return res.status(500).json({ error: err.message || 'Download failed.' });
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
      const data = snap.data();
      let resumeBuffer = null;
      try {
        resumeBuffer = await loadResumeBuffer(gcsBucket, data);
      } catch (gcsErr) {
        console.error('[job-application] resend resume download failed:', gcsErr?.message || gcsErr);
      }

      const delivery = await deliverJobApplicationEmail(transporter, {
        id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        productLine: productLine(data.products || []),
        callTime: data.callTime,
        callTimeNote: data.callTimeNote,
        timezone: data.timezone,
        aboutYou: data.aboutYou,
        resumeName: data.resumeFileName || 'resume.pdf',
        resumeBuffer,
        resumeContentType: data.resumeContentType,
      });

      const emailNotifiedAt = new Date().toISOString();
      await ref.set(
        { emailNotifiedAt, notifyEmail: jobsNotifyTo(), emailChannel: delivery.channel },
        { merge: true }
      );

      return res.json({
        success: true,
        id,
        resentTo: jobsNotifyTo(),
        channel: delivery.channel,
        resumeAttached: Boolean(resumeBuffer),
      });
    } catch (err) {
      console.error('[job-application] resend failed:', err);
      return res.status(500).json({ error: err.message || 'Resend failed.' });
    }
  });
}
