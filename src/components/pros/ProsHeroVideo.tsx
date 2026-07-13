import type { ReactNode } from 'react';

const HERO_VIDEO = '/aibhive-pro-diagnose-trades-management-software.mp4';

type ProsHeroVideoProps = {
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
};

export default function ProsHeroVideo({ children, className = '', overlayClassName = '' }: ProsHeroVideoProps) {
  return (
    <section
      className={`relative min-h-screen flex items-center overflow-hidden ${className}`}
      aria-label="AiBhive Pros field operations"
    >
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/pros/hero-field-team.png"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div className={`absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-900/55 to-slate-900/85 ${overlayClassName}`} />
      <div className="relative z-10 w-full">{children}</div>
    </section>
  );
}
