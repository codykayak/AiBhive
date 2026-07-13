/**
 * Illustrative Pros HQ data — merged at read time for sparse companies.
 * All ids are prefixed with `demo-`; never written to Firestore.
 */

const DAY = 86_400_000;
const now = Date.now();
const ago = (days) => now - days * DAY;

export function isDemoId(id) {
  return String(id || '').startsWith('demo-');
}

export function demoPreviewEnabled(settings = {}) {
  return settings.demoPreviewEnabled !== false;
}

/** Show sample data until the shop has meaningful real activity. */
export function shouldShowDemoPreview(settings, counts = {}) {
  if (!demoPreviewEnabled(settings)) return false;
  const score =
    (counts.jobs || 0) +
    (counts.tips || 0) +
    (counts.feedback || 0) +
    (counts.parts || 0) +
    (counts.notifications || 0);
  return score < 6;
}

export const DEMO_DISCLAIMER =
  'Sample data previews what a thriving shop looks like. It disappears as you add real jobs, tips, and parts.';

export function getDemoKnowledgeGrowth() {
  return [
    { month: '2026-02', label: 'Feb', tips: 18, feedback: 14, jobsDone: 9, activity: 22 },
    { month: '2026-03', label: 'Mar', tips: 31, feedback: 24, jobsDone: 17, activity: 38 },
    { month: '2026-04', label: 'Apr', tips: 44, feedback: 36, jobsDone: 26, activity: 51 },
    { month: '2026-05', label: 'May', tips: 62, feedback: 49, jobsDone: 34, activity: 68 },
    { month: '2026-06', label: 'Jun', tips: 81, feedback: 67, jobsDone: 45, activity: 89 },
    { month: '2026-07', label: 'Jul', tips: 97, feedback: 78, jobsDone: 52, activity: 104 },
  ];
}

export function getDemoFeaturedTip() {
  return {
    id: 'demo-tip-1',
    text: 'IntelliFlo VSF showing "Priming" loop — check skimmer/weir for air leak before replacing the pump.',
    fixSummary: 'Tightened union at pump inlet; cleared debris from weir door. Saved a $680 pump swap.',
    packId: 'pool',
    helpfulCount: 14,
  };
}

export function getDemoAnalyticsTotals() {
  return {
    tips: 97,
    feedback: 78,
    manualChunks: 12,
    jobsTotal: 14,
    jobsDone: 52,
    fieldNotes: 38,
    openJobs: 6,
  };
}

export function getDemoJobsByStatus() {
  return { queued: 2, in_progress: 2, needs_parts: 2, done: 8 };
}

