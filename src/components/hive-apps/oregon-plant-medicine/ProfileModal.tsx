import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  fetchMyProfile,
  saveProfile,
  uploadPlantImage,
  type PlantMedicineProfile,
} from '../../../lib/oregonPlantMedicine/plantMedicineApi';
import AvatarCropModal from './AvatarCropModal';

type Props = {
  user: User;
  onClose: () => void;
  onSaved: (profile: PlantMedicineProfile) => void;
};

export default function ProfileModal({ user, onClose, onSaved }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropFile, setCropFile] = useState<File | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await fetchMyProfile(user);
        if (profile) {
          setDisplayName(profile.displayName);
          setBio(profile.bio);
          setAvatarUrl(profile.avatarUrl);
        } else {
          setDisplayName(user.displayName || user.email?.split('@')[0] || 'Forager');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const uploadCropped = async (file: File) => {
    setUploading(true);
    setError('');
    setCropFile(null);
    try {
      const url = await uploadPlantImage(user, file, 'avatar');
      setAvatarUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError('');
    try {
      const profile = await saveProfile(user, { displayName, bio, avatarUrl });
      onSaved(profile);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {cropFile ? (
        <AvatarCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(file) => void uploadCropped(file)}
        />
      ) : null}

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 className="font-bold text-white">Your forager profile</h2>
            <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 overflow-hidden shrink-0 ring-2 ring-emerald-500/40">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-emerald-300">
                        {(displayName[0] || '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="inline-flex text-xs font-bold text-emerald-300 cursor-pointer hover:text-emerald-200">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setCropFile(file);
                          e.target.value = '';
                        }}
                      />
                      {uploading ? 'Uploading…' : 'Choose photo'}
                    </label>
                    <p className="text-[10px] text-slate-500 leading-snug max-w-[12rem]">
                      Crop inside the circle so your face is centered — drag and zoom before saving.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400">Display name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={80}
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 text-white px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400">Bio (optional)</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Favorite foraging spots, experience level…"
                    className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-700 text-white px-3 py-2 text-sm"
                  />
                </div>

                {error ? <p className="text-xs text-red-300">{error}</p> : null}

                <button
                  type="button"
                  disabled={saving || !displayName.trim()}
                  onClick={() => void onSave()}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm"
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
