import type { User } from 'firebase/auth';
import { useMemo, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { PLANT_LIBRARY } from '../../../lib/oregonPlantMedicine/plantLibrary';
import { createFeedPost, uploadPlantImage } from '../../../lib/oregonPlantMedicine/plantMedicineApi';

type Props = {
  user: User | null;
  onClose: () => void;
  onSignIn: () => void;
  onCreated: () => void;
};

export default function CreateCommunityPostModal({ user, onClose, onSignIn, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [plantId, setPlantId] = useState('');
  const [plantQuery, setPlantQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const plantMatches = useMemo(() => {
    const q = plantQuery.trim().toLowerCase();
    if (!q) return PLANT_LIBRARY.slice(0, 8);
    return PLANT_LIBRARY.filter((p) =>
      [p.commonName, p.scientificName, ...(p.alsoKnownAs ?? [])].join(' ').toLowerCase().includes(q),
    ).slice(0, 8);
  }, [plantQuery]);

  const onPickFile = (picked: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    setPreviewUrl(picked ? URL.createObjectURL(picked) : null);
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
      let imageUrl: string | undefined;
      if (file) {
        imageUrl = await uploadPlantImage(user, file, 'photo');
      }
      await createFeedPost(user, {
        title: trimmedTitle,
        text: text.trim(),
        imageUrl,
        plantId: plantId || undefined,
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

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
              Photo <span className="text-slate-600 font-semibold normal-case tracking-normal">(optional)</span>
            </label>
            <label className="mt-1.5 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 px-4 py-6 cursor-pointer hover:border-sky-500/40">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
              ) : (
                <>
                  <ImagePlus className="w-8 h-8 text-sky-400/80" />
                  <span className="text-xs text-slate-400">Tap to upload a field photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {previewUrl ? (
              <button
                type="button"
                onClick={() => onPickFile(null)}
                className="mt-2 text-xs text-slate-500 hover:text-slate-300"
              >
                Remove photo
              </button>
            ) : null}
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
          {file ? (
            <p className="text-[10px] text-amber-300/90">
              Posts with photos are reviewed before they appear in the feed.
            </p>
          ) : null}

          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white font-bold px-4 py-3 text-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Publish post
          </button>
        </div>
      </div>
    </div>
  );
}
