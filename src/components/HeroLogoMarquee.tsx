import { HERO_PARTNER_LOGOS } from '../data/heroPartnerLogos';

function LogoStrip({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <>
      {HERO_PARTNER_LOGOS.map((logo) => (
        <li
          key={logo.name}
          className="flex shrink-0 items-center justify-center px-6 sm:px-8"
          aria-hidden={ariaHidden}
        >
          <img
            src={logo.src}
            alt={ariaHidden ? '' : logo.name}
            className="hero-partner-logo h-5 w-auto sm:h-6"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </li>
      ))}
    </>
  );
}

/** Endless scrolling AI partner logo band — sits at the foot of the homepage hero. */
export default function HeroLogoMarquee() {
  return (
    <div className="relative z-20 mt-auto w-full border-t border-white/5 bg-bee-black/50 backdrop-blur-md">
      <p className="pointer-events-none pt-2 pb-0 text-center text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
        Built for the AI stack you already use
      </p>

      <div className="hero-logo-marquee-mask relative overflow-hidden pt-2 pb-[2px]">
        <ul className="hero-logo-marquee-track m-0 flex w-max list-none items-center p-0">
          <LogoStrip />
          <LogoStrip ariaHidden />
        </ul>
      </div>
    </div>
  );
}
