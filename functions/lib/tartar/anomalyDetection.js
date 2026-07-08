/**
 * Statistical anomaly detection for historical entity output.
 */

const DEFAULT_RULES = {
  highOutputWindowYears: 10,
  highOutputMinCount: 15,
  highOutputMinScore: 60,
};

/**
 * Detect entities with unusually high project/mention counts in narrow time windows.
 * @param {Array<{entityId: string, entityName: string, entityType: string, year: number, project?: string}>} mentions
 * @param {object} [rules]
 */
export function detectAnomalies(mentions, rules = {}) {
  const cfg = { ...DEFAULT_RULES, ...rules };
  const byEntity = groupByEntity(mentions);
  const anomalies = [];

  for (const [entityId, rows] of Object.entries(byEntity)) {
    const years = rows.map((r) => r.year).filter((y) => Number.isFinite(y)).sort((a, b) => a - b);
    if (years.length < cfg.highOutputMinCount) continue;

    const entityName = rows[0].entityName;
    const entityType = rows[0].entityType;

    // Sliding window over years
    const windowResult = findDensestWindow(years, cfg.highOutputWindowYears);
    if (windowResult.count >= cfg.highOutputMinCount) {
      const baseline = years.length / (years[years.length - 1] - years[0] + 1 || 1);
      const windowRate = windowResult.count / cfg.highOutputWindowYears;
      const ratio = baseline > 0 ? windowRate / baseline : windowRate;
      const score = Math.min(100, Math.round(40 + ratio * 15 + windowResult.count));

      if (score >= cfg.highOutputMinScore) {
        const projects = new Set(
          rows
            .filter((r) => r.year >= windowResult.start && r.year <= windowResult.end)
            .map((r) => r.project)
            .filter(Boolean),
        );
        anomalies.push({
          entityId,
          entityName,
          entityType,
          kind: 'high_output_narrow_window',
          score,
          count: windowResult.count,
          projectCount: projects.size,
          windowYears: cfg.highOutputWindowYears,
          windowStartYear: windowResult.start,
          windowEndYear: windowResult.end,
          summary: `${entityName} credited with ${windowResult.count} mentions (${projects.size} distinct projects) between ${windowResult.start}–${windowResult.end} — ${ratio.toFixed(1)}× baseline rate.`,
          details: { ratio, baselineRate: baseline, windowRate },
          status: 'open',
        });
      }
    }
  }

  return anomalies.sort((a, b) => b.score - a.score);
}

function groupByEntity(mentions) {
  const map = {};
  for (const m of mentions) {
    const key = m.entityId || normalizeName(m.entityName);
    if (!map[key]) map[key] = [];
    map[key].push({ ...m, entityId: key });
  }
  return map;
}

function normalizeName(name) {
  return String(name ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function findDensestWindow(years, windowSize) {
  if (!years.length) return { start: 0, end: 0, count: 0 };
  let best = { start: years[0], end: years[0] + windowSize, count: 0 };

  for (let i = 0; i < years.length; i++) {
    const start = years[i];
    const end = start + windowSize;
    let count = 0;
    for (let j = i; j < years.length && years[j] <= end; j++) count++;
    if (count > best.count) best = { start, end, count };
  }
  return best;
}

/**
 * Build query filters for Firestore mention documents (client or server).
 */
export function buildMentionQueryFilters(filters = {}) {
  const out = {};
  if (filters.entityName) out.entityNamePrefix = String(filters.entityName).toLowerCase();
  if (filters.entityType) out.entityType = filters.entityType;
  if (filters.role) out.role = filters.role;
  if (filters.sourceId) out.sourceId = filters.sourceId;
  if (filters.yearMin != null) out.yearMin = Number(filters.yearMin);
  if (filters.yearMax != null) out.yearMax = Number(filters.yearMax);
  if (filters.location) out.locationContains = String(filters.location).toLowerCase();
  if (filters.minAppearances != null) out.minAppearances = Number(filters.minAppearances);
  return out;
}
