#!/usr/bin/env node
/**
 * Smoke test: homework OCR multipart upload must NOT return 413 Payload Too Large.
 * Expects 401 without auth (proves body was accepted). Run with backend on :3001.
 *
 *   npm run test:homework-ocr
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.API_BASE || 'http://127.0.0.1:3001';
const testImage = path.join(__dirname, 'fixtures/test-ocr-page.jpg');

async function ensureTestImage() {
  if (fs.existsSync(testImage)) return;
  fs.mkdirSync(path.dirname(testImage), { recursive: true });
  // Minimal valid JPEG (~1KB) if no fixture present
  const minimalJpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=',
    'base64'
  );
  fs.writeFileSync(testImage, minimalJpeg);
}

async function main() {
  await ensureTestImage();
  const buf = fs.readFileSync(testImage);
  const form = new FormData();
  form.append('files', new Blob([buf], { type: 'image/jpeg' }), 'test-page.jpg');
  form.append('format', 'Markdown');

  let res;
  let text;
  try {
    res = await fetch(`${BASE}/api/homework/ocr-ingest`, { method: 'POST', body: form });
    text = await res.text();
  } catch (err) {
    console.error('FAIL: Could not reach backend at', BASE);
    console.error('Start the server: npm run dev');
    console.error(err.message);
    process.exit(1);
  }

  if (res.status === 413 || text.includes('Payload Too Large')) {
    console.error('FAIL: Payload Too Large — JSON parser is still blocking uploads.');
    console.error('Restart backend after pulling latest server/index.js');
    process.exit(1);
  }

  if (res.status === 401) {
    console.log('PASS: Multipart upload accepted (401 without auth — not 413).');
    process.exit(0);
  }

  if (res.status === 400 && text.includes('No image')) {
    console.log('PASS: Route reached multer (400 no files — not 413).');
    process.exit(0);
  }

  try {
    const json = JSON.parse(text);
    if (json.ok || json.document) {
      console.log('PASS: Full OCR ingest succeeded.');
      process.exit(0);
    }
  } catch {
    /* not json */
  }

  console.error('Unexpected response:', res.status, text.slice(0, 300));
  process.exit(1);
}

main();
