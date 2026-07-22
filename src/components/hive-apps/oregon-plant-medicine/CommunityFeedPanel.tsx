import type { User } from 'firebase/auth';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, PenSquare, Sprout, ThumbsUp, Users } from 'lucide-react';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import {
  fetchCommunityFeed,
  postImageUrls,
  togglePostUpvote,
  type PlantMedicinePost,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { PlantCategoryBadges } from '../../../lib/oregonPlantMedicine/plantBadges';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import {
  mergeCommunityFeed,
  SEED_COMMUNITY_POSTS,
  SEED_COMMUNITY_VOTER_COUNT,
  type SeedCommunityPost,
} from '../../../lib/oregonPlantMedicine/communitySeedData';
import { loadSeedVotes, sortFeedByUpvotes, toggleSeedVote } from '../../../lib/oregonPlantMedicine/communitySeedVotes';
import CreateCommunityPostModal from './CreateCommunityPostModal';
import PlantPhoto from './PlantImage';
import UserAvatar from './UserAvatar';

type FeedPost = PlantMedicinePost | SeedCommunityPost;

type Props = {
  user: User | null;
  onSignIn: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onOpenPost: (post: FeedPost) => void;
  reloadToken?: number;
  seedVotesVersion?: number;
  onSeedUpvoteChange?: () => void;
};

function isSeed(post: FeedPost): post is SeedCommunityPost {
  return 'isSeed' in post && post.isSeed === true;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function plantForPost(post: FeedPost): PlantEntry | undefined {
  if (!post.plantId) return undefined;
  return PLANT_LIBRARY.find((p) => p.id === post.plantId);
}

function feedTitle(post: FeedPost): string | null {
  if ('title' in post && post.title) return post.title;
  return null;
}

function FeedCard({
  post,
  user,
  onSignIn,
  onOpenPlant,
  onOpenPost,
  onUpvote,
}: {
  post: FeedPost;
  user: User | null;
  onSignIn: () => void;
  onOpenPlant: (plant: PlantEntry) => void;
  onOpenPost: (post: FeedPost) => void;
  onUpvote: (id: string) => void;
}) {
  const plant = plantForPost(post);
  const seed = isSeed(post);
  const location = seed ? post.locationLabel : null;
  const plantLabel = seed ? post.plantCommonName : plant?.commonName;
  const title = feedTitle(post);
  const images = seed
    ? post.imageUrl
      ? [post.imageUrl]
      : []
    : postImageUrls(post as PlantMedicinePost);

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <UserAvatar
          url={post.authorAvatarUrl}
          name={post.authorDisplayName}
          className="w-10 h-10 rounded-full shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-bold text-white text-sm">{post.authorDisplayName}</p>
            {location ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            ) : null}
            <span className="text-[10px] text-slate-500">{timeAgo(post.createdAt)}</span>
          </div>
          {title ? <h3 className="font-black text-white mt-2 leading-snug">{title}</h3> : null}
          {plant ? <PlantCategoryBadges plant={plant} className="mt-2" /> : null}
          {post.text ? (
            <p className="text-sm text-slate-300 mt-2 leading-relaxed line-clamp-3">{post.text}</p>
          ) : null}
          {plant && plantLabel ? (
            <button
              type="button"
              onClick={() => onOpenPlant(plant)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              <Sprout className="w-3.5 h-3.5" />
              {plantLabel}
            </button>
          ) : null}
        </div>
      </div>

      {images.length > 0 ? (
        <button type="button" onClick={() => onOpenPost(post)} className="block w-full text-left">
          {images.length === 1 ? (
            <PlantPhoto
              src={images[0]!}
              plantId={post.plantId ?? undefined}
              scientificName={plant?.scientificName ?? plantLabel ?? 'Wild plant'}
              alt={plantLabel ?? 'Community foraging photo'}
              className="w-full max-h-72 object-cover"
            />
          ) : (
            <div className="grid gap-0.5 grid-cols-2">
              {images.slice(0, 4).map((src, i) => (
                <PlantPhoto
                  key={`${src}_${i}`}
                  src={src}
                  plantId={post.plantId ?? undefined}
                  scientificName={plant?.scientificName ?? plantLabel ?? 'Wild plant'}
                  alt={plantLabel ?? 'Community foraging photo'}
                  className={`w-full object-cover ${images.length === 2 ? 'max-h-56' : 'h-36'}`}
                />
              ))}
            </div>
          )}
        </button>
      ) : null}

      <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (!isSeed(post) && !user) {
              onSignIn();
              return;
            }
            onUpvote(post.id);
          }}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
            post.viewerHasUpvoted
              ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
              : 'border-slate-700 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${post.viewerHasUpvoted ? 'fill-emerald-400' : ''}`} />
          {post.upvoteCount}
        </button>
        {seed ? <span className="text-[10px] text-slate-500">Community highlight</span> : null}
      </div>
    </article>
  );
}

export default function CommunityFeedPanel({
  user,
  onSignIn,
  onOpenPlant,
  onOpenPost,
  reloadToken = 0,
  seedVotesVersion = 0,
  onSeedUpvoteChange,
}: Props) {
  const [livePosts, setLivePosts] = useState<PlantMedicinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [seedVotes, setSeedVotes] = useState(() => loadSeedVotes());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const posts = await fetchCommunityFeed(user);
      setLivePosts(posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load community feed');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, reloadToken]);

  useEffect(() => {
    setSeedVotes(loadSeedVotes());
  }, [seedVotesVersion]);

  const posts = useMemo(() => {
    const merged = mergeCommunityFeed(livePosts);
    const withVotes = merged.map((post) => {
      if (!isSeed(post)) return post;
      const vote = seedVotes[post.id];
      if (!vote) return post;
      return { ...post, upvoteCount: vote.count, viewerHasUpvoted: vote.voted };
    });
    return sortFeedByUpvotes(withVotes);
  }, [livePosts, seedVotes]);

  const onUpvote = (id: string) => {
    if (id.startsWith('seed-')) {
      toggleSeedVote(id);
      setSeedVotes(loadSeedVotes());
      onSeedUpvoteChange?.();
      return;
    }
    if (!user) {
      onSignIn();
      return;
    }
    void togglePostUpvote(user, id).then((result) => {
      setLivePosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, upvoteCount: result.upvoteCount, viewerHasUpvoted: result.viewerHasUpvoted }
            : p,
        ),
      );
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-100/90 leading-relaxed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-sky-300 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Community feed
          </p>
          <p>
            Share foraging photos and field notes — sorted by upvotes.{' '}
            <strong className="text-white">{SEED_COMMUNITY_VOTER_COUNT} early members</strong> are already sharing
            local picks and ID tips.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              onSignIn();
              return;
            }
            setShowCreate(true);
          }}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 text-sm"
        >
          <PenSquare className="w-4 h-4" />
          New post
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading community…
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <FeedCard
            key={post.id}
            post={post}
            user={user}
            onSignIn={onSignIn}
            onOpenPlant={onOpenPlant}
            onOpenPost={onOpenPost}
            onUpvote={onUpvote}
          />
        ))}
      </div>

      {showCreate ? (
        <CreateCommunityPostModal
          user={user}
          onClose={() => setShowCreate(false)}
          onSignIn={onSignIn}
          onCreated={() => void load()}
        />
      ) : null}
    </div>
  );
}
