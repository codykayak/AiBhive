import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useResearchLabUser } from './ResearchLabUserContext';

export type OwrOutputEntry = {
  id: string;
  step: 'scrape' | 'ocr' | 'library' | 'translate' | 'search' | 'brief';
  title: string;
  text: string;
  at: string;
  sourceUrl?: string;
  confidence?: number | null;
};

export type OwrReceipt = {
  id: string;
  feature: string;
  summary: string;
  rawCostUsd: number;
  chargedUsd: number;
  meta?: Record<string, unknown>;
  at: string;
};

export type ReliabilityEvent = {
  id: string;
  op: string;
  ok: boolean;
  engine?: string;
  routingMode?: string;
  retries?: number;
  reason?: string;
  pagesVisited?: number;
  at: string;
};

type OwrWorkflowContextValue = {
  output: OwrOutputEntry[];
  appendOutput: (entry: Omit<OwrOutputEntry, 'id' | 'at'> & { id?: string; at?: string }) => void;
  clearOutput: () => void;
  scrapeText: string;
  setScrapeText: (t: string) => void;
  ocrText: string;
  setOcrText: (t: string) => void;
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
  activeStep: number;
  setActiveStep: (n: number) => void;
  projectId: string | null;
  projectTitle: string;
  setProjectTitle: (t: string) => void;
  visibility: 'private' | 'unlisted' | 'public';
  setVisibility: (v: 'private' | 'unlisted' | 'public') => void;
  domainPackId: string | null;
  setDomainPackId: (id: string | null) => void;
  receipts: OwrReceipt[];
  addReceipt: (r: Omit<OwrReceipt, 'id' | 'at'> & { id?: string; at?: string }) => void;
  reliability: ReliabilityEvent[];
  addReliability: (e: Omit<ReliabilityEvent, 'id' | 'at'> & { id?: string; at?: string }) => void;
  saveProject: () => Promise<{ ok: boolean; projectId?: string; error?: string }>;
  loadProject: (id: string) => Promise<boolean>;
  createNewProject: (title?: string) => Promise<string | null>;
  projects: Array<{ id: string; title: string; updatedAt?: string | null }>;
  refreshProjects: () => Promise<void>;
  authHeaders: () => Promise<Record<string, string>>;
};