export function getDemoJobs() {
  return [
    {
      id: 'demo-job-1',
      title: 'IntelliFlo VSF — priming loop / low flow',
      address: '1842 Lakeshore Dr, Austin TX',
      customerName: 'Rebecca Holt',
      customerPhone: '(512) 555-0142',
      notes: 'Pump runs but flow meter stuck at 12 GPM. Customer reports air in basket.',
      adminNotes: 'Bring union wrench; check weir door.',
      packId: 'pool',
      status: 'in_progress',
      priority: 'high',
      assigneeUid: 'demo-tech-1',
      assigneeName: 'Marcus Rivera',
      scheduledFor: 'Today 9:00 AM',
      fieldNotes: [
        {
          id: 'demo-fn-1',
          text: 'Nameplate: Pentair 011028. Basket has fine debris; union at pump inlet slightly loose.',
          authorUid: 'demo-tech-1',
          createdAt: ago(0.1),
        },
      ],
      photos: [],
      faultIds: [],
      createdAt: ago(2),
      updatedAt: ago(0.1),
      completedAt: null,
      isDemo: true,
    },
    {
      id: 'demo-job-2',
      title: 'Carrier heat pump — no cool, outdoor unit humming',
      address: '902 Ridgeview Ln, Round Rock TX',
      customerName: 'David & Ana Kim',
      customerPhone: '(512) 555-0198',
      notes: 'No cooling since yesterday. Outdoor fan spins, no cold air.',
      adminNotes: '',
      packId: 'hvac',
      status: 'needs_parts',
      priority: 'emergency',
      assigneeUid: 'demo-tech-2',
      assigneeName: 'Jordan Lee',
      scheduledFor: 'Today 11:30 AM',
      fieldNotes: [
        {
          id: 'demo-fn-2',
          text: 'Low suction, 45° split. Contactor pitted — ordered replacement via Parts tab.',
          authorUid: 'demo-tech-2',
          createdAt: ago(0.3),
        },
      ],
      photos: [],
      faultIds: [],
      createdAt: ago(1),
      updatedAt: ago(0.3),
      completedAt: null,
      isDemo: true,
    },
    {
      id: 'demo-job-3',
      title: '200A panel upgrade — rough inspection prep',
      address: '4401 Elm Creek Blvd, Cedar Park TX',
      customerName: 'Westlake Property Mgmt',
      customerPhone: '(512) 555-0221',
      notes: 'Subpanel labels missing; AFCI breakers for kitchen renovation.',
      adminNotes: 'Permit #EL-2026-1847 on file.',
      packId: 'electrical',
      status: 'queued',
      priority: 'normal',
      assigneeUid: 'demo-tech-3',
      assigneeName: 'Sam Chen',
      scheduledFor: 'Wed 8:00 AM',
      fieldNotes: [],
      photos: [],
      faultIds: [],
      createdAt: ago(3),
      updatedAt: ago(3),
      completedAt: null,
      isDemo: true,
    },
    {
      id: 'demo-job-4',
      title: 'Sta-Rite heater — ignition failure',
      address: '77 Palm Court, Lakeway TX',
      customerName: 'Chris Navarro',
      customerPhone: '(512) 555-0167',
      notes: 'Heater fires then faults IF code. Gas pressure OK at meter.',
      adminNotes: '',
      packId: 'pool',
      status: 'done',
      priority: 'normal',
      assigneeUid: 'demo-tech-1',
      assigneeName: 'Marcus Rivera',
      scheduledFor: 'Fri 2:00 PM',
      fieldNotes: [
        {
          id: 'demo-fn-3',
          text: 'Flame sensor cleaned; heat exchanger OK. Tip logged to knowledge base.',
          authorUid: 'demo-tech-1',
          createdAt: ago(4),
        },
      ],
      photos: [],
      faultIds: [],
      createdAt: ago(5),
      updatedAt: ago(4),
      completedAt: ago(4),
      isDemo: true,
    },
    {
      id: 'demo-job-5',
      title: 'Kitchen GFCI tripping — dishwasher circuit',
      address: '2100 Barton Springs Rd, Austin TX',
      customerName: 'Priya Shah',
      customerPhone: '(512) 555-0133',
      notes: 'Trips when dishwasher and disposal run together.',
      adminNotes: '',
      packId: 'electrical',
      status: 'in_progress',
      priority: 'normal',
      assigneeUid: 'demo-tech-3',
      assigneeName: 'Sam Chen',
      scheduledFor: 'Today 3:00 PM',
      fieldNotes: [],
      photos: [],
      faultIds: [],
      createdAt: ago(1),
      updatedAt: ago(0.5),
      completedAt: null,
      isDemo: true,
    },
    {
      id: 'demo-job-6',
      title: 'Annual pool open — salt cell & chemistry balance',
      address: '3300 Scenic Dr, Austin TX',
      customerName: 'Greenfield HOA',
      customerPhone: '(512) 555-0200',
      notes: 'Open 3 community pools. Bring test kit refills.',
      adminNotes: 'Gate code 4421#',
      packId: 'pool',
      status: 'queued',
      priority: 'normal',
      assigneeUid: 'demo-tech-1',
      assigneeName: 'Marcus Rivera',
      scheduledFor: 'Mon 7:00 AM',
      fieldNotes: [],
      photos: [],
      faultIds: [],
      createdAt: ago(0.5),
      updatedAt: ago(0.5),
      completedAt: null,
      isDemo: true,
    },
  ];
}

export function getDemoTeamMembers() {
  return [
    {
      uid: 'demo-tech-1',
      email: 'marcus.rivera@demo.aibhive.com',
      displayName: 'Marcus Rivera',
      photoUrl: null,
      role: 'tech',
      status: 'active',
      tradePack: 'pool',
      joinedAt: ago(120),
      isDemo: true,
    },
    {
      uid: 'demo-tech-2',
      email: 'jordan.lee@demo.aibhive.com',
      displayName: 'Jordan Lee',
      photoUrl: null,
      role: 'tech',
      status: 'active',
      tradePack: 'hvac',
      joinedAt: ago(90),
      isDemo: true,
    },
    {
      uid: 'demo-tech-3',
      email: 'sam.chen@demo.aibhive.com',
      displayName: 'Sam Chen',
      photoUrl: null,
      role: 'tech',
      status: 'active',
      tradePack: 'electrical',
      joinedAt: ago(60),
      isDemo: true,
    },
  ];
}

