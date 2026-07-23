import type { User } from 'firebase/auth';
import { useMemo, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, Video, X } from 'lucide-react';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import { HIVE_RESEARCH_LABEL, HIVE_RESEARCH_POWERED_BY } from '../../../lib/oregonPlantMedicine/branding';
import { formatPlantImageSize, PLANT_IMAGE_MAX_COUNT } from '../../../lib/oregonPlantMedicine/compressPlantImage';
import { videoFrameForEnrichment } from '../../../lib/oregonPlantMedicine/plantMediaUpload';
import {
  createFeedPost,
  enrichCommunityPost,
  filesToVisionAttachments,
  uploadPlantImages,
  uploadPlantVideo,
  type CommunityPostEnrichment,
  type VisionAttachment,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';

export type CommunityPostPrefill = {
  title?: string;
  text?: string;
  plantId?: string;
  feedCategory?: 'plants' | 'edibles';
  photoFile?: File;
  runBhiveResearch?: boolean;
};

type Props = {
  user: User | null;
  onClose: () => void;
  onSignIn: () => void;
  onCreated: () => void;
  prefill?: CommunityPostPrefill;
};

type PendingPhoto = { file: File; previewUrl: string };
type PendingVideo = { file: File; previewUrl: string };

export default function CreateCommunityPostModal({
  user,
  onClose,
  onSignIn,
  onCreated,
  prefill,
}: Props) {
  const [title, setTitle] = useState(prefill?.title ?? '');
  const [text, setText] = useState(prefill?.text ?? '');
  const [plantId, setPlantId] = useState(prefill?.plantId ?? '');
  const [plantQuery, setPlantQuery] = useState(() => {
    if (!prefill?.plantId) return '';
    return PLANT_LIBRARY.find((p) => p.id === prefill.plantId)?.commonName ?? '';
  });
  const [feedCategory, setFeedCategory] = useState<'plants' | 'edibles' | ''>(prefill?.feedCategory ?? '');
  const [photos, setPhotos] = useState<PendingPhoto[]>(() => {
    if (!prefill?.photoFile) return [];
    return [{ file: prefill.photoFile, previewUrl: URL.createObjectURL(prefill.photoFile) }];
  });
  const [video, setVideo] = useState<PendingVideo | null>(null);
  const [runBhiveResearch, setRunBhiveResearch] = useState(!!prefill?.runBhiveResearch);
  const [enrichmentPreview, setEnrichmentPreview] = useState<CommunityPostEnrichment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState('');

  const plantMatches = useMemo(() => {
    const q = plantQuery.trim().toLowerCase();
    if (!q) return PLANT_LIBRARY.slice(0, 8);
    return PLANT_LIBRARY.filter((p) =>
      [p.commonName, p.scientificName, ...(p.alsoKnownAs ?? [])].join(' ').toLowerCase().includes(q),
    ).slice(0, 8);
  }, [plantQuery]);

  const addPhotoFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const remaining = PLANT_IMAGE_MAX_COUNT - photos.length;
    if (remaining <= 0) {
      setError(`You can attach up to ${PLANT_IMAGE_MAX_COUNT} photos per post.`);
      return;
    }
    const next: PendingPhoto[] = [];
    for (const file of Array.from(list).slice(0, remaining)) {
      if (!file.type.startsWith('image/')) continue;
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    if (!next.length) {
      setError('Please choose image files (JPEG, PNG, or HEIC).');
      return;
    }
    setError('');
    setEnrichmentPreview(null);
    setPhotos((prev) => [...prev, ...next]);
  };

  const addVideoFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please choose an MP4 or WebM video.');
      return;
    }
    if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
    setVideo({ file, previewUrl: URL.createObjectURL(file) });
    setError('');
    setEnrichmentPreview(null);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
    setEnrichmentPreview(null);
  };

  const removeVideo = () => {
    if (video?.previewUrl) URL.revokeObjectURL(video.previewUrl);
    setVideo(null);
    setEnrichmentPreview(null);
  };

  const buildVisionAttachments = async (): Promise<VisionAttachment[]> => {
    if (photos.length > 0) {
      return filesToVisionAttachments(photos.map((p) => p.file));
    }
    if (video) {
      const frame = await videoFrameForEnrichment(video.file);
      if (frame) return [frame];
    }
    return [];
  };

  const runResearch = async (): Promise<CommunityPostEnrichment | null> => {
    if (!user) {
      onSignIn();
      return null;
    }
    setEnriching(true);
    setError('');
    try {
      const visionAttachments = await buildVisionAttachments();
      const result = await enrichCommunityPost(user, {
        title: title.trim(),
        text: text.trim(),
        plantId: plantId || undefined,
        feedCategory: feedCategory || undefined,
        attachment: visionAttachments.length === 1 ? visionAttachments[0] : undefined,
        attachments: visionAttachments.length > 1 ? visionAttachments : undefined,
      });
      setEnrichmentPreview(result);
      if (result.suggestedTitle && !title.trim()) setTitle(result.suggestedTitle);
      if (result.suggestedPlantId && !plantId) {
        setPlantId(result.suggestedPlantId);
        const plant = PLANT_LIBRARY.find((p) => p.id === result.suggestedPlantId);
        if (plant) setPlantQuery(plant.commonName);
      }
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : `${HIVE_RESEARCH_LABEL} failed`);
      return null;
    } finally {
      setEnriching(false);
    }
  };

  const submit = async () => {
    if (!user) {
      onSignIn();
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Add a title for your post.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      let enrichment = enrichmentPreview;
      if (runBhiveResearch && !enrichment) {
        enrichment = await runResearch();
        if (runBhiveResearch && !enrichment) {
          setSubmitting(false);
          return;
        }
      }

      let imageUrls: string[] | undefined;
      if (photos.length > 0) {
        imageUrls = await uploadPlantImages(
          user,
          photos.map((p) => p.file),
          'photo',
        );
      }

      let videoUrl: string | undefined;
      if (video) {
        videoUrl = await uploadPlantVideo(user, video.file);
      }

      let finalText = text.trim();
      const aiTags: string[] = [];
      if (enrichment) {
        if (enrichment.captionAppend) {
          finalText = [finalText, enrichment.captionAppend].filter(Boolean).join('\n\n');
        }
        if (enrichment.safetyNote) {
          finalText = [finalText, `⚠️ ${enrichment.safetyNote}`].filter(Boolean).join('\n\n');
        }
        aiTags.push(...enrichment.identificationTags);
      }

      const resolvedPlantId = plantId || enrichment?.suggestedPlantId || undefined;
      const resolvedTitle = enrichment?.suggestedTitle && title.trim() === '' ? enrichment.suggestedTitle : trimmedTitle;

      await createFeedPost(user, {
        title: resolvedTitle,
        text: finalText,
        imageUrls,
        imageUrl: imageUrls?.[0],
        videoUrl,
        plantId: resolvedPlantId,
        feedCategory: feedCategory || undefined,
        aiTags,
        aiEnriched: !!enrichment,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || enriching;
  const hasMedia = photos.length > 0 || !!video;

  return (
    <div className="fixed inset-0 z-[66] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-950 border border-sky-500/30 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
          <p className="text-xs font-black uppercase tracking-widest text-sky-300">New community post</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</label>
            <select
              value={feedCategory}
              onChange={(e) => setFeedCategory(e.target.value as 'plants' | 'edibles' | '')}
              className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white"
            >
              <option value="">General community</option>
              <option value="plants">Plants library</option>
              <option value="edibles">Edibles &amp; mushrooms</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Golden chanterelles after the rain"
              className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Photos{' '}
              <span className="text-slate-600 font-semibold normal-case tracking-normal">
                (optional · up to {PLANT_IMAGE_MAX_COUNT})
              </span>
            </label>
            {photos.length > 0 ? (
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {photos.map((photo, index) => (
                  <div key={photo.previewUrl} className="relative rounded-xl overflow-hidden border border-slate-700">
                    <img src={photo.previewUrl} alt="" className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                      aria-label="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <p className="absolute bottom-0 inset-x-0 bg-black/55 text-[10px] text-slate-300 px-2 py-0.5 truncate">
                      {formatPlantImageSize(photo.file.size)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {photos.length < PLANT_IMAGE_MAX_COUNT ? (
              <label className="mt-1.5 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-5 cursor-pointer hover:border-sky-500/40">
                <ImagePlus className="w-7 h-7 text-sky-400/80" />
                <span className="text-xs text-slate-400 text-center">Add field photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addPhotoFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            ) : null}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Video <span className="text-slate-600 font-semibold normal-case tracking-normal">(optional · MP4/WebM)</span>
            </label>
            {video ? (
              <div className="mt-1.5 relative rounded-xl overflow-hidden border border-slate-700 bg-black">
                <video src={video.previewUrl} controls className="w-full max-h-48" />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Remove video"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <p className="text-[10px] text-slate-400 px-2 py-1">{formatPlantImageSize(video.file.size)}</p>
              </div>
            ) : (
              <label className="mt-1.5 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-5 cursor-pointer hover:border-violet-500/40">
                <Video className="w-7 h-7 text-violet-400/80" />
                <span className="text-xs text-slate-400 text-center">Add a short field video</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/*"
                  className="sr-only"
                  onChange={(e) => {
                    addVideoFile(e.target.files?.[0] || null);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Caption</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Habitat, ID tips, harvest notes…"
              className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 resize-y"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={runBhiveResearch}
              onChange={(e) => {
                setRunBhiveResearch(e.target.checked);
                if (!e.target.checked) setEnrichmentPreview(null);
              }}
              className="mt-0.5 rounded border-slate-600"
            />
            <span className="text-xs text-violet-100/90 leading-relaxed">
              <span className="font-bold text-violet-200 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Add {HIVE_RESEARCH_LABEL}
              </span>
              <span className="block mt-1 text-violet-200/70">
                When you publish, {HIVE_RESEARCH_LABEL} ({HIVE_RESEARCH_POWERED_BY}) analyzes{' '}
                <strong className="text-violet-100">all attached photos together</strong> (up to {PLANT_IMAGE_MAX_COUNT})
                for ID tags, habitat notes, and safety warnings. Uses a small Bhive Credits charge.
              </span>
            </span>
          </label>

          {runBhiveResearch ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runResearch()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 hover:bg-violet-500/25 disabled:opacity-60 text-violet-100 font-bold px-4 py-2.5 text-xs"
            >
              {enriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Preview {HIVE_RESEARCH_LABEL}
            </button>
          ) : null}

          {enrichmentPreview ? (
            <div
              className={`rounded-xl border p-3 text-xs leading-relaxed space-y-2 ${
                enrichmentPreview.isToxic
                  ? 'border-rose-500/40 bg-rose-950/40 text-rose-100'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
              }`}
            >
              <p className="font-black uppercase tracking-wider text-[10px]">{HIVE_RESEARCH_LABEL} preview</p>
              {enrichmentPreview.identificationTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {enrichmentPreview.identificationTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/15 bg-black/20 px-2 py-0.5 text-[10px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {enrichmentPreview.captionAppend ? <p>{enrichmentPreview.captionAppend}</p> : null}
              {enrichmentPreview.safetyNote ? (
                <p className="text-rose-200 font-semibold">⚠️ {enrichmentPreview.safetyNote}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Link to plant <span className="text-slate-600 font-semibold normal-case tracking-normal">(optional)</span>
            </label>
            <input
              value={plantQuery}
              onChange={(e) => setPlantQuery(e.target.value)}
              placeholder="Search library…"
              className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-white placeholder:text-slate-600"
            />
            {plantId ? (
              <p className="mt-2 text-xs text-emerald-300">
                Linked: {PLANT_LIBRARY.find((p) => p.id === plantId)?.commonName}
                <button type="button" onClick={() => setPlantId('')} className="ml-2 text-slate-500 hover:text-white">
                  Clear
                </button>
              </p>
            ) : (
              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {plantMatches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPlantId(p.id);
                        setPlantQuery(p.commonName);
                      }}
                      className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                    >
                      {p.commonName}
                      <span className="text-slate-500 ml-1 italic">{p.scientificName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error ? <p className="text-xs text-red-300">{error}</p> : null}
          {hasMedia ? (
            <p className="text-[10px] text-amber-300/90">
              Posts with photos or video are reviewed before they appear in the feed.
            </p>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold px-4 py-3 text-sm"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {runBhiveResearch && !enrichmentPreview
              ? `Publish with ${HIVE_RESEARCH_LABEL}`
              : 'Publish post'}
          </button>
        </div>
      </div>
    </div>
  );
}
