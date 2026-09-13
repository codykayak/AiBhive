#!/usr/bin/env node
/**
 * Generate Indeed-ready PDF job postings (one per role).
 * Run: node scripts/generate-job-posting-pdfs.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { JOB_POSTING_PDFS } from './job-posting-pdf-content.mjs';

function resolveChromeExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    path.join(process.env['ProgramFiles'] || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env['ProgramFiles'] || '', 'Microsoft/Edge/Application/msedge.exe'),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/hiring/pdfs');
const TMP_DIR = path.join(__dirname, '../.tmp/job-posting-pdfs');

async function htmlToPdf(html, pdfPath) {
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const htmlPath = path.join(TMP_DIR, `${path.basename(pdfPath, '.pdf')}.html`);
  fs.writeFileSync(htmlPath, html, 'utf8');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const posting of JOB_POSTING_PDFS) {
    const pdfPath = path.join(OUT_DIR, `${posting.id}.pdf`);
    console.log(`Generating ${posting.id}.pdf …`);
    await htmlToPdf(posting.html, pdfPath);
    const size = fs.statSync(pdfPath).size;
    console.log(`  ✓ ${Math.round(size / 1024)} KB — ${posting.title}`);
  }
  console.log(`Done. PDFs in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
