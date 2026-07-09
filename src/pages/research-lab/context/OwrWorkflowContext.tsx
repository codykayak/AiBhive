import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type OwrOutputEntry = {
  id: string;
  step: 'scrape' | 'ocr' | 'library' | 'translate' | 'search';
  title: string;
  text: string;
  at: string;
};

type OwrWorkflowContextValue = {
  output: OwrOutputEntry[];
  appendOutput: (entry: Omit<OwrOutputEntry, 'id' | 'at'>) => void;
  clearOutput: () => void;
  scrapeText: string;
  setScrapeText: (t: string) => void;
  ocrText: string;
  setOcrText: (t: string) => void;
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
  activeStep: number;
  setActiveStep: (n: number) => void;
};

const OwrWorkflowContext = createContext<OwrWorkflowContextValue | null>(null);

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function OwrWorkflowProvider({ children }: { children: ReactNode }) {
  const [output, setOutput] = useState<OwrOutputEntry[]>([]);
  const [scrapeText, setScrapeText] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  const appendOutput = useCallback((entry: Omit<OwrOutputEntry, 'id' | 'at'>) => {
    setOutput((prev) => [
      ...prev,
      { ...entry, id: newId(), at: new Date().toISOString() },
    ]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
    setScrapeText('');
    setOcrText('');
    setImageUrls([]);
  }, []);

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
    }),
    [output, appendOutput, clearOutput, scrapeText, ocrText, imageUrls, activeStep]
  );

  return <OwrWorkflowContext.Provider value={value}>{children}</OwrWorkflowContext.Provider>;
}

export function useOwrWorkflow() {
  const ctx = useContext(OwrWorkflowContext);
  if (!ctx) throw new Error('useOwrWorkflow must be used within OwrWorkflowProvider');
  return ctx;
}
