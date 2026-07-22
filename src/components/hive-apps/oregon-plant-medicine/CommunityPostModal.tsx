import { AlertTriangle, MapPin, Sprout, ThumbsUp, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import type { PlantMedicinePost } from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import { PlantCategoryBadges } from '../../../lib/oregonPlantMedicine/plantBadges';
import type { SeedCommunityPost } from '../../../lib/oregonPlantMedicine/communitySeedData';
import { toggleSeedVote } from '../../../lib/oregonPlantMedicine/communitySeedVotes';
import type { PlantEntry } from '../../../lib/oregonPlantMedicine/types';
import type { AskAiContext } from './AskAiBhivePanel';
import PostEngagementBar from './PostEngagementBar';
import PlantPhoto from './PlantImage';
import UserAvatar from './UserAvatar';

export type CommunityPostView = PlantMedicinePost | SeedCommunityPost;

type Props = {
  post: CommunityPostView;
  user: User | null;
  onSignIn: () => void;
  onAskAi?: (ctx: AskAiContext) => void;
  onClose: () => void;
  onOpenPlant?: (plant: PlantEntry) => void;
  onUpvoteChange?: (
    postId: string,
    result: { upvoteCount: number; viewerHasUpvoted: boolean },
    isSeed: boolean,
  ) => void;
};

function UpvoteButton({
  count,
  voted,
  onClick,
}: {
  count: number;
  voted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
        voted
          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
          : 'border-slate-700 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300'
      }`}
    >
      <ThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-emerald-400' : ''}`} />
      {count}
    </button>
  );
}

function isSeed(post: CommunityPostView): post is SeedCommunityPost {
  return 'isSeed' in post && post.isSeed === true;
}

function postTitle(post: CommunityPostView): string | null {
  if ('title' in post && post.title) return post.title;
  return null;
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

export default function CommunityPostModal({
  post,
  user,
  onSignIn,
  onAskAi,
  onClose,
  onOpenPlant,
  onUpvoteChange,
}: Props) {
  const seed = isSeed(post);
  const plant = post.plantId ? PLANT_LIBRARY.find((p) => p.id === post.plantId) : undefined;
  const plantLabel = seed ? post.plantCommonName : plant?.commonName;
  const location = seed ? post.locationLabel : null;
  const title = postTitle(post);
  const focusTitle = title ?? plantLabel ?? 'Community post';
  const livePost = seed ? null : (post as PlantMedicinePost);
  const videoUrl = livePost?.videoUrl;
  const aiTags = livePost?.aiTags;
  const isToxicPost = aiTags?.some((t) => /toxic|poison|deadly|danger/i.test(t));

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-sky-500/25 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
          <p className="text-xs font-black uppercase tracking-widest text-sky-300">Community post</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex items-start gap-3">
          <UserAvatar
            url={post.authorAvatarUrl}
            name={post.authorDisplayName}
            className="w-11 h-11 rounded-full shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="font-bold text-white">{post.authorDisplayName}</p>
              {location ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <MapPin className="w-3 h-3" />
                  {location}
                </span>
              ) : null}
              <span className="text-[10px] text-slate-500">{timeAgo(post.createdAt)}</span>
            </div>
            {title ? <h3 className="text-lg font-black text-white mt-2 leading-snug">{title}</h3> : null}
            {plant && plantLabel ? <PlantCategoryBadges plant={plant} className="mt-2" /> : null}
            {plantLabel && !title ? (
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400/90 mt-2">{plantLabel}</p>
            ) : null}
          </div>
        </div>

        {videoUrl ? (
          <video src={videoUrl} controls className="w-full max-h-[min(52vh,420px)] bg-black" />
        ) : null}

        {post.imageUrl ? (
          <PlantPhoto
            src={post.imageUrl}
            plantId={post.plantId ?? undefined}
            scientificName={plant?.scientificName ?? plantLabel ?? 'Wild plant'}
            alt={title ?? plantLabel ?? 'Community foraging photo'}
            className="w-full max-h-[min(52vh,420px)] object-cover"
          />
        ) : null}

        <div className="p-4 space-y-4">
          {post.text ? (
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.text}</p>
          ) : null}

          {aiTags && aiTags.length > 0 ? (
            <div
              className={`rounded-xl border p-3 ${
                isToxicPost ? 'border-rose-500/40 bg-rose-950/40' : 'border-sky-500/30 bg-sky-500/10'
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-300 mb-2">
                Bhive identification tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {aiTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[10px] font-bold text-sky-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {plant?.lookalikes && plant.lookalikes.length > 0 ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-amber-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Toxic look-alikes
              </p>
              <ul className="space-y-2 text-sm text-amber-100/90 list-disc list-inside leading-relaxed">
                {plant.lookalikes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {seed ? (
            <div className="space-y-3">
              <UpvoteButton
                count={post.upvoteCount}
                voted={!!post.viewerHasUpvoted}
                onClick={() => {
                  const result = toggleSeedVote(post.id);
                  onUpvoteChange?.(post.id, result, true);
                }}
              />
              <p className="text-[10px] text-slate-500">
                Community highlight — upvotes help surface the best field notes. Sign in to publish your own posts.
              </p>
            </div>
          ) : (
            <PostEngagementBar
              target={{
                kind: 'post',
                postId: post.id,
                upvoteCount: post.upvoteCount,
                viewerHasUpvoted: post.viewerHasUpvoted,
              }}
              user={user}
              onSignIn={onSignIn}
              onUpvoteChange={(result) => onUpvoteChange?.(post.id, result, false)}
              onAskAi={
                onAskAi
                  ? () =>
                      onAskAi({
                        focusTitle,
                        contextText: [focusTitle, post.text ?? '', plantLabel ?? ''].filter(Boolean).join('\n'),
                        plantId: post.plantId ?? undefined,
                      })
                  : undefined
              }
            />
          )}

          {plant && plantLabel && onOpenPlant ? (
            <button
              type="button"
              onClick={() => {
                onOpenPlant(plant);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              <Sprout className="w-3.5 h-3.5" />
              View {plantLabel} in library
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
