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

export function mergeOverview(real, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  if (!show) return real;

  const demoJobs = getDemoJobsByStatus();
  const demoActivity = getDemoActivity();
  const demoTechs = getDemoTeamMembers().length;

  const jobsByStatus = real.jobsTotal > 0 ? real.jobsByStatus : demoJobs;
  const jobsTotal = real.jobsTotal > 0 ? real.jobsTotal : 14;
  const openJobs = real.jobsTotal > 0 ? real.openJobs : 6;

  return withDemoFlag(
    {
      ...real,
      members: real.techs > 0 ? real.members : real.members + demoTechs,
      techs: real.techs > 0 ? real.techs : demoTechs,
      jobsTotal,
      jobsByStatus,
      openJobs,
      recentActivity:
        real.recentActivity?.length > 0
          ? real.recentActivity
          : demoActivity,
    },
    true
  );
}

export function mergeAnalytics(real, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  if (!show) return real;

  const hasGrowth = real.knowledgeGrowth?.length > 0;
  const hasTotals =
    (real.totals?.tips || 0) + (real.totals?.feedback || 0) + (real.totals?.jobsTotal || 0) >= 6;

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
  let jobs = [...realJobs];
  if (show && realJobs.length < 4) {
    jobs = [...realJobs, ...getDemoJobs()];
  }
  if (role === 'tech') {
    jobs = jobs.filter((j) => !j.isDemo || j.assigneeUid === userUid);
  }
  jobs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return withDemoFlag({ jobs }, show && realJobs.length < 4);
}

export function mergeTeam(realMembers, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  const realTechs = realMembers.filter((m) => m.role === 'tech').length;
  let members = [...realMembers];
  if (show && realTechs === 0) {
    members = [...realMembers, ...getDemoTeamMembers()];
  }
  return withDemoFlag({ members }, show && realTechs === 0);
}

export function mergeNotifications(realItems, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  let notifications = [...realItems];
  if (show && realItems.length < 3) {
    notifications = [...getDemoNotifications(), ...realItems];
  }
  return withDemoFlag({ notifications }, show && realItems.length < 3);
}

export function mergePartRequests(realRequests, settings, counts, statusFilter = 'all') {
  const show = shouldShowDemoPreview(settings, counts);
  let requests = [...realRequests];
  if (show && realRequests.length === 0) {
    requests = getDemoPartRequests();
  }
  if (statusFilter !== 'all') {
    requests = requests.filter((r) => r.status === statusFilter);
  }
  return withDemoFlag({ requests }, show && realRequests.length === 0);
}

export function mergeLocations(realLocations, settings, counts) {
  const show = shouldShowDemoPreview(settings, counts);
  let locations = [...realLocations];
  if (show && realLocations.length === 0) {
    locations = getDemoLocations();
  }
  return withDemoFlag({ locations }, show && realLocations.length === 0);
}
