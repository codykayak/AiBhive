import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIVE_PATH = path.join(__dirname, '../shared/pros-admin-manual.md');

let cached = null;

export function getProsAdminManualMarkdown() {
  if (cached) return cached;
  if (fs.existsSync(LIVE_PATH)) {
    cached = fs.readFileSync(LIVE_PATH, 'utf8');
    return cached;
  }
  cached = '# Pros manual\nManual file missing on server.';
  return cached;
}