const OwrWorkflowContext = createContext<OwrWorkflowContextValue | null>(null);
const LS_KEY = 'aibhive_rl_project_v1';

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function OwrWorkflowProvider({ children }: { children: ReactNode }) {
  const user = useResearchLabUser();
  const [output, setOutput] = useState<OwrOutputEntry[]>([]);
  const [scrapeText, setScrapeText] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('Research project');
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
  const [domainPackId, setDomainPackId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<OwrReceipt[]>([]);
  const [reliability, setReliability] = useState<ReliabilityEvent[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; title: string; updatedAt?: string | null }>>([]);
  const saveTimer = useRef<number | null>(null);
  const hydrated = useRef(false);

  const authHeaders = useCallback(async () => {
    if (!user) return {};
    return { Authorization: `Bearer ${await user.getIdToken()}` };
  }, [user]);

  const appendOutput = useCallback((entry: Omit<OwrOutputEntry, 'id' | 'at'> & { id?: string; at?: string }) => {
    setOutput((prev) => [
      ...prev,
      { ...entry, id: entry.id || newId(), at: entry.at || new Date().toISOString() },
    ]);
  }, []);

  const addReceipt = useCallback((r: Omit<OwrReceipt, 'id' | 'at'> & { id?: string; at?: string }) => {
    setReceipts((prev) =>
      [
        ...prev,
        { ...r, id: r.id || newId(), at: r.at || new Date().toISOString() },
      ].slice(-40),
    );
  }, []);

  const addReliability = useCallback(
    (e: Omit<ReliabilityEvent, 'id' | 'at'> & { id?: string; at?: string }) => {
      setReliability((prev) =>
        [...prev, { ...e, id: e.id || newId(), at: e.at || new Date().toISOString() }].slice(-30),
      );
    },
    [],
  );

  const clearOutput = useCallback(() => {
    setOutput([]);
    setScrapeText('');
    setOcrText('');
    setImageUrls([]);
    setReceipts([]);
    setReliability([]);
  }, []);

  const refreshProjects = useCallback(async () => {
    if (!user) return;
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/research-lab/projects', { headers });
      const data = await res.json();
      if (res.ok) {
        setProjects(
          (data.projects || []).map((p: { id: string; title: string; updatedAt?: string | null }) => ({
            id: p.id,
            title: p.title,
            updatedAt: p.updatedAt,
          })),
        );
      }
    } catch {
      /* ignore */
    }
  }, [user, authHeaders]);

  const createNewProject = useCallback(
    async (title?: string) => {
      if (!user) return null;
      try {
        const headers = {
          ...(await authHeaders()),
          'Content-Type': 'application/json',
        };
        const res = await fetch('/api/research-lab/projects', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: title || 'Research project',
            visibility: 'private',
            domainPackId: null,
            activeStep: 0,
            scrapeText: '',
            ocrText: '',
            imageUrls: [],
            output: [],
            receipts: [],
          }),
        });
        const data = await res.json();
        if (!res.ok) return null;
        setProjectId(data.project.id);
        setProjectTitle(data.project.title);
        setVisibility('private');
        setDomainPackId(null);
        setActiveStep(0);
        setScrapeText('');
        setOcrText('');
        setImageUrls([]);
        setOutput([]);
        setReceipts([]);
        setReliability([]);
        localStorage.setItem(LS_KEY, data.project.id);
        await refreshProjects();
        return data.project.id as string;
      } catch {
        return null;
      }
    },
    [user, authHeaders, refreshProjects],
  );

  const loadProject = useCallback(
    async (id: string) => {
      if (!user) return false;
      try {
        const headers = await authHeaders();
        const res = await fetch(`/api/research-lab/projects/${encodeURIComponent(id)}`, { headers });
        const data = await res.json();
        if (!res.ok || !data.project) return false;
        const p = data.project;
        setProjectId(p.id);
        setProjectTitle(p.title || 'Research project');
        setVisibility(p.visibility || 'private');
        setDomainPackId(p.domainPackId || null);
        setActiveStep(p.activeStep ?? 0);
        setScrapeText(p.scrapeText || '');
        setOcrText(p.ocrText || '');
        setImageUrls(p.imageUrls || []);
        setOutput(p.output || []);
        setReceipts(p.receipts || []);
        localStorage.setItem(LS_KEY, p.id);
        return true;
      } catch {
        return false;
      }
    },
    [user, authHeaders],
  );

  const saveProject = useCallback(async () => {
    if (!user) return { ok: false, error: 'Sign in required' };
    try {
      let id = projectId;
      if (!id) {
        id = await createNewProject(projectTitle);
        if (!id) return { ok: false, error: 'Could not create project' };
      }
      const headers = {
        ...(await authHeaders()),
        'Content-Type': 'application/json',
      };
      const res = await fetch(`/api/research-lab/projects/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: projectTitle,
          visibility,
          domainPackId,
          activeStep,
          scrapeText,
          ocrText,
          imageUrls,
          output,
          receipts,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Save failed' };
      return { ok: true, projectId: id };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Save failed' };
    }
  }, [
    user,
    projectId,
    createNewProject,
    projectTitle,
    authHeaders,
    visibility,
    domainPackId,
    activeStep,
    scrapeText,
    ocrText,
    imageUrls,
    output,
    receipts,
  ]);

  // Hydrate last project once
  useEffect(() => {
    if (!user || hydrated.current) return;
    hydrated.current = true;
    void refreshProjects();
    const last = localStorage.getItem(LS_KEY);
    if (last) void loadProject(last);
  }, [user, refreshProjects, loadProject]);

  // Autosave debounce
  useEffect(() => {
    if (!user || !projectId) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveProject();
    }, 2500);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [
    user,
    projectId,
    scrapeText,
    ocrText,
    imageUrls,
    output,
    receipts,
    activeStep,
    visibility,
    domainPackId,
    projectTitle,
    saveProject,
  ]);

  const value = useMemo(
    () => ({
      output,
      appendOutput,
      clearOutput,
      scrapeText,
      setScrapeText,
      ocrText,
      setOcrText,
      imageUrls,
      setImageUrls,
      activeStep,
      setActiveStep,
      projectId,
      projectTitle,
      setProjectTitle,
      visibility,
      setVisibility,
      domainPackId,
      setDomainPackId,
      receipts,
      addReceipt,
      reliability,
      addReliability,
      saveProject,
      loadProject,
      createNewProject,
      projects,
      refreshProjects,
      authHeaders,
    }),
    [
      output,
      appendOutput,
      clearOutput,
      scrapeText,
      ocrText,
      imageUrls,
      activeStep,
      projectId,
      projectTitle,
      visibility,
      domainPackId,
      receipts,
      addReceipt,
      reliability,
      addReliability,
      saveProject,
      loadProject,
      createNewProject,
      projects,
      refreshProjects,
      authHeaders,
    ],
  );

  return <OwrWorkflowContext.Provider value={value}>{children}</OwrWorkflowContext.Provider>;
}

export function useOwrWorkflow() {
  const ctx = useContext(OwrWorkflowContext);
  if (!ctx) throw new Error('useOwrWorkflow must be used within OwrWorkflowProvider');
  return ctx;
}

/** Safe for Fable Scrape when embedded outside the workbench. */
export function useOwrWorkflowOptional() {
  return useContext(OwrWorkflowContext);
}
