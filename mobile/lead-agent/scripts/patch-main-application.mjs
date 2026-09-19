/** Patch MainApplication.kt to register LeadAgentSmsPackage after expo prebuild */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mainPath = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'aibhive', 'leadagent', 'MainApplication.kt');

const altPaths = [
  mainPath,
  ...findMainApplication(path.join(root, 'android', 'app', 'src', 'main', 'java')),
];

function findMainApplication(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.walkSync(dir)) {
    if (entry.endsWith('MainApplication.kt')) out.push(entry);
  }
  return out;
}

for (const p of altPaths) {
  if (!fs.existsSync(p)) continue;
  let src = fs.readFileSync(p, 'utf8');
  if (src.includes('LeadAgentSmsPackage')) {
    console.log('MainApplication already patched:', p);
    process.exit(0);
  }
  if (!src.includes('packages.apply')) {
    console.warn('Unexpected MainApplication format:', p);
    continue;
  }
  src = src.replace(
    'packages.apply {',
    `packages.apply {
              add(LeadAgentSmsPackage())`,
  );
  if (!src.includes('import com.aibhive.leadagent.LeadAgentSmsPackage')) {
    src = src.replace(
      'import com.facebook.react',
      'import com.aibhive.leadagent.LeadAgentSmsPackage\nimport com.facebook.react',
    );
  }
  fs.writeFileSync(p, src);
  console.log('Patched', p);
  process.exit(0);
}

console.error('MainApplication.kt not found — run expo prebuild first');
process.exit(1);
