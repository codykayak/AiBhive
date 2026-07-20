import type { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ThumbsUp, Trash2, User as UserIcon } from 'lucide-react';
import {
  createPlantPost,
  deletePlantPost,
  fetchPlantPosts,
  togglePostUpvote,
  uploadPlantImage,
  type PlantMedicinePost,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import UserAvatar from './UserAvatar';

type Props = {
  plantId: string;
  user: User | null;
  onSignIn: () => void;
};

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <UserAvatar url={url} name={name} className="w-8 h-8 rounded-full text-xs" iconClassName="w-4 h-4" />
  );
}

export default function PlantCommunityPanel({ plantId, user, onSignIn }: Props) {
  const [comments, setComments] = useState<PlantMedicinePost[]>([]);
  const [photos, setPhotos] = useState<PlantMedicinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photoPending, setPhotoPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [c, p] = await Promise.all([
        fetchPlantPosts(plantId, user, 'comment'),
        fetchPlantPosts(plantId, user, 'photo'),
      ]);
      setComments(c);
      setPhotos(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load community');
    } finally {
      setLoading(false);
    }
  }, [plantId, user]);

  useEffect(() => {
    void load();
  }, [load]);

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
      await createPlantPost(user, plantId, { type: 'comment', text });
      setCommentText('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const onPhotoPick = async (file: File | null) => {
    if (!file || !user) {
      if (!user) onSignIn();
      return;
    }
    setPhotoPending(true);
    setError('');
    try {
      const url = await uploadPlantImage(user, file, 'photo');
      await createPlantPost(user, plantId, {
        type: 'photo',
        text: '',
        imageUrl: url,
      });
      setError('');
      alert('Photo submitted — it will appear after review.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Photo upload failed');
    } finally {
      setPhotoPending(false);
    }
  };

  const onUpvote = async (post: PlantMedicinePost) => {
    if (!user) {
      onSignIn();
      return;
    }
    try {
      const result = await togglePostUpvote(user, post.id);
      const update = (list: PlantMedicinePost[]) =>
        list.map((p) =>
          p.id === post.id
            ? { ...p, upvoteCount: result.upvoteCount, viewerHasUpvoted: result.viewerHasUpvoted }
            : p,
        );
      setComments(update);
      setPhotos(update);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upvote failed');
    }
  };

  const onDelete = async (postId: string) => {
    if (!user) return;
    try {
      await deletePlantPost(user, postId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Community</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Comments post immediately. ID photos are reviewed before they appear. Never rely on crowd photos
          alone — confirm with an expert before consuming anything.
        </p>
      </div>

      {error ? (
        <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading community…
        </div>
      ) : null}

      <div>
        <p className="text-xs font-bold text-lime-300 mb-2">Community ID photos</p>
        {photos.length === 0 && !loading ? (
          <p className="text-xs text-slate-500 mb-2">No community photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {photos.map((post) => (
              <div key={post.id} className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="Community ID" className="w-full h-28 object-cover" />
                ) : null}
                <div className="p-2 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Avatar url={post.authorAvatarUrl} name={post.authorDisplayName} />
                    <span className="text-[10px] text-slate-400 truncate">{post.authorDisplayName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onUpvote(post)}
                    className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      post.viewerHasUpvoted ? 'text-lime-300 bg-lime-500/15' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {post.upvoteCount}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {user ? (
          <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 cursor-pointer hover:text-emerald-200">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={photoPending}
              onChange={(e) => void onPhotoPick(e.target.files?.[0] ?? null)}
            />
            {photoPending ? 'Uploading…' : '+ Add ID photo (reviewed before publish)'}
          </label>
        ) : (
          <button type="button" onClick={onSignIn} className="text-xs font-bold text-emerald-400 hover:underline">
            Sign in to add a photo
          </button>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-slate-300 mb-2">Comments</p>
        <div className="space-y-3 mb-3">
          {comments.map((post) => (
            <div key={post.id} className="flex gap-2">
              <Avatar url={post.authorAvatarUrl} name={post.authorDisplayName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{post.authorDisplayName}</span>
                  {post.createdAt ? (
                    <span className="text-[10px] text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">{post.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => void onUpvote(post)}
                    className={`flex items-center gap-1 text-[10px] font-bold ${
                      post.viewerHasUpvoted ? 'text-lime-300' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {post.upvoteCount}
                  </button>
                  {user?.uid === post.authorUid ? (
                    <button
                      type="button"
                      onClick={() => void onDelete(post.id)}
                      className="text-[10px] text-slate-500 hover:text-red-300 flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && !loading ? (
            <p className="text-xs text-slate-500">No comments yet — be the first.</p>
          ) : null}
        </div>
        {user ? (
          <div className="space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share a field note or ID tip…"
              rows={2}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 text-sm text-white px-3 py-2 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="button"
              disabled={submitting || !commentText.trim()}
              onClick={() => void submitComment()}
              className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
            >
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:underline"
          >
            <UserIcon className="w-3.5 h-3.5" /> Sign in to comment
          </button>
        )}
      </div>

      <p className="text-[10px] text-amber-200/70 flex items-start gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Community content is not verified by experts. Always confirm plant ID before harvest or consumption.
      </p>
    </div>
  );
}