export function getDemoPartRequests() {
  return [
    {
      id: 'demo-part-1',
      status: 'pending_approval',
      partName: 'Hayward Super Pump impeller & seal kit',
      partNumber: 'SPX1600Z2',
      quantity: 1,
      brand: 'Hayward',
      equipmentModel: 'SP2607X10',
      notes: 'Customer pool down — need by Thursday.',
      jobId: 'demo-job-1',
      jobTitle: 'IntelliFlo VSF — priming loop / low flow',
      packId: 'pool',
      diagnoseQuery: 'Low flow on Pentair pump, impeller noise',
      requestedByUid: 'demo-tech-1',
      requestedByName: 'Marcus Rivera',
      requestedByEmail: 'marcus.rivera@demo.aibhive.com',
      approvedByName: null,
      orderedByName: null,
      declineReason: null,
      supplierNote: null,
      createdAt: ago(0.2),
      updatedAt: ago(0.2),
      approvedAt: null,
      orderedAt: null,
      isDemo: true,
    },
    {
      id: 'demo-part-2',
      status: 'pending_approval',
      partName: 'Carrier contactor 2-pole 40A',
      partNumber: 'HC43GE230',
      quantity: 1,
      brand: 'Carrier',
      equipmentModel: '25HCC524A003',
      notes: 'Pitted contacts — outdoor unit not starting compressor.',
      jobId: 'demo-job-2',
      jobTitle: 'Carrier heat pump — no cool',
      packId: 'hvac',
      diagnoseQuery: 'Heat pump outdoor humming no cool',
      requestedByUid: 'demo-tech-2',
      requestedByName: 'Jordan Lee',
      requestedByEmail: 'jordan.lee@demo.aibhive.com',
      approvedByName: null,
      orderedByName: null,
      declineReason: null,
      supplierNote: null,
      createdAt: ago(0.35),
      updatedAt: ago(0.35),
      approvedAt: null,
      orderedAt: null,
      isDemo: true,
    },
    {
      id: 'demo-part-3',
      status: 'approved',
      partName: 'Pentair IntelliChlor salt cell',
      partNumber: '520555',
      quantity: 1,
      brand: 'Pentair',
      equipmentModel: 'IC40',
      notes: 'Cell reading 0% — confirmed failed flow switch OK.',
      jobId: null,
      jobTitle: null,
      packId: 'pool',
      diagnoseQuery: 'Salt cell not producing chlorine',
      requestedByUid: 'demo-tech-1',
      requestedByName: 'Marcus Rivera',
      requestedByEmail: 'marcus.rivera@demo.aibhive.com',
      approvedByName: 'Office Manager',
      orderedByName: null,
      declineReason: null,
      supplierNote: null,
      createdAt: ago(1.5),
      updatedAt: ago(0.8),
      approvedAt: ago(0.8),
      orderedAt: null,
      isDemo: true,
    },
    {
      id: 'demo-part-4',
      status: 'ordered',
      partName: 'Sta-Rite Max-E-Pro pump seal plate o-ring',
      partNumber: 'U006-906S',
      quantity: 2,
      brand: 'Sta-Rite',
      equipmentModel: 'MPE-5',
      notes: 'Stock spare for route truck.',
      jobId: 'demo-job-4',
      jobTitle: 'Sta-Rite heater — ignition failure',
      packId: 'pool',
      diagnoseQuery: 'Pump leaking at seal plate',
      requestedByUid: 'demo-tech-1',
      requestedByName: 'Marcus Rivera',
      requestedByEmail: 'marcus.rivera@demo.aibhive.com',
      approvedByName: 'Office Manager',
      orderedByName: 'Accounting',
      declineReason: null,
      supplierNote: 'PO #4821 — Pool Supply World, ETA Fri',
      createdAt: ago(3),
      updatedAt: ago(2),
      approvedAt: ago(2.5),
      orderedAt: ago(2),
      isDemo: true,
    },
  ];
}

export function getDemoNotifications() {
  return [
    {
      id: 'demo-notif-1',
      title: 'New job assigned',
      body: 'IntelliFlo VSF — priming loop. 1842 Lakeshore Dr, 9:00 AM.',
      type: 'job_update',
      priority: 'high',
      jobId: 'demo-job-1',
      jobTitle: 'IntelliFlo VSF — priming loop / low flow',
      assigneeUid: 'demo-tech-1',
      assigneeName: 'Marcus Rivera',
      status: 'completed',
      response: {
        completed: true,
        fixSummary: 'En route — ETA 15 min',
        tipText: null,
        respondedByUid: 'demo-tech-1',
      },
      createdAt: ago(2),
      respondedAt: ago(1.9),
      isDemo: true,
    },
    {
      id: 'demo-notif-2',
      title: 'Part request submitted',
      body: 'Jordan Lee requested Carrier contactor HC43GE230 for heat pump job.',
      type: 'announcement',
      priority: 'normal',
      jobId: 'demo-job-2',
      jobTitle: 'Carrier heat pump — no cool',
      assigneeUid: null,
      assigneeName: null,
      status: 'pending',
      response: null,
      createdAt: ago(0.35),
      respondedAt: null,
      isDemo: true,
    },
    {
      id: 'demo-notif-3',
      title: 'Fix of the week',
      body: 'Marcus logged a tip: IntelliFlo priming loop — check weir before replacing pump.',
      type: 'announcement',
      priority: 'normal',
      jobId: null,
      jobTitle: null,
      assigneeUid: null,
      assigneeName: null,
      status: 'pending',
      response: null,
      createdAt: ago(1),
      respondedAt: null,
      isDemo: true,
    },
  ];
}

