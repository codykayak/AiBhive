/**
 * Unified orchestration: community toolkit first, then build, then guide.
 */
import { findToolkitMatch } from './hiveAppsApi.js';
import { listExampleApps } from './hiveExampleApps.js';

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'want', 'need', 'find', 'make', 'build', 'app', 'tool']);

function tokens(query) {
  return String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function scoreHaystack(hay, queryTokens, fullQuery) {
  const hayLower = hay.toLowerCase();
  let score = 0;
  for (const t of queryTokens) {
    if (hayLower.includes(t)) score += 2;
  }
  const fq = String(fullQuery || '').toLowerCase().slice(0, 48);
  if (fq && hayLower.includes(fq)) score += 5;
  return score;
}

function findExampleMatch(query) {
  const qTokens = tokens(query);
  if (!qTokens.length) return null;

  const rules = [
    {
      id: 'example-research',
      boost: ['research', 'osint', 'intel', 'investigate', 'company', 'defunct', 'closed', 'business'],
    },
    {
      id: 'example-job-hunter',
      boost: ['hunter', 'search', 'listings', 'cover', 'letter', 'daily', 'criteria'],
    },
    {
      id: 'example-social-post-hunter',
      boost: ['social', 'post', 'linkedin', 'reply', 'engage', 'content'],
    },
    {
      id: 'example-resume-bot',
      boost: ['resume', 'cover', 'application', 'hiring', 'interview'],
    },
    {
      id: 'example-job-tracker',
      boost: ['tracker', 'applications', 'pipeline', 'apply', 'jobs'],
    },
  ];

  const examples = listExampleApps();
  let best = null;
  let bestScore = 0;

  for (const ex of examples) {
    const hay = [ex.title, ex.tagline, ex.summary, ex.id].join(' ');
    let score = scoreHaystack(hay, qTokens, query);
    const rule = rules.find((r) => r.id === ex.id);
    if (rule) {
      for (const kw of rule.boost) {
        if (qTokens.includes(kw) || String(query).toLowerCase().includes(kw)) score += 3;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = ex;
    }
  }

  return bestScore >= 4 ? best : null;
}

export async function findBestToolOffer(db, query) {
  const q = String(query || '').trim();
  if (!q) return null;

  const community = await findToolkitMatch(db, q);
  if (community) {
    return {
      id: community.id,
      title: community.title,
      tagline: community.tagline,
      summary: community.summary,
      isExample: !!community.isExample,
    };
  }

  const example = findExampleMatch(q);
  if (example) {
    return {
      id: example.id,
      title: example.title,
      tagline: example.tagline,
      summary: example.summary,
      isExample: true,
    };
  }

  return null;
}

export function buildGuideSteps(offer, mode = 'install') {
  if (mode === 'failure_build') {
    return [
      'Describe the exact outcome you want in plain English',
      'Review the plan we propose together',
      'Confirm and Hive Magic builds it (simple apps ~$1)',
      'Your new tool lands in My Apps with a User Guide',
    ];
  }
  if (!offer) {
    return [
      'Tell me more about what you need',
      'We will propose a custom app plan',
      'Confirm to start the build',
    ];
  }
  return [
    `Install **${offer.title}** free from the community toolkit`,
    'Open it from **My Apps** and run your task',
    'Use **Tweak or Customize** if you want changes',
    'Still not right? Say **build custom** and we will make one for you',
  ];
}

export async function enrichHomeAssistantAction(db, userMessage, action, opts = {}) {
  const query = String(opts.failureContext || userMessage || '').trim();
  const offer = await findBestToolOffer(db, query);
  const enriched = { ...action };
  const guideSteps = buildGuideSteps(offer, offer ? 'install' : opts.failureContext ? 'failure_build' : 'install');

  const shouldOfferToolkit =
    offer &&
    (opts.failureContext ||
      action.intent === 'build' ||
      action.buildStage === 'discover' ||
      action.buildStage === 'propose' ||
      action.intent === 'tool');

  if (shouldOfferToolkit) {
    enriched.intent = 'toolkit_offer';
    enriched.toolkitAppId = offer.id;
    enriched.toolkitTitle = offer.title;
    enriched.toolkitSummary = offer.summary || offer.tagline || '';
    enriched.toolkitIsExample = !!offer.isExample;
    enriched.guideSteps = guideSteps;

    const installLine = `Someone in the community already built **${offer.title}** — you can install it free instead of waiting for a custom build.`;
    if (opts.failureContext) {
      enriched.reply =
        `${action.reply || "I couldn't finish that with built-in tools alone."}\n\n${installLine}\n\nOr tap **Build custom** and we will make exactly what you need.`;
    } else if (action.intent === 'build') {
      enriched.buildStage = action.buildStage === 'confirm' ? 'propose' : action.buildStage || 'propose';
      enriched.reply = `${action.reply}\n\n${installLine}\n\nInstall free, or continue with a custom build if you prefer.`;
    } else {
      enriched.reply = `${action.reply}\n\n${installLine}`;
    }
    return enriched;
  }

  if (opts.failureContext && !offer) {
    enriched.intent = 'build';
    enriched.buildStage = 'discover';
    enriched.offerBuild = true;
    enriched.guideSteps = guideSteps;
    enriched.reply =
      `${action.reply || "We couldn't complete that with what's built in today."}\n\n` +
      `We can **build a custom tool** for this — tell me who uses it, what goes in, and what you want out.`;
    return enriched;
  }

  if (offer && action.intent === 'chat') {
    enriched.toolkitAppId = offer.id;
    enriched.toolkitTitle = offer.title;
    enriched.toolkitSummary = offer.summary || offer.tagline || '';
    enriched.toolkitIsExample = !!offer.isExample;
    enriched.guideSteps = guideSteps;
  }

  return enriched;
}

export async function getFailureToolOffer(db, query, reason = '') {
  const offer = await findBestToolOffer(db, query);
  const guideSteps = buildGuideSteps(offer, offer ? 'install' : 'failure_build');

  if (offer) {
    return {
      ok: true,
      reply:
        `${reason ? `${reason}\n\n` : ''}` +
        `The community toolkit has **${offer.title}** — install free and try your task there.\n\n` +
        `Not quite right? We can build a custom version for you.`,
      toolkitApp: offer,
      offerBuild: true,
      guideSteps,
    };
  }

  return {
    ok: true,
    reply:
      `${reason ? `${reason}\n\n` : ''}` +
      `We do not have a ready-made tool for this yet — but we can **build one** from your description (~$1 for simple apps).`,
    toolkitApp: null,
    offerBuild: true,
    guideSteps,
  };
}
