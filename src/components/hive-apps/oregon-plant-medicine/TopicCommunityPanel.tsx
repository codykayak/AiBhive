import type { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ThumbsUp, Trash2, User as UserIcon } from 'lucide-react';
import { PLANT_IMAGE_MAX_COUNT } from '../../../lib/oregonPlantMedicine/compressPlantImage';
import {
  createTopicPost,
  deletePlantPost,
  fetchTopicPosts,
  postImageUrls,
  togglePostUpvote,
  uploadPlantImages,
  type PlantMedicinePost,
  type TopicLibraryId,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import UserAvatar from './UserAvatar';

type Props = {
  library: TopicLibraryId;
  topicId: string;
  user: User | null;
  onSignIn: () => void;
  accentClass?: string;
};

function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <UserAvatar url={url} name={name} className="w-8 h-8 rounded-full text-xs" iconClassName="w-4 h-4" />
  );
}

export default function TopicCommunityPanel({
  library,
  topicId,
  user,
  onSignIn,
  accentClass = 'text-cyan-300',
}: Props) {
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
        fetchTopicPosts(library, topicId, user, 'comment'),
        fetchTopicPosts(library, topicId, user, 'photo'),
      ]);
      setComments(c);
      setPhotos(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load community');
    } finally {
      setLoading(false);
    }
  }, [library, topicId, user]);

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
      await createTopicPost(user, library, topicId, { type: 'comment', text });
      setCommentText('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const onPhotoPick = async (files: FileList | null) => {
    if (!files?.length || !user) {
      if (!user) onSignIn();
      return;
    }
    const batch = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, PLANT_IMAGE_MAX_COUNT);
    if (!batch.length) {
      setError('Please choose image files (JPEG, PNG, or HEIC).');
      return;
    }
    setPhotoPending(true);
    setError('');
    try {
      const imageUrls = await uploadPlantImages(user, batch, 'photo');
      await createTopicPost(user, library, topicId, {
        type: 'photo',
        text: '',
        imageUrls,
        imageUrl: imageUrls[0],
      });
      alert(
        batch.length > 1
          ? `${batch.length} photos submitted — they will appear after review.`
          : 'Photo submitted — it will appear after review.',
      );
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
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Community research</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Share experiences, practitioner notes, and reference photos. Comments post immediately; images are
          reviewed. Upvote helpful contributions — highest-voted rise to the top.
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
        <p className={`text-xs font-bold ${accentClass} mb-2`}>Community photos &amp; diagrams</p>
        {photos.length === 0 && !loading ? (
          <p className="text-xs text-slate-500 mb-2">No community images yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {photos.map((post) => {
              const imgs = postImageUrls(post);
              return (
                <div key={post.id} className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                  {imgs.length > 0 ? (
                    <div className={`grid gap-0.5 bg-black/40 ${imgs.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {imgs.slice(0, 4).map((src) => (
                        <img
                          key={src}
                          src={src}
                          alt="Community contribution"
                          className="w-full h-28 object-cover"
                        />
                      ))}
                    </div>
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
                      post.viewerHasUpvoted ? `${accentClass} bg-white/10` : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {post.upvoteCount}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
        {user ? (
          <label className={`inline-flex items-center gap-2 text-xs font-bold ${accentClass} cursor-pointer hover:opacity-90`}>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={photoPending}
              onChange={(e) => void onPhotoPick(e.target.files)}
            />
            {photoPending
              ? 'Uploading…'
              : `+ Add reference photos (up to ${PLANT_IMAGE_MAX_COUNT}, reviewed before publish)`}
          </label>
        ) : (
          <button type="button" onClick={onSignIn} className={`text-xs font-bold ${accentClass} hover:underline`}>
            Sign in to add a photo
          </button>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-slate-300 mb-2">Comments &amp; field notes</p>
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
                <p className="text-sm text-slate-300 mt-0.5 leading-relaxed whitespace-pre-wrap">{post.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => void onUpvote(post)}
                    className={`flex items-center gap-1 text-[10px] font-bold ${
                      post.viewerHasUpvoted ? accentClass : 'text-slate-500 hover:text-white'
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
            <p className="text-xs text-slate-500">No comments yet — share what you have learned.</p>
          ) : null}
        </div>
        {user ? (
          <div className="space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share practitioner notes, book references, or personal experience…"
              rows={3}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 text-sm text-white px-3 py-2 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              type="button"
              disabled={submitting || !commentText.trim()}
              onClick={() => void submitComment()}
              className="text-xs font-bold px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white"
            >
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className={`flex items-center gap-2 text-xs font-bold ${accentClass} hover:underline`}
          >
            <UserIcon className="w-3.5 h-3.5" /> Sign in to comment or upvote
          </button>
        )}
      </div>

      <p className="text-[10px] text-amber-200/70 flex items-start gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Community content is not verified by licensed professionals. Use for research and discussion only.
      </p>
    </div>
  );
}
