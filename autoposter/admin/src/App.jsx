import { useEffect } from 'react';
import { ArrowLeft, Hexagon, Sparkles } from 'lucide-react';
import SocialPostsPanel from './SocialPostsPanel.jsx';
import ui from './ui.module.css';

export default function App() {
  useEffect(() => {
    document.title = 'AiBhive AutoPoster — Social Post Factory';
  }, []);

  return (
    <div className={ui.page}>
      <div className={ui.honeycomb} aria-hidden="true" />

      <header className={ui.topBar}>
        <a href="https://www.aibhive.com" className={ui.backLink}>
          <ArrowLeft size={16} />
          aibhive.com
        </a>
      </header>

      <div className={ui.appShell}>
        <header className={ui.appHeader}>
          <div className={ui.brandRow}>
            <div className={ui.logoMark}>
              <Hexagon size={22} strokeWidth={1.75} />
            </div>
            <div>
              <p className={ui.eyebrow}>AiBhive</p>
              <h1>AutoPoster</h1>
            </div>
          </div>
          <p className={ui.tagline}>
            <Sparkles size={14} className={ui.taglineIcon} />
            AI researches industry news, writes platform-specific copy, and generates branded
            images for Facebook, Instagram, and X — ready to review and post.
          </p>
        </header>

        <SocialPostsPanel />
      </div>
    </div>
  );
}