export function getDemoActivity() {
  return [
    {
      id: 'demo-act-1',
      type: 'knowledge_tip',
      message: 'Field tip added: IntelliFlo priming — check skimmer weir for air leak',
      actorUid: 'demo-tech-1',
      actorEmail: 'marcus.rivera@demo.aibhive.com',
      createdAt: ago(0.5),
      isDemo: true,
    },
    {
      id: 'demo-act-2',
      type: 'part_request',
      message: 'Part request: Carrier contactor HC43GE230',
      actorUid: 'demo-tech-2',
      actorEmail: 'jordan.lee@demo.aibhive.com',
      createdAt: ago(0.35),
      isDemo: true,
    },
    {
      id: 'demo-act-3',
      type: 'job_complete',
      message: 'Job completed: Sta-Rite heater — ignition failure',
      actorUid: 'demo-tech-1',
      actorEmail: 'marcus.rivera@demo.aibhive.com',
      jobId: 'demo-job-4',
      createdAt: ago(4),
      isDemo: true,
    },
    {
      id: 'demo-act-4',
      type: 'manual_ingest',
      message: 'Manual ingested: Pentair IntelliFlo VSF installation guide (14 chunks)',
      actorUid: 'demo-manager',
      actorEmail: 'hq@demo.aibhive.com',
      createdAt: ago(7),
      isDemo: true,
    },
    {
      id: 'demo-act-5',
      type: 'diagnose_feedback',
      message: 'Diagnose feedback: "That worked" on salt cell flow troubleshooting',
      actorUid: 'demo-tech-1',
      actorEmail: 'marcus.rivera@demo.aibhive.com',
      createdAt: ago(2),
      isDemo: true,
    },
    {
      id: 'demo-act-6',
      type: 'part_request_update',
      message: 'Part request ordered: Sta-Rite seal plate o-ring (PO #4821)',
      actorUid: 'demo-manager',
      actorEmail: 'hq@demo.aibhive.com',
      createdAt: ago(2),
      isDemo: true,
    },
  ];
}

/** Austin-area sample pins for Where is everybody? */
export function getDemoLocations() {
  return [
    {
      uid: 'demo-tech-1',
      displayName: 'Marcus Rivera',
      email: 'marcus.rivera@demo.aibhive.com',
      lat: 30.2672,
      lng: -97.7431,
      accuracyM: 18,
      updatedAt: ago(0.02),
      stale: false,
      onJobId: 'demo-job-1',
      isDemo: true,
    },
    {
      uid: 'demo-tech-2',
      displayName: 'Jordan Lee',
      email: 'jordan.lee@demo.aibhive.com',
      lat: 30.5083,
      lng: -97.6789,
      accuracyM: 22,
      updatedAt: ago(0.04),
      stale: false,
      onJobId: 'demo-job-2',
      isDemo: true,
    },
    {
      uid: 'demo-tech-3',
      displayName: 'Sam Chen',
      email: 'sam.chen@demo.aibhive.com',
      lat: 30.505,
      lng: -97.82,
      accuracyM: 15,
      updatedAt: ago(0.08),
      stale: false,
      onJobId: 'demo-job-5',
      isDemo: true,
    },
  ];
}

export async function getCompanyDemoContext(db, companyId) {
  const snap = await db.collection('pros_companies').doc(companyId).get();
  const data = snap.data() || {};
  return {
    settings: data.settings || {},
    tradeType: data.tradeType || 'multi',
    name: data.name || 'Your company',
  };
}

export async function getSparseCounts(db, companyId) {
  const ref = db.collection('pros_companies').doc(companyId);
  const [jobsSnap, tipsSnap, feedbackSnap, partsSnap, notifSnap] = await Promise.all([
    ref.collection('jobs').limit(20).get(),
    ref.collection('knowledge_tips').limit(20).get(),
    ref.collection('knowledge_feedback').limit(20).get(),
    ref.collection('part_requests').limit(20).get(),
    ref.collection('notifications').limit(20).get(),
  ]);
  return {
    jobs: jobsSnap.size,
    tips: tipsSnap.size,
    feedback: feedbackSnap.size,
    parts: partsSnap.size,
    notifications: notifSnap.size,
  };
}
