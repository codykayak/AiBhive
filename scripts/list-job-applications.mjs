#!/usr/bin/env node
/**
 * List hiring applications saved in Firestore (recovery when email was missed).
 * Run from repo root with Application Default Credentials:
 *   node scripts/list-job-applications.mjs
 *   node scripts/list-job-applications.mjs --limit 20
 */
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(path.join(__dirname, '../firebase-applet-config.json'), 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({ projectId: config.projectId });
}

const db = getFirestore(admin.app(), config.firestoreDatabaseId || '(default)');
const limit = Math.min(Math.max(Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1]) || 50, 1), 200);

const snap = await db.collection('jobApplications').orderBy('createdAt', 'desc').limit(limit).get();

if (snap.empty) {
  console.log('No job applications in Firestore collection "jobApplications".');
  process.exit(0);
}

console.log(`Found ${snap.size} application(s):\n`);
for (const doc of snap.docs) {
  const d = doc.data();
  const created =
    d.createdAt?.toDate?.()?.toISOString?.() ||
    (d.createdAt instanceof Date ? d.createdAt.toISOString() : '—');
  console.log('—'.repeat(60));
  console.log(`ID:       ${doc.id}`);
  console.log(`Created:  ${created}`);
  console.log(`Name:     ${d.name}`);
  console.log(`Email:    ${d.email}`);
  console.log(`Phone:    ${d.phone}`);
  console.log(`Products: ${(d.products || []).join(', ')}`);
  console.log(`Call:     ${d.callTime}${d.callTimeNote ? ` (${d.callTimeNote})` : ''}`);
  console.log(`Resume:   ${d.resumeStoragePath || '(not in GCS)'}`);
  console.log(`Emailed:  ${d.emailNotifiedAt || '(no emailNotifiedAt — may have failed silently before fix)'}`);
  console.log(`About:\n${d.aboutYou}\n`);
}
