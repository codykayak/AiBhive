import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function webAppUrl(owner, slug) {
  return `https://aibhive.com/u/${owner}/${slug}/`;
}

/**
 * List exported static web apps from cody/apps/index.json and on-disk folders.
 */
export function listPublishedWebApps() {
  const registryPath = path.join(ROOT, 'cody', 'apps', 'index.json');
  const registry = readJsonSafe(registryPath);
  const fromRegistry = Array.isArray(registry?.apps) ? registry.apps : [];

  const seen = new Set();
  const apps = [];

  for (const row of fromRegistry) {
    if (!row?.owner || !row?.slug) continue;
    const key = `${row.owner}/${row.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    apps.push({
      id: key,
      owner: row.owner,
      slug: row.slug,
      title: row.title || row.slug,
      summary: row.summary || '',
      taskId: row.taskId || null,
      url: webAppUrl(row.owner, row.slug),
      kind: 'web_app',
    });
  }

  const scanRoots = [
    path.join(ROOT, 'dist', 'cody', 'apps'),
    path.join(ROOT, 'cody', 'apps'),
  ];

  for (const scanRoot of scanRoots) {
    if (!fs.existsSync(scanRoot)) continue;
    for (const owner of fs.readdirSync(scanRoot, { withFileTypes: true })) {
      if (!owner.isDirectory() || owner.name === 'node_modules') continue;
      const ownerPath = path.join(scanRoot, owner.name);
      for (const slugDir of fs.readdirSync(ownerPath, { withFileTypes: true })) {
        if (!slugDir.isDirectory()) continue;
        const key = `${owner.name}/${slugDir.name}`;
        if (seen.has(key)) continue;
        const indexPath = path.join(ownerPath, slugDir.name, 'index.html');
        if (!fs.existsSync(indexPath)) continue;
        seen.add(key);
        apps.push({
          id: key,
          owner: owner.name,
          slug: slugDir.name,
          title: slugDir.name.replace(/-/g, ' '),
          summary: 'Exported Hive web app',
          taskId: null,
          url: webAppUrl(owner.name, slugDir.name),
          kind: 'web_app',
        });
      }
    }
  }

  return apps.sort((a, b) => a.title.localeCompare(b.title));
}
