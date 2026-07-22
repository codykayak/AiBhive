import { useState } from 'react';
import {
  buildFacebookShareUrl,
  buildInstagramClipboardText,
  buildXShareUrl,
  getLivingKnowledgeSharePayload,
} from '../../../lib/oregonPlantMedicine/livingKnowledgeShare';

type Props = {
  className?: string;
  label?: string;
};

function openShareWindow(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=520');
}

export default function LivingKnowledgeSocialShare({ className = '', label = 'Share this app' }: Props) {
  const [instagramCopied, setInstagramCopied] = useState(false);

  const shareFacebook = () => {
    openShareWindow(buildFacebookShareUrl());
  };

  const shareX = () => {
    openShareWindow(buildXShareUrl());
  };

  const shareInstagram = async () => {
    try {
      await navigator.clipboard.writeText(buildInstagramClipboardText());
      setInstagramCopied(true);
      window.setTimeout(() => setInstagramCopied(false), 2500);
    } catch {
      openShareWindow('https://www.instagram.com/');
    }
  };

  const payload = getLivingKnowledgeSharePayload();

  return (
    <div className={className}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={shareFacebook}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/35 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-200 hover:bg-blue-500/20 transition-colors"
          aria-label={`Share ${payload.title} on Facebook`}
        >
          Facebook
        </button>
        <button
          type="button"
          onClick={() => void shareInstagram()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/35 bg-fuchsia-500/10 px-3 py-2 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/20 transition-colors"
          aria-label={instagramCopied ? 'Link copied for Instagram' : 'Copy share text for Instagram'}
        >
          {instagramCopied ? 'Copied for Instagram' : 'Instagram'}
        </button>
        <button
          type="button"
          onClick={shareX}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/40 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700/80 transition-colors"
          aria-label={`Share ${payload.title} on X`}
        >
          X
        </button>
      </div>
    </div>
  );
}
