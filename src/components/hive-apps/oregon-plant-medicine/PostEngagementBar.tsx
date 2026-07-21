import type { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageCircle, Sparkles, ThumbsUp } from 'lucide-react';
import {
  createEssayPost,
  createPlantPost,
  createThreadComment,
  createTopicPost,
  fetchContentEngagement,
  fetchEssayPosts,
  fetchPlantPosts,
  fetchThreadComments,
  fetchTopicPosts,
  toggleContentUpvote,
  togglePostUpvote,
  type ContentEngagementKind,
  type PlantMedicinePost,
  type TopicLibraryId,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import UserAvatar from './UserAvatar';

export type EngagementTarget =
  | { kind: 'post'; postId: string; upvoteCount?: number; viewerHasUpvoted?: boolean }
  | { kind: 'plant'; plantId: string }
  | { kind: 'topic'; library: TopicLibraryId; topicId: string }
  | { kind: 'essay'; essayId: string };

type Props = {
  target: EngagementTarget;
  user: User | null;
  onSignIn: () => void;
  onAskAi?: () => void;
  className?: string;
  stopPropagation?: boolean;
};

export default function PostEngagementBar({
  target,
  user,
  onSignIn,
  onAskAi,
  className = '',
  stopPropagation = false,
}: Props) {
  const [upvotes, setUpvotes] = useState(0);
  const [voted, setVoted] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PlantMedicinePost[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const contentKind: ContentEngagementKind | null =
    target.kind === 'plant'
      ? 'plant'
      : target.kind === 'essay'
        ? 'essay'
        : target.kind === 'topic'
          ? target.library
          : null;

  const contentId =
    target.kind === 'plant'
      ? target.plantId
      : target.kind === 'essay'
        ? target.essayId
        : target.kind === 'topic'
          ? target.topicId
          : null;

  const loadEngagement = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (target.kind === 'post') {
        const thread = await fetchThreadComments(target.postId, user);
        setComments(thread);
        setCommentCount(thread.length);
        setUpvotes(target.upvoteCount ?? 0);
        setVoted(target.viewerHasUpvoted ?? false);
      } else if (contentKind && contentId) {
        const e = await fetchContentEngagement(contentKind, contentId, user);
        setUpvotes(e.upvoteCount);
        setVoted(e.viewerHasUpvoted);
        setCommentCount(e.commentCount);
        if (target.kind === 'plant') {
          setComments(await fetchPlantPosts(target.plantId, user, 'comment'));
        } else if (target.kind === 'essay') {
          setComments(await fetchEssayPosts(target.essayId, user, 'comment'));
        } else if (target.kind === 'topic') {
          setComments(await fetchTopicPosts(target.library, target.topicId, user, 'comment'));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load engagement');
    } finally {
      setLoading(false);
    }
  }, [target, user, contentKind, contentId]);

  useEffect(() => {
    void loadEngagement();
  }, [loadEngagement]);

  const onUpvote = async () => {
    if (stopPropagation) {
      // noop — handled on button
    }
    if (!user) {
      onSignIn();
      return;
    }
    try {
      if (target.kind === 'post') {
        const result = await togglePostUpvote(user, target.postId);
        setUpvotes(result.upvoteCount);
        setVoted(result.viewerHasUpvoted);
      } else if (contentKind && contentId) {
        const result = await toggleContentUpvote(user, contentKind, contentId);
        setUpvotes(result.upvoteCount);
        setVoted(result.viewerHasUpvoted);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upvote failed');
    }
  };

  const submitComment = async () => {
    if (!user) {
      onSignIn();
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    setSubmitting(true);
    setError('');
    try {
      if (target.kind === 'post') {
        await createThreadComment(user, target.postId, text);
      } else if (target.kind === 'plant') {
        await createPlantPost(user, target.plantId, { type: 'comment', text });
      } else if (target.kind === 'essay') {
        await createEssayPost(user, target.essayId, { type: 'comment', text });
      } else if (target.kind === 'topic') {
        await createTopicPost(user, target.library, target.topicId, { type: 'comment', text });
      }
      setCommentText('');
      await loadEngagement();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Comment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const wrapClick = (e: React.MouseEvent, fn: () => void) => {
    if (stopPropagation) e.stopPropagation();
    fn();
  };

  return (
    <div className={`space-y-2 ${className}`} onClick={(e) => stopPropagation && e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(e) => wrapClick(e, () => void onUpvote())}
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
            voted
              ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
              : 'border-slate-700 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300'
          }`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${voted ? 'fill-emerald-400' : ''}`} />
          {loading ? '…' : upvotes}
        </button>
        <button
          type="button"
          onClick={(e) => wrapClick(e, () => setShowComments((v) => !v))}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-sky-500/40 hover:text-sky-300"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {commentCount}
        </button>
        {onAskAi ? (
          <button
            type="button"
            onClick={(e) => wrapClick(e, onAskAi)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-violet-500/35 text-violet-300 hover:bg-violet-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AiBhive
          </button>
        ) : null}
      </div>

      {showComments ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-3">
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500">No comments yet — start the conversation.</p>
          ) : (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2 text-xs">
                  <UserAvatar url={c.authorAvatarUrl} name={c.authorDisplayName} className="w-6 h-6 rounded-full" />
                  <div>
                    <p className="font-bold text-slate-300">{c.authorDisplayName}</p>
                    <p className="text-slate-400 mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
            />
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitComment()}
              className="shrink-0 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold px-3 py-2 text-xs"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="text-[10px] text-red-300">{error}</p> : null}
    </div>
  );
}
