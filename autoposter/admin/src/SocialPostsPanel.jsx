import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './ui.module.css';
import socialStyles from './socialPosts.module.css';
import {
  PLATFORMS,
  approveSocialPost,
  copyAllPlatforms,
  copyPostBundle,
  formatPostDate,
  generateSocialPost,
  getSocialConfig,
  getStoredAdminKey,
  listSocialPosts,
  markSocialPostPosted,
  rejectSocialPost,
  resendSocialNotify,
  sendTestSms,
  setStoredAdminKey,
  todayKey,
  updateSocialCaptions,
  updateSocialConfig,
} from './socialPostsApi.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending_review', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'posted', label: 'Posted' },
];

function statusClass(status) {
  if (status === 'approved') return socialStyles.statusApproved;
  if (status === 'posted') return socialStyles.statusPosted;
  if (status === 'rejected') return socialStyles.statusRejected;
  if (status === 'generating') return socialStyles.statusGenerating;
  if (status === 'failed') return socialStyles.statusRejected;
  return socialStyles.statusPending;
}

function statusLabel(status) {
  return (status || 'pending_review').replace(/_/g, ' ');
}

function Toast({ message }) {
  if (!message) return null;
  return <div className={socialStyles.toast}>{message}</div>;
}

function StatsBar({ stats }) {
  if (!stats) return null;
  const { counts, today, todayPost } = stats;

  return (
    <div className={socialStyles.statsBar}>
      <div className={socialStyles.statCard}>
        <span className={socialStyles.statValue}>{counts.pending}</span>
        <span className={socialStyles.statLabel}>Pending</span>
      </div>
      <div className={socialStyles.statCard}>
        <span className={socialStyles.statValue}>{counts.approved}</span>
        <span className={socialStyles.statLabel}>Approved</span>
      </div>
      <div className={socialStyles.statCard}>
        <span className={socialStyles.statValue}>{counts.posted}</span>
        <span className={socialStyles.statLabel}>Posted</span>
      </div>
      <div className={socialStyles.statToday}>
        <strong>Today ({today})</strong>
        {todayPost ? (
          <span className={`${socialStyles.statusBadge} ${statusClass(todayPost.status)}`}>
            {statusLabel(todayPost.status)}
          </span>
        ) : (
          <span className={styles.hint}>Not generated yet</span>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, isToday, onRefresh, onToast }) {
  const [platform, setPlatform] = useState('facebook');
  const [caption, setCaption] = useState(post[platform]?.caption || '');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);

  const pl = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0];
  const p = post[platform] || {};
  const overLimit = platform === 'x' && caption.length > pl.charLimit;

  useEffect(() => {
    setCaption(post[platform]?.caption || '');
    setDirty(false);
  }, [platform, post]);

  async function saveCaption() {
    setSaving(true);
    try {
      await updateSocialCaptions(post.id, { [platform]: { caption } });
      setDirty(false);
      onToast('Caption saved');
      onRefresh();
    } catch (e) {
      onToast(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function doAction(fn, msg) {
    setActing(true);
    try {
      await fn(post.id);
      onToast(msg);
      onRefresh();
    } catch (e) {
      onToast(e.message);
    } finally {
      setActing(false);
    }
  }

  async function copyCaption() {
    const text = copyPostBundle({ ...post, [platform]: { ...p, caption } }, platform);
    await navigator.clipboard?.writeText(text);
    onToast(`${pl.label} caption copied`);
  }

  async function copyAll() {
    const merged = { ...post };
    merged[platform] = { ...p, caption };
    await navigator.clipboard?.writeText(copyAllPlatforms(merged));
    onToast('All platforms copied');
  }

  function downloadImage() {
    if (!p.imageUrl) return;
    const a = document.createElement('a');
    a.href = p.imageUrl;
    a.download = `social-${post.date}-${platform}.png`;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
    onToast('Image download started');
  }

  return (
    <article className={`${socialStyles.postCard} ${isToday ? socialStyles.postCardToday : ''}`}>
      <div className={socialStyles.postCardHead}>
        <div>
          {isToday && <span className={socialStyles.todayPill}>Today</span>}
          <div className={socialStyles.postDate}>{formatPostDate(post.date)}</div>
          <div className={socialStyles.postTopic}>{post.topic?.title}</div>
          {post.sourceArticle && (
            <div className={socialStyles.articleMeta}>
              <span>{post.sourceArticle.source}</span>
              {post.sourceArticle.publishedAt && (
                <span> · {post.sourceArticle.publishedAt}</span>
              )}
            </div>
          )}
          {post.sourceArticle?.url && (
            <a
              className={socialStyles.articleLink}
              href={post.sourceArticle.url}
              target="_blank"
              rel="noreferrer"
            >
              {post.sourceArticle.title?.slice(0, 80)}
              {post.sourceArticle.title?.length > 80 ? '…' : ''}
            </a>
          )}
        </div>
        <span className={`${socialStyles.statusBadge} ${statusClass(post.status)}`}>
          {statusLabel(post.status)}
        </span>
      </div>

      <div className={socialStyles.platformTabs}>
        {PLATFORMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              platform === item.id
                ? `${socialStyles.platformTabActive} ${socialStyles[`tab_${item.id}`]}`
                : `${socialStyles.platformTab} ${socialStyles[`tab_${item.id}`]}`
            }
            onClick={() => setPlatform(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={socialStyles.postBody}>
        <div
          className={`${socialStyles.imagePreview} ${socialStyles[`aspect_${pl.aspect}`]}`}
        >
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={`${platform} preview for ${post.date}`} />
          ) : (
            <div className={socialStyles.imagePlaceholder}>
              Image not generated
              <br />
              <span className={styles.hint}>Try Regenerate</span>
            </div>
          )}
        </div>

        <div className={socialStyles.captionArea}>
          <label className={socialStyles.captionLabel}>
            {pl.label} caption — ready to paste
          </label>
          <textarea
            className={socialStyles.captionTextarea}
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              setDirty(true);
            }}
          />
          <div className={`${socialStyles.charCount} ${overLimit ? socialStyles.charOver : ''}`}>
            {caption.length} / {pl.charLimit}
            {dirty && <span className={socialStyles.unsaved}> · unsaved</span>}
          </div>
          <div className={socialStyles.socialActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
              onClick={copyCaption}
            >
              Copy {pl.label}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
              onClick={copyAll}
            >
              Copy all
            </button>
            {p.imageUrl && (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
                onClick={downloadImage}
              >
                Download image
              </button>
            )}
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSm} ${styles.btnPrimary}`}
              disabled={saving || !dirty}
              onClick={saveCaption}
            >
              {saving ? 'Saving…' : 'Save edits'}
            </button>
          </div>
        </div>
      </div>

      <div className={socialStyles.postFooter}>
        {post.status === 'pending_review' && (
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSm} ${styles.btnPrimary}`}
              disabled={acting}
              onClick={() => doAction(approveSocialPost, 'Approved')}
            >
              Approve
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
              disabled={acting}
              onClick={() => doAction(rejectSocialPost, 'Rejected')}
            >
              Reject
            </button>
          </>
        )}
        {post.status !== 'posted' && post.status !== 'generating' && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSm} ${styles.btnPrimary}`}
            disabled={acting}
            onClick={() => doAction(markSocialPostPosted, 'Marked as posted')}
          >
            Mark as posted
          </button>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSm} ${styles.btnGhost}`}
          disabled={acting}
          onClick={() => doAction(resendSocialNotify, 'SMS resent')}
        >
          Resend SMS
        </button>
      </div>

      {post.errors?.length > 0 && (
        <div className={socialStyles.warnBanner}>
          Partial issues: {post.errors.join(' · ')}
        </div>
      )}
      {post.notifyError && (
        <div className={socialStyles.warnBanner}>SMS error: {post.notifyError}</div>
      )}
    </article>
  );
}

