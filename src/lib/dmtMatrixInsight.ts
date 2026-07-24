/**
 * Context builders + system prompt for DMT Matrix Library insight chat.
 */

export const DMT_INSIGHT_TARGET_CONTEXT = `You are the DMT Matrix insight analyst for AiBhive Research Lab.

Your job: explain 650nm laser-diffraction / DMT visual glyph research in plain, honest English.

Rules:
- Ground every answer in the library entry data provided — do not invent glyphs, script matches, or statistics.
- When entropy, bigrams, classification, or similarity scores appear, explain what they mean for a non-expert and what they do NOT prove.
- Distinguish clearly between: (1) statistical patterns, (2) visual resemblance to known scripts, (3) community hypotheses, (4) speculation.
- If the data is weak or ambiguous, say so directly — do not oversell linguistic claims.
- Use short paragraphs and bullet points when helpful.
- Suggest concrete next experiments when asked "what does this mean?" or "what next?".`;

export type DmtInsightEntry = {
  id: string;
  type?: string;
  title?: string;
  headline?: string;
  summary?: string;
  contributor?: string;
  createdAt?: string;
  classification?: string;
  classificationConfidence?: number;
  classificationRationale?: string[];
  shannonEntropy?: number;
  symbolCount?: number;
  detectionCount?: number;
  promisingMatches?: Array<{
    glyphId?: string;
    glyphName?: string;
    script?: string;
    characterOrForm?: string;
    similarityScore?: number;
    reasoning?: string;
  }>;
  namingHypotheses?: Array<{ name?: string; rationale?: string; contributor?: string }>;
  merged?: Array<{
    symbolId?: string;
    tokenId?: string;
    name?: string;
    confidence?: number;
    catalogDescription?: string;
  }>;
  tokenSequence?: string[];
  frequencyRanking?: Array<{ rank?: number; id?: string; name?: string; tokenId?: string; tags?: string[] }>;
  topBigrams?: Array<{ pair?: string; probability?: number }>;
  nextExperiments?: string[];
  researchFlags?: string[];
  spatialLayout?: string;
};

export type DmtInsightContribution = {
  kind?: string;
  contributor?: string;
  name?: string;
  text?: string;
  script?: string;
};

function pct(n?: number) {
  if (n == null || Number.isNaN(n)) return null;
  return `${Math.round(Number(n) * 100)}%`;
}

export function buildDmtEntryContext(
  entry: DmtInsightEntry,
  contributions?: DmtInsightContribution[],
): string {
  const lines: string[] = [
    `## ${entry.title || 'DMT finding'} (${entry.type || 'unknown'})`,
    entry.headline && `Headline: ${entry.headline}`,
    entry.summary && `Summary: ${entry.summary}`,
    entry.contributor && `Contributor: ${entry.contributor}`,
    entry.createdAt && `Published: ${entry.createdAt}`,
  ];

  if (entry.classification) {
    lines.push(
      `Classification: ${entry.classification}${entry.classificationConfidence != null ? ` (${pct(entry.classificationConfidence)} confidence)` : ''}`,
    );
  }
  if (entry.classificationRationale?.length) {
    lines.push(`Classification rationale:\n${entry.classificationRationale.map((r) => `- ${r}`).join('\n')}`);
  }
  if (entry.shannonEntropy != null) {
    lines.push(`Shannon entropy: ${entry.shannonEntropy.toFixed(3)} bits`);
  }
  if (entry.symbolCount != null) lines.push(`Corpus symbol count: ${entry.symbolCount}`);
  if (entry.detectionCount != null) lines.push(`Photo detections: ${entry.detectionCount}`);
  if (entry.spatialLayout) lines.push(`Spatial layout: ${entry.spatialLayout}`);

  if (entry.promisingMatches?.length) {
    lines.push(
      'Promising script matches:',
      ...entry.promisingMatches.slice(0, 12).map(
        (m) =>
          `- ${m.glyphName || m.glyphId}: ${m.script} → "${m.characterOrForm}" (${pct(m.similarityScore)} similar)${m.reasoning ? ` — ${m.reasoning}` : ''}`,
      ),
    );
  }

  if (entry.frequencyRanking?.length) {
    lines.push(
      'Top frequent glyphs:',
      ...entry.frequencyRanking.slice(0, 10).map(
        (g) => `- #${g.rank} ${g.name} (${g.tokenId || g.id})`,
      ),
    );
  }

  if (entry.topBigrams?.length) {
    lines.push(
      'Top bigram transitions:',
      ...entry.topBigrams.slice(0, 8).map(
        (b) => `- ${b.pair} (${b.probability != null ? pct(b.probability) : '?'})`,
      ),
    );
  }

  if (entry.merged?.length) {
    lines.push(
      'Photo decode detections:',
      ...entry.merged.slice(0, 20).map(
        (m) => `- ${m.name} (${m.tokenId || m.symbolId}, ${pct(m.confidence)} conf)${m.catalogDescription ? `: ${m.catalogDescription}` : ''}`,
      ),
    );
  }

  if (entry.tokenSequence?.length) {
    lines.push(`Token sequence: ${entry.tokenSequence.slice(0, 24).join(' → ')}`);
  }

  if (entry.namingHypotheses?.length) {
    lines.push(
      'Naming hypotheses:',
      ...entry.namingHypotheses.slice(0, 8).map(
        (h) => `- ${h.name}${h.contributor ? ` (${h.contributor})` : ''}${h.rationale ? `: ${h.rationale}` : ''}`,
      ),
    );
  }

  if (entry.nextExperiments?.length) {
    lines.push('Suggested next experiments:', ...entry.nextExperiments.map((e) => `- ${e}`));
  }

  if (entry.researchFlags?.length) {
    lines.push('Research flags:', ...entry.researchFlags.map((f) => `- ${f}`));
  }

  if (contributions?.length) {
    lines.push(
      'Community contributions:',
      ...contributions.slice(0, 12).map(
        (c) => `- [${c.kind}] ${c.name || c.script || ''}${c.text ? `: ${c.text}` : ''} (${c.contributor || 'community'})`,
      ),
    );
  }

  return lines.filter(Boolean).join('\n').slice(0, 14000);
}

