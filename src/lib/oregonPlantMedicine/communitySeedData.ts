import type { PlantMedicinePost } from './plantMedicineApi';

export type SeedCommunityPost = PlantMedicinePost & {
  isSeed: true;
  plantCommonName: string;
  locationLabel: string;
};

function avatar(seed: string) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Demo community posts — merged with live Firestore feed on the Community tab. */
export const SEED_COMMUNITY_POSTS: SeedCommunityPost[] = [
  {
    id: 'seed-maya-chanterelle',
    isSeed: true,
    plantId: 'chanterelle',
    plantCommonName: 'Golden chanterelle',
    locationLabel: 'Eugene, OR',
    library: null,
    topicId: null,
    authorUid: 'seed-user-maya',
    authorDisplayName: 'Maya K.',
    authorAvatarUrl: avatar('MayaK'),
    type: 'photo',
    text: 'Wow — the local habitat notes here nailed it. Found a whole flush near Spencer Butte after the rain. Here’s what I picked (left plenty behind).',
    imageUrl: '/oregon-plant-medicine/chanterelle.jpg',
    status: 'approved',
    upvoteCount: 47,
    createdAt: daysAgo(1),
    viewerHasUpvoted: false,
  },
  {
    id: 'seed-jordan-nettle',
    isSeed: true,
    plantId: 'stinging-nettle',
    plantCommonName: 'Stinging nettle',
    locationLabel: 'Willamette Valley',
    library: null,
    topicId: null,
    authorUid: 'seed-user-jordan',
    authorDisplayName: 'Jordan P.',
    authorAvatarUrl: avatar('JordanP'),
    type: 'photo',
    text: 'Super local plant info — the look-alike section saved me. Spring nettle pesto night!',
    imageUrl: '/oregon-plant-medicine/stinging-nettle.jpg',
    status: 'approved',
    upvoteCount: 42,
    createdAt: daysAgo(2),
    viewerHasUpvoted: false,
  },
  {
    id: 'seed-riley-morel',
    isSeed: true,
    plantId: 'morel',
    plantCommonName: 'Morel',
    locationLabel: 'Oak savanna, Lane Co.',
    library: null,
    topicId: null,
    authorUid: 'seed-user-riley',
    authorDisplayName: 'Riley T.',
    authorAvatarUrl: avatar('RileyT'),
    type: 'photo',
    text: 'First morels of the season! This library’s burn-site tips were spot on for the foothills.',
    imageUrl: '/oregon-plant-medicine/morel.jpg',
    status: 'approved',
    upvoteCount: 38,
    createdAt: daysAgo(2),
    viewerHasUpvoted: false,
  },
  {
    id: 'seed-sam-salmonberry',
    isSeed: true,
    plantId: 'salmonberry',
    plantCommonName: 'Salmonberry',
    locationLabel: 'Florence coast',
    library: null,
    topicId: null,
    authorUid: 'seed-user-sam',
    authorDisplayName: 'Sam O.',
    authorAvatarUrl: avatar('SamO'),
    type: 'photo',
    text: 'Riparian patch off the Siuslaw — berries just turning. Photo for the community ID wall.',
    imageUrl: '/oregon-plant-medicine/salmonberry.jpg',
    status: 'approved',
    upvoteCount: 35,
    createdAt: daysAgo(3),
    viewerHasUpvoted: false,
  },
  {
    id: 'seed-alex-grape',
    isSeed: true,
    plantId: 'oregon-grape',
    plantCommonName: 'Oregon grape',
    locationLabel: 'Eugene foothills',
    library: null,
    topicId: null,
    authorUid: 'seed-user-alex',
    authorDisplayName: 'Alex Chen',
    authorAvatarUrl: avatar('AlexChen'),
    type: 'comment',
    text: 'Used the prep notes to make Oregon grape jelly — tart but incredible on toast. Grateful this is so Oregon-specific.',
    imageUrl: '/oregon-plant-medicine/oregon-grape.jpg',
    status: 'approved',
    upvoteCount: 31,
    createdAt: daysAgo(4),
    viewerHasUpvoted: false,
  },
  {
    id: 'seed-jamie-turkey',
    isSeed: true,
    plantId: 'turkey-tail',
    plantCommonName: 'Turkey tail',
    locationLabel: 'Coast range',
    library: null,
    topicId: null,
    authorUid: 'seed-user-jamie',
    authorDisplayName: 'Jamie R.',
    authorAvatarUrl: avatar('JamieR'),
    type: 'photo',
    text: 'Medicinal mushroom ID check — three photos in the entry made this an easy confirm on Douglas fir logs.',
    imageUrl: '/oregon-plant-medicine/turkey-tail.jpg',
    status: 'approved',
    upvoteCount: 28,
    createdAt: daysAgo(5),
    viewerHasUpvoted: false,
  },
  {
    id: 'seed-morgan-huck',
    isSeed: true,
    plantId: 'huckleberry',
    plantCommonName: 'Evergreen huckleberry',
    locationLabel: 'Northern California coast',
    library: null,
    topicId: null,
    authorUid: 'seed-user-morgan',
    authorDisplayName: 'Morgan L.',
    authorAvatarUrl: avatar('MorganL'),
    type: 'photo',
    text: 'Finally told apart evergreen vs. red huckleberry using the side-by-side photos here. Snack break on the trail!',
    imageUrl: '/oregon-plant-medicine/huckleberry.jpg',
    status: 'approved',
    upvoteCount: 24,
    createdAt: daysAgo(6),
    viewerHasUpvoted: false,
  },
  {
    id: 'seed-casey-dandelion',
    isSeed: true,
    plantId: 'dandelion',
    plantCommonName: 'Dandelion',
    locationLabel: 'Portland metro',
    library: null,
    topicId: null,
    authorUid: 'seed-user-casey',
    authorDisplayName: 'Casey W.',
    authorAvatarUrl: avatar('CaseyW'),
    type: 'comment',
    text: 'Urban foraging win — dandelion greens from the backyard. The library reminded me to avoid sprayed lawns.',
    imageUrl: '/oregon-plant-medicine/dandelion.jpg',
    status: 'approved',
    upvoteCount: 19,
    createdAt: daysAgo(7),
    viewerHasUpvoted: false,
  },
  {
    id: 'seed-taylor-elder',
    isSeed: true,
    plantId: 'elderberry',
    plantCommonName: 'Blue elderberry',
    locationLabel: 'McKenzie River',
    library: null,
    topicId: null,
    authorUid: 'seed-user-taylor',
    authorDisplayName: 'Taylor N.',
    authorAvatarUrl: avatar('TaylorN'),
    type: 'photo',
    text: 'Elderflower season! Shared this cluster with the community — always cook berries, never raw.',
    imageUrl: '/oregon-plant-medicine/elderberry.jpg',
    status: 'approved',
    upvoteCount: 15,
    createdAt: daysAgo(8),
    viewerHasUpvoted: false,
  },
];

export const SEED_COMMUNITY_VOTER_COUNT = 10;

export function mergeCommunityFeed(
  livePosts: PlantMedicinePost[],
  seedPosts: SeedCommunityPost[] = SEED_COMMUNITY_POSTS,
): Array<PlantMedicinePost | SeedCommunityPost> {
  const liveIds = new Set(livePosts.map((p) => p.id));
  const merged: Array<PlantMedicinePost | SeedCommunityPost> = [
    ...livePosts,
    ...seedPosts.filter((p) => !liveIds.has(p.id)),
  ];
  merged.sort((a, b) => {
    if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
  return merged;
}
