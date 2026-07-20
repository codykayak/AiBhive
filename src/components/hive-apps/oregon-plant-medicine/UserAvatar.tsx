import { useEffect, useState } from 'react';
import { User as UserIcon } from 'lucide-react';

type Props = {
  url: string | null | undefined;
  name: string;
  className?: string;
  iconClassName?: string;
  /** Keep blob: URLs visible even if remote URL fails to load yet */
  preferBlob?: boolean;
};

/** Profile avatar with fallback when media URL fails to load. */
export default function UserAvatar({
  url,
  name,
  className = '',
  iconClassName = 'w-4 h-4',
  preferBlob = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const initial = (name.trim()[0] || '?').toUpperCase();
  const isBlob = !!url?.startsWith('blob:');

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || (failed && !(preferBlob && isBlob))) {
    return (
      <div
        className={`flex items-center justify-center bg-emerald-500/20 text-emerald-300 font-bold shrink-0 ${className}`}
        aria-hidden
      >
        {url && failed ? (
          <span className="text-[0.65em]">{initial}</span>
        ) : (
          <UserIcon className={iconClassName} />
        )}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={`object-cover object-center shrink-0 ${className}`}
      onError={() => {
        if (preferBlob && isBlob) return;
        setFailed(true);
      }}
    />
  );
}