export function buildDmtEntriesContext(
  entries: DmtInsightEntry[],
  { searchQuery, typeFilter }: { searchQuery?: string; typeFilter?: string } = {},
): string {
  const header = [
  searchQuery ? `Search query: "${searchQuery}"` : null,
    typeFilter && typeFilter !== 'all' ? `Filter: ${typeFilter}` : null,
    `Showing ${entries.length} library finding(s).`,
  ]
    .filter(Boolean)
    .join('\n');

  const body = entries
    .slice(0, 12)
    .map((e, i) => `### Finding ${i + 1}\n${buildDmtEntryContext(e)}`)
    .join('\n\n');

  return `${header}\n\n${body}`.slice(0, 14000);
}

export const DMT_INSIGHT_STARTERS = [
  'Explain this like I am new — what did we actually find?',
  'Is this a real writing system or just geometric patterns?',
  'Which numbers matter here and what do they mean?',
  'What should I pay attention to, and what is noise?',
];

export const DMT_SEARCH_STARTERS = [
  'Summarize what these findings mean together.',
  'Is there a pattern across these results?',
  'What is the strongest evidence here?',
  'What should a newcomer read first?',
];

/** Build context from a live corpus research report (decoder page). */
export function buildDmtResearchReportContext(report: {
  reportId?: string;
  assessment?: { classification?: string; confidence?: number; rationale?: string[] };
  stats?: {
    symbolCount?: number;
    shannonEntropy?: number;
    frequencyRanking?: DmtInsightEntry['frequencyRanking'];
    topBigrams?: DmtInsightEntry['topBigrams'];
  };
  promisingMatches?: DmtInsightEntry['promisingMatches'];
  synthesis?: {
    headline?: string;
    summary?: string;
    namingHypotheses?: DmtInsightEntry['namingHypotheses'];
    nextExperiments?: string[];
    confidenceInStructuredLanguage?: number;
  };
  budget?: { apiSpentUsd?: number; glyphsCompared?: number };
}): string {
  return buildDmtEntryContext({
    id: report.reportId || 'live-research',
    type: 'corpus_research',
    title: report.synthesis?.headline || 'Live corpus research report',
    headline: report.synthesis?.headline,
    summary: report.synthesis?.summary,
    classification: report.assessment?.classification,
    classificationConfidence: report.assessment?.confidence,
    classificationRationale: report.assessment?.rationale,
    shannonEntropy: report.stats?.shannonEntropy,
    symbolCount: report.stats?.symbolCount,
    promisingMatches: report.promisingMatches,
    frequencyRanking: report.stats?.frequencyRanking,
    topBigrams: report.stats?.topBigrams,
    namingHypotheses: report.synthesis?.namingHypotheses,
    nextExperiments: report.synthesis?.nextExperiments,
  });
}

/** Build context from a live photo decode result (decoder page). */
export function buildDmtDecodeResultContext(result: {
  sessionId?: string;
  merged?: DmtInsightEntry['merged'];
  syntax?: { shannonEntropy?: number; tokenSequence?: string[]; spatialGraph?: { layoutType?: string } };
  vision?: {
    summary?: string;
    matrixStructure?: string;
    decodeNotes?: string;
    researchFlags?: string[];
  };
}): string {
  return buildDmtEntryContext({
    id: result.sessionId || 'live-decode',
    type: 'photo_decode',
    title: 'Live photo decode',
    summary: [result.vision?.summary, result.vision?.decodeNotes].filter(Boolean).join(' · '),
    detectionCount: result.merged?.length,
    shannonEntropy: result.syntax?.shannonEntropy,
    spatialLayout: result.syntax?.spatialGraph?.layoutType,
    merged: result.merged,
    tokenSequence: result.syntax?.tokenSequence,
    researchFlags: result.vision?.researchFlags,
  });
}
