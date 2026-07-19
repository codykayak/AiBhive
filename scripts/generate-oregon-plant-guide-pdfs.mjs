#!/usr/bin/env node
/**
 * Generate PDF guides for Oregon Plant Medicine app.
 * Run: node scripts/generate-oregon-plant-guide-pdfs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { DMT_BOTANY_GUIDE_HTML, PSILOCYBIN_GUIDE_HTML } from './oregon-plant-guide-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/oregon-plant-medicine/guides');
const TMP_DIR = path.join(__dirname, '../.tmp/oregon-plant-guides');

const GUIDES = [
  {
    id: 'oregon-psilocybin-law-id-safety',
    title: 'Oregon Psilocybin — Law, Safety & Field ID',
    html: PSILOCYBIN_GUIDE_HTML,
  },
  {
    id: 'oregon-entheogen-botany-dmt-plants',
    title: 'PNW Entheogen Botany — DMT Plants (Reference)',
    html: DMT_BOTANY_GUIDE_HTML,
  },
];

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
  for (const guide of GUIDES) {
    const pdfPath = path.join(OUT_DIR, `${guide.id}.pdf`);
    console.log(`Generating ${guide.id}.pdf …`);
    await htmlToPdf(guide.html, pdfPath);
    const size = fs.statSync(pdfPath).size;
    console.log(`  ✓ ${Math.round(size / 1024)} KB`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
