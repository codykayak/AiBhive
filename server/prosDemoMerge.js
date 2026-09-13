import {
  DEMO_DISCLAIMER,
  getDemoActivity,
  getDemoAnalyticsTotals,
  getDemoFeaturedTip,
  getDemoJobs,
  getDemoJobsByStatus,
  getDemoKnowledgeGrowth,
  getDemoLocations,
  getDemoNotifications,
  getDemoPartRequests,
  getDemoTeamMembers,
  isDemoId,
  shouldShowDemoPreview,
} from './prosDemoData.js';

export { isDemoId, DEMO_DISCLAIMER };

function withDemoFlag(payload, demoPreview) {
  if (!demoPreview) return payload;
  return { ...payload, demoPreview: true, demoDisclaimer: DEMO_DISCLAIMER };
}

/** Append demo rows not already present (by id / uid). */
function appendDemo(real, demoItems, idKey = 'id') {
  const seen = new Set(real.map((x) => x[idKey]));
  return [...real, ...demoItems.filter((d) => !seen.has(d[idKey]))];
}

function mergeActivity(realActivity, demoActivity) {
  const seen = new Set((realActivity || []).map((a) => a.id));
  const merged = [...(realActivity || []), ...demoActivity.filter((a) => !seen.has(a.id))];
  merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return merged.slice(0, 24);
}

export function mergeOverview(real, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  if (!show) return real;

  const demoJobs = getDemoJobsByStatus();
  const demoActivity = getDemoActivity();
  const demoTeam = getDemoTeamMembers();
  const useDemoJobStats = (real.jobsTotal || 0) < 8;

  return withDemoFlag(
    {
      ...real,
      members: real.techs > 0 ? Math.max(real.members, real.members + 1) : real.members + demoTeam.length,
      techs: real.techs > 0 ? Math.max(real.techs, demoTeam.filter((m) => m.role === 'tech').length) : demoTeam.length,
      jobsTotal: useDemoJobStats ? 28 : real.jobsTotal + getDemoJobs().length,
      jobsByStatus: useDemoJobStats ? demoJobs : real.jobsByStatus,
      openJobs: useDemoJobStats ? 8 : real.openJobs,
      recentActivity: mergeActivity(real.recentActivity, demoActivity),
    },
    true
  );
}

export function mergeAnalytics(real, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  if (!show) return real;

  const hasGrowth = real.knowledgeGrowth?.length > 0;
  const hasTotals =
    (real.totals?.tips || 0) + (real.totals?.feedback || 0) + (real.totals?.jobsTotal || 0) >= 12;

  return withDemoFlag(
    {
      totals: hasTotals ? real.totals : getDemoAnalyticsTotals(),
      knowledgeGrowth: hasGrowth ? real.knowledgeGrowth : getDemoKnowledgeGrowth(),
      featuredTip: real.featuredTip || getDemoFeaturedTip(),
      platformCosts: real.platformCosts,
    },
    true
  );
}

export function mergeJobs(realJobs, settings, counts, { role, userUid } = {}) {
  const show = shouldShowDemoPreview(settings, counts);
  let jobs = show ? appendDemo(realJobs, getDemoJobs()) : [...realJobs];
  if (role === 'tech') {
    jobs = jobs.filter((j) => !j.isDemo || j.assigneeUid === userUid);
  }
  jobs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return withDemoFlag({ jobs }, show);
}

export function mergeTeam(realMembers, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  const members = show ? appendDemo(realMembers, getDemoTeamMembers(), 'uid') : [...realMembers];
  return withDemoFlag({ members }, show);
}

export function mergeNotifications(realItems, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  const notifications = show
    ? appendDemo(realItems, getDemoNotifications())
    : [...realItems];
  notifications.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return withDemoFlag({ notifications }, show);
}

export function mergePartRequests(realRequests, settings, counts, statusFilter = 'all') {
  const show = shouldShowDemoPreview(settings, counts);
  let requests = show ? appendDemo(realRequests, getDemoPartRequests()) : [...realRequests];
  if (statusFilter !== 'all') {
    requests = requests.filter((r) => r.status === statusFilter);
  }
  requests.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return withDemoFlag({ requests }, show);
}

export function mergeLocations(realLocations, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  const locations = show ? appendDemo(realLocations, getDemoLocations(), 'uid') : [...realLocations];
  return withDemoFlag({ locations }, show);
}
