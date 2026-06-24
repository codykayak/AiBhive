/**
 * Hive Home Assistant — web search relay + knowledge serving.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as hiveUsage from './hiveUsage.js';
import { runIntelCloudTool } from './intelOsint.js';
import { HOME_ASSISTANT_KNOWLEDGE } from './homeAssistantKnowledgeBundled.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getHomeAssistantKnowledgeMarkdown() {
  const live = path.join(__dirname, '../shared/home-assistant-knowledge.md');
  if (fs.existsSync(live)) {
    return fs.readFileSync(live, 'utf8');
  }
  return HOME_ASSISTANT_KNOWLEDGE;
}

/** Pick Serp for short factual queries; Firecrawl search for deeper research. */
function pickSearchTool(query) {
  const q = String(query || '').toLowerCase();
  if (/(license|contractor|regulation|law|expired|dbpr|osint|investigate|company|domain)/.test(q)) {
    return 'firecrawl_search';
  }
  return 'serp_search';
}

/**
 * Run a billed web search for the home assistant.
 * @param {import('firebase-admin/firestore').Firestore} db
 */
export async function runHomeAssistantWebSearch(db, userId, query) {
  const trimmed = String(query || '').trim().slice(0, 500);
  if (!trimmed) {
    return { ok: false, error: 'Empty search query.' };
  }

  const toolId = pickSearchTool(trimmed);
  return runIntelCloudTool(db, hiveUsage, {
    userId,
    toolId,
    params: {
      company: trimmed,
      domain: '',
      userIntent: trimmed,
      url: '',
    },
  });
}