export default function SocialPostsPanel() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [adminKey, setAdminKey] = useState(getStoredAdminKey());
  const [config, setConfig] = useState(null);
  const [notifyPhone, setNotifyPhone] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [showSettings, setShowSettings] = useState(!getStoredAdminKey());
  const [filter, setFilter] = useState('all');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  }, []);

  const refresh = useCallback(async () => {
    if (!getStoredAdminKey()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [listRes, configRes] = await Promise.all([
        listSocialPosts(30),
        getSocialConfig(),
      ]);
      setPosts(listRes.posts || []);
      setStats(listRes.stats || null);
      setConfig(configRes.config);
      setNotifyPhone(configRes.config?.notifyPhone || '');
      setNotifyEnabled(configRes.config?.notifyEnabled !== false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts;
    return posts.filter((p) => (p.status || 'pending_review') === filter);
  }, [posts, filter]);

  const today = todayKey();

  function saveKey() {
    setStoredAdminKey(adminKey.trim());
    setShowSettings(false);
    showToast('API key saved');
    refresh();
  }

  async function handleGenerate(force = false) {
    setGenerating(true);
    setError('');
    showToast(force ? 'Regenerating… this takes 2–4 min' : 'Generating… this takes 2–4 min');
    try {
      const res = await generateSocialPost(force);
      if (res.skipped && res.reason === 'already_exists') {
        showToast('Today already exists — use Regenerate to overwrite');
      } else if (res.skipped && res.reason === 'in_progress') {
        showToast('Generation already in progress');
      } else {
        showToast('Post bundle ready');
      }
      await refresh();
    } catch (e) {
      setError(e.message);
      showToast(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveConfig() {
    setSavingConfig(true);
    try {
      await updateSocialConfig({ notifyPhone, notifyEnabled });
      await refresh();
      showToast('Notification settings saved');
    } catch (e) {
      showToast(e.message);
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleTestSms() {
    setTestingSms(true);
    try {
      await sendTestSms(notifyPhone);
      showToast('Test SMS sent — check your phone');
    } catch (e) {
      showToast(e.message);
    } finally {
      setTestingSms(false);
    }
  }

  return (
    <div className={socialStyles.socialWrap}>
      <Toast message={toast} />

      <div className={socialStyles.socialHeader}>
        <div>
          <strong>Post queue</strong>
          <p className={styles.hint} style={{ marginTop: 4 }}>
            Generate today&apos;s bundle, review captions and images, then copy to Facebook,
            Instagram, and X. Optional daily SMS at 7 AM PT when posts are ready.
          </p>
        </div>
        <div className={socialStyles.socialActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            onClick={() => setShowSettings((v) => !v)}
          >
            Settings
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
            disabled={generating || !adminKey}
            onClick={() => handleGenerate(true)}
          >
            Regenerate
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
            disabled={generating || !adminKey}
            onClick={() => handleGenerate(false)}
          >
            {generating ? (
              <>
                <span className={socialStyles.spinner} />
                Working…
              </>
            ) : (
              'Generate today'
            )}
          </button>
        </div>
      </div>

      {adminKey && stats && <StatsBar stats={stats} />}

      {(showSettings || !adminKey) && (
        <div className={socialStyles.settingsCard}>
          <div className={styles.cardTitle}>Connection & notifications</div>
          <div className={socialStyles.settingsGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Social Admin API key</label>
              <input
                className={styles.input}
                type="password"
                placeholder="SOCIAL_ADMIN_API_KEY from Firebase secrets"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>SMS phone (E.164)</label>
              <input
                className={styles.input}
                placeholder="+15413212630"
                value={notifyPhone}
                onChange={(e) => setNotifyPhone(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.rowWrap} style={{ marginTop: 12, alignItems: 'center' }}>
            <span className={styles.hint}>Daily SMS when posts are ready (7 AM PT)</span>
            <div
              className={`${styles.toggle} ${notifyEnabled ? styles.toggleOn : ''}`}
              onClick={() => setNotifyEnabled((v) => !v)}
              role="switch"
              aria-checked={notifyEnabled}
            >
              <span className={styles.toggleKnob} />
            </div>
          </div>
          <div className={socialStyles.socialActions} style={{ marginTop: 14 }}>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={saveKey}>
              Save API key
            </button>
            {adminKey && (
              <>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                  disabled={savingConfig}
                  onClick={handleSaveConfig}
                >
                  {savingConfig ? 'Saving…' : 'Save notifications'}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                  disabled={testingSms || !notifyPhone}
                  onClick={handleTestSms}
                >
                  {testingSms ? 'Sending…' : 'Send test SMS'}
                </button>
              </>
            )}
          </div>
          <p className={socialStyles.setupNote}>
            Deploy Firebase functions from <code>autoposter/functions</code>, then set{' '}
            <code>VITE_SOCIAL_API_URL</code> to your <code>socialPosts</code> endpoint.
            Use the <code>SOCIAL_ADMIN_API_KEY</code> secret as the key above.
          </p>
        </div>
      )}

      {error && <div className={socialStyles.errorBanner}>{error}</div>}

      {adminKey && (
        <div className={socialStyles.filterRow}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? socialStyles.filterActive : socialStyles.filterBtn}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className={socialStyles.emptyState}>
          <span className={socialStyles.spinner} />
          Loading posts…
        </div>
      )}

      {!loading && !error && filteredPosts.length === 0 && adminKey && (
        <div className={socialStyles.emptyState}>
          <p>No posts{filter !== 'all' ? ` with status "${filter}"` : ''} yet.</p>
          <p className={styles.hint} style={{ marginTop: 8 }}>
            Hit <strong>Generate today</strong> or wait for the 7 AM scheduler.
          </p>
        </div>
      )}

      {!loading
        && filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isToday={post.date === today || post.id === today}
            onRefresh={refresh}
            onToast={showToast}
          />
        ))}

      {config && (
        <p className={styles.hint}>
          Scheduler 7:00 AM PT · SMS {config.notifyEnabled ? `→ ${config.notifyPhone}` : 'off'}
        </p>
      )}
    </div>
  );
}
