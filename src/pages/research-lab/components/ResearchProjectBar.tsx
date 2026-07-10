import { useEffect, useState } from 'react';
import { FolderOpen, Save, Plus, Lock, Link2, Globe } from 'lucide-react';
import { useOwrWorkflow } from '../context/OwrWorkflowContext';
import styles from '../researchLab.module.css';

export default function ResearchProjectBar() {
  const {
    projectId,
    projectTitle,
    setProjectTitle,
    visibility,
    setVisibility,
    projects,
    saveProject,
    loadProject,
    createNewProject,
    refreshProjects,
    receipts,
  } = useOwrWorkflow();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const spent = receipts.reduce((s, r) => s + (Number(r.chargedUsd) || 0), 0);

  async function onSave() {
    setBusy(true);
    const res = await saveProject();
    setBusy(false);
    setStatus(res.ok ? 'Project saved' : res.error || 'Save failed');
    setTimeout(() => setStatus(''), 2500);
  }

  async function onNew() {
    setBusy(true);
    setProjectTitle('Research project');
    const id = await createNewProject('Research project');
    setBusy(false);
    setStatus(id ? 'New project created' : 'Could not create project');
    setTimeout(() => setStatus(''), 2500);
  }

  return (
    <div className={styles.rlProjectBar}>
      <div className={styles.rlProjectBarMain}>
        <FolderOpen className={styles.rlProjectIcon} aria-hidden />
        <label className={styles.rlSrOnly} htmlFor="rl-project-title">
          Project title
        </label>
        <input
          id="rl-project-title"
          className={styles.rlProjectTitleInput}
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          placeholder="Name this research project"
        />
        <select
          className={styles.rlProjectSelect}
          value={projectId || ''}
          onChange={(e) => {
            if (e.target.value) void loadProject(e.target.value);
          }}
          aria-label="Load project"
        >
          <option value="">{projectId ? 'Current project' : 'Resume a project…'}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.rlProjectBarActions}>
        <div className={styles.rlVisibility} role="group" aria-label="Visibility">
          {(
            [
              { id: 'private', label: 'Private', icon: Lock },
              { id: 'unlisted', label: 'Share link', icon: Link2 },
              { id: 'public', label: 'Publish', icon: Globe },
            ] as const
          ).map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                type="button"
                className={`${styles.rlVisBtn}${visibility === v.id ? ` ${styles.rlVisBtnActive}` : ''}`}
                onClick={() => setVisibility(v.id)}
                title={v.label}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
        <span className={styles.rlReceiptChip} title="Session Hive credit receipts">
          {spent > 0 ? `$${spent.toFixed(2)} this session` : 'No charges yet'}
        </span>
        <button type="button" className={styles.owrBtn} onClick={onNew} disabled={busy}>
          <Plus className="w-3.5 h-3.5 inline mr-1" />
          New
        </button>
        <button
          type="button"
          className={`${styles.owrBtn} ${styles.owrBtnPrimary}`}
          onClick={onSave}
          disabled={busy}
        >
          <Save className="w-3.5 h-3.5 inline mr-1" />
          Save
        </button>
      </div>
      {status && (
        <p className={styles.rlProjectStatus} role="status">
          {status}
        </p>
      )}
    </div>
  );
}
