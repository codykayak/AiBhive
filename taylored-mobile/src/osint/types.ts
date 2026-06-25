export type IntelTargetType = 'company' | 'domain' | 'person';

/** Optional geographic filter for web search modules (Firecrawl / Serp). */
export type IntelRegionFilter = {
  restrictToRegion?: boolean;
  location?: string;
  radiusMiles?: number;
};

export type IntelTarget = {
  type: IntelTargetType;
  /** Primary label — company name, website/domain, or person name */
  label: string;
  domain?: string;
  /** Free-form user intent, e.g. "everything about leadership and tech stack" */
  userIntent?: string;
  region?: IntelRegionFilter;
};

export type ToolTier = 'free' | 'api_key' | 'hive_cloud';

export type OsintToolId =
  | 'dns_records'
  | 'mx_records'
  | 'txt_records'
  | 'cert_transparency'
  | 'subdomain_probe'
  | 'rdap_domain'
  | 'tech_fingerprint'
  | 'security_headers'
  | 'page_extract'
  | 'email_harvest'
  | 'robots_sitemap'
  | 'google_dorks'
  | 'firecrawl_search'
  | 'firecrawl_scrape'
  | 'serp_search'
  | 'username_probe'
  | 'wayback_snapshot';

export type OsintToolDef = {
  id: OsintToolId;
  name: string;
  description: string;
  tier: ToolTier;
  apiKeyField?: 'firecrawl' | 'serpapi';
  /** Rough seconds for UI estimates */
  estSeconds: number;
  defaultEnabled: boolean;
  /** Which target modes this module applies to (website = domain). */
  applicableTargets: IntelTargetType[];
  /** Requires a resolved domain to run */
  requiresDomain?: boolean;
};

export type ToolRunStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';

export type ToolRunResult = {
  toolId: OsintToolId;
  status: ToolRunStatus;
  startedAt: string;
  finishedAt?: string;
  summary?: string;
  data?: string;
  error?: string;
};

export type AgentPlanStep = {
  toolId: OsintToolId;
  reason: string;
  params?: Record<string, string>;
};

export type AgentPlan = {
  focusAreas: string[];
  steps: AgentPlanStep[];
  notes?: string;
};

export type IntelCaseStatus = 'draft' | 'planning' | 'running' | 'synthesizing' | 'complete' | 'error';

export type IntelCase = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: IntelCaseStatus;
  target: IntelTarget;
  enabledTools: OsintToolId[];
  agentProvider?: string;
  agentModel?: string;
  plan?: AgentPlan;
  toolResults: ToolRunResult[];
  rawDump?: string;
  aiBrief?: string;
  error?: string;
};

export type AgentProgressEvent =
  | { type: 'status'; status: IntelCaseStatus; message: string }
  | { type: 'plan'; plan: AgentPlan }
  | { type: 'tool_start'; toolId: OsintToolId }
  | { type: 'tool_done'; result: ToolRunResult }
  | { type: 'brief'; brief: string; rawDump: string }
  | { type: 'error'; message: string };
