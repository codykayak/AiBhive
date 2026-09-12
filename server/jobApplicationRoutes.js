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
const JOBS_NOTIFY_EMAIL = 'codykayak@gmail.com';
const EMPLOYEE_APP_LABEL = 'employee app';
const PRODUCT_IDS = new Set(['aibhive', 'manydoors', 'macrorei']);
const CALL_TIMES = new Set([
  'weekday-morning',
  'weekday-afternoon',
  'weekday-evening',
  'weekend',
  'specific',
]);

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

/**
 * Public hiring applications from aibhive.com/jobs.
 */
export function registerJobApplicationRoutes(app, { db, gcsBucket, transporter }) {
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
        createdAt: FieldValue.serverTimestamp(),
      };

      await db.collection('jobApplications').doc(id).set(doc);

      if (transporter) {
        const productLabels = {
          aibhive: 'AiBhive — AI for businesses',
          manydoors: 'ManyDoors AI — property management',
          macrorei: 'MacroREI — houses to flip',
        };
        const productLine = products.map((p) => productLabels[p] || p).join(', ');
        const summary = [
          EMPLOYEE_APP_LABEL,
          '',
          `New employee application (${id})`,
          '',
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `Products: ${productLine}`,
          `Best call time: ${callTime}${callTimeNote ? ` — ${callTimeNote}` : ''}`,
          `Timezone: ${doc.timezone || '—'}`,
          '',
          'What we should know:',
          aboutYou,
        ].join('\n');

        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || JOBS_NOTIFY_EMAIL,
            to: JOBS_NOTIFY_EMAIL,
            replyTo: email,
            subject: `[${EMPLOYEE_APP_LABEL}] ${name} — ${productLine}`,
            text: summary,
            attachments: [
              {
                filename: resumeName,
                content: file.buffer,
                contentType: file.mimetype,
              },
            ],
          });
        } catch (mailErr) {
          console.error('[job-application] Email notify failed:', mailErr);
        }
      }

      return res.json({ success: true, id });
    } catch (err) {
      console.error('[job-application] Error:', err);
      return res.status(500).json({ error: 'Failed to submit application. Please email hello@aibhive.com.' });
    }
  });
}
