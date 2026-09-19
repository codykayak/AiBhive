/** After expo prebuild: copy SMS native module + patch AndroidManifest + MainApplication */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const nativeSrc = path.join(root, 'native', 'android');
const javaDest = path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'aibhive', 'leadagent');

function copyNative() {
  fs.mkdirSync(javaDest, { recursive: true });
  for (const file of fs.readdirSync(nativeSrc)) {
    if (file.endsWith('.kt')) {
      fs.copyFileSync(path.join(nativeSrc, file), path.join(javaDest, file));
    }
  }
}

function patchManifest() {
  const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  let xml = fs.readFileSync(manifestPath, 'utf8');
  if (xml.includes('SmsReceiver')) {
    console.log('Manifest already has SmsReceiver');
    return;
  }
  const receiver = `
    <receiver android:name=".SmsReceiver" android:exported="true" android:permission="android.permission.BROADCAST_SMS">
      <intent-filter>
        <action android:name="android.provider.Telephony.SMS_RECEIVED"/>
      </intent-filter>
    </receiver>`;
  xml = xml.replace('</application>', `${receiver}\n  </application>`);
  fs.writeFileSync(manifestPath, xml);
  console.log('Patched AndroidManifest.xml');
}

function findFiles(dir, name) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...findFiles(p, name));
    else if (ent.name === name) out.push(p);
  }
  return out;
}

function patchMainApplication() {
  const paths = findFiles(path.join(root, 'android'), 'MainApplication.kt');
  for (const p of paths) {
    let src = fs.readFileSync(p, 'utf8');
    if (src.includes('LeadAgentSmsPackage')) continue;
    src = src.replace(
      'import com.facebook.react',
      'import com.aibhive.leadagent.LeadAgentSmsPackage\nimport com.facebook.react',
    );
    src = src.replace(/PackageList\(this\)\.packages\.apply \{/, (m) => `${m}\n              add(LeadAgentSmsPackage())`);
    fs.writeFileSync(p, src);
    console.log('Patched', p);
  }
}

function patchBundleEmbedded() {
  const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
  if (!fs.existsSync(gradlePath)) return;
  let src = fs.readFileSync(gradlePath, 'utf8');
  if (src.includes('debuggableVariants = []')) {
    console.log('build.gradle already bundles JS in APK');
    return;
  }
  src = src.replace(
    /\/\* Variants \*\/[\s\S]*?\/\* Bundling \*\//,
    `/* Variants */
    // Embed JS in the APK — phone install must not require Metro on a dev PC.
    debuggableVariants = []

    /* Bundling */`,
  );
  fs.writeFileSync(gradlePath, src);
  console.log('Patched build.gradle — JS bundled in APK');
}

copyNative();
patchManifest();
patchMainApplication();
patchBundleEmbedded();
console.log('Post-prebuild SMS bridge complete');
