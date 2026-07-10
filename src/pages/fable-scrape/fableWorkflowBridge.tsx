import { createContext, useContext, type ReactNode } from 'react';

export type FableWorkflowBridgeValue = {
  projectId: string | null;
  visibility: 'private' | 'unlisted' | 'public';
  setScrapeText: (t: string) => void;
  setOcrText: (t: string) => void;
  setImageUrls: (urls: string[]) => void;
  appendOutput: (entry: {
    step: 'scrape' | 'ocr' | 'library' | 'translate' | 'search' | 'brief';
    title: string;
    text: string;
    sourceUrl?: string;
    confidence?: number | null;
  }) => void;
  addReceipt: (r: {
    feature: string;
    summary: string;
    rawCostUsd: number;
    chargedUsd: number;
    meta?: Record<string, unknown>;
  }) => void;
  addReliability: (e: {
    op: string;
    ok: boolean;
    engine?: string;
    routingMode?: string;
    retries?: number;
    reason?: string;
    pagesVisited?: number;
  }) => void;
  authHeaders: () => Promise<Record<string, string>>;
};

const FableWorkflowBridgeContext = createContext<FableWorkflowBridgeValue | null>(null);

export function FableWorkflowBridgeProvider({
  value,
  children,
}: {
  value: FableWorkflowBridgeValue | null;
  children: ReactNode;
}) {
  return (
    <FableWorkflowBridgeContext.Provider value={value}>{children}</FableWorkflowBridgeContext.Provider>
  );
}

export function useFableWorkflowBridge() {
  return useContext(FableWorkflowBridgeContext);
}
