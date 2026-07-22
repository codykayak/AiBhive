import { SEED_COMMUNITY_POSTS, type SeedCommunityPost } from './communitySeedData';

const STORAGE_KEY = 'opm_community_seed_votes';

export type SeedVoteState = { count: number; voted: boolean };

export type UpvoteResult = { upvoteCount: number; viewerHasUpvoted: boolean };

function toUpvoteResult(vote: SeedVoteState): UpvoteResult {
  return { upvoteCount: vote.count, viewerHasUpvoted: vote.voted };
}

function readAll(): Record<string, SeedVoteState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, SeedVoteState>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(state: Record<string, SeedVoteState>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function defaultSeedVotes(): Record<string, SeedVoteState> {
  return Object.fromEntries(SEED_COMMUNITY_POSTS.map((p) => [p.id, { count: p.upvoteCount, voted: false }]));
}

export function loadSeedVotes(): Record<string, SeedVoteState> {
  const base = defaultSeedVotes();
  const saved = readAll();
  const out = { ...base };
  for (const [id, vote] of Object.entries(saved)) {
    if (!out[id] || !vote) continue;
    out[id] = {
      count: typeof vote.count === 'number' ? vote.count : out[id].count,
      voted: !!vote.voted,
    };
  }
  return out;
}

export function toggleSeedVote(postId: string): UpvoteResult {
  const post = SEED_COMMUNITY_POSTS.find((p) => p.id === postId);
  if (!post) return { upvoteCount: 0, viewerHasUpvoted: false };
  const all = loadSeedVotes();
  const cur = all[postId] ?? { count: post.upvoteCount, voted: false };
  const next = cur.voted
    ? { count: Math.max(post.upvoteCount, cur.count - 1), voted: false }
    : { count: cur.count + 1, voted: true };
  all[postId] = next;
  writeAll(all);
  return toUpvoteResult(next);
}

export function applySeedVotes<T extends SeedCommunityPost>(posts: T[], votes: Record<string, SeedVoteState>): T[] {
  return posts.map((p) => {
    const vote = votes[p.id];
    if (!vote) return p;
    return { ...p, upvoteCount: vote.count, viewerHasUpvoted: vote.voted };
  });
}

export function sortFeedByUpvotes<T extends { upvoteCount: number; createdAt?: string | null }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}
