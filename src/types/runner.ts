export type RunnerTaskStatus = "idle" | "running" | "success" | "failed";
export type RunnerProvider = "mock" | "local_codex" | "local_openai";
export type RunnerTaskMode = "compact_section" | "subsection_batch";
export type RunnerRunMode = "mock_run" | "dry_run" | "api_run" | "codex_workspace";
export type RunnerDisplayMode = "direct_forge" | "agent_pack";

export interface RunnerTaskInput {
  projectId: string;
  sectionId: string;
  sectionTitle: string;
  mode: RunnerTaskMode;
  runMode: RunnerRunMode;
  displayMode?: RunnerDisplayMode;
  skillProfile: "current_candidate";
  provider?: RunnerProvider;
  subsectionLimit?: number;
  baseUrl?: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  materialsConfirmed?: boolean;
  materialsConfirmedAt?: string | null;
}

export interface RunnerTaskResult {
  taskId: string;
  status: "success";
  markdown: string;
  fileName: string;
  createdAt: string;
  runnerMode?: "local_api" | "frontend_mock";
  warning?: string;
  runDir?: string;
  absoluteRunDir?: string;
  files?: {
    task: string;
    manifest?: string;
    prompt: string;
    generationTrace?: string;
    codexInstructions?: string;
    codexInstructionsAbsolute?: string;
    draft: string;
    auditor: string;
    subsectionDrafts?: string;
    subsectionPrompts?: string;
  };
  skillManifest?: {
    writingSkill: string;
    expansionSkill: string;
    production: false;
    productionRc: false;
    loadedAt?: string;
  };
  provider?: string;
  runMode?: RunnerRunMode;
  displayMode?: RunnerDisplayMode;
  providerName?: string;
  modelName?: string;
  isRealAI?: boolean;
  isApiRun?: boolean;
  isDryRun?: boolean;
  isMockRun?: boolean;
  isCodexWorkspace?: boolean;
  isTaskPack?: boolean;
  materialsConfirmed?: boolean;
  materialsConfirmedAt?: string | null;
  apiCalled?: boolean;
  subsectionSummary?: {
    enabled?: boolean;
    targetCount?: number;
    attemptedCount?: number;
    successCount?: number;
    failedCount?: number;
    subsectionDraftsWritten?: boolean;
    subsectionPromptsWritten?: boolean;
    draftMerged?: boolean;
  };
  maxOutputTokens?: number | null;
  temperature?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  estimatedCost?: number | null;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  manifestSummary: {
    writingSkill: string;
    expansionSkill: string;
    production: false;
    productionRc: false;
  };
}

export interface RunnerReadResult {
  status: "success";
  runDir: string;
  markdown: string;
  fileName: string;
  resultSource?: "draft.md" | "subsection_drafts";
  draftSize: number;
  subsectionDrafts: string[];
  subsectionDraftCount?: number;
  readAt: string;
}

export interface RunnerTaskState {
  status: RunnerTaskStatus;
  selectedSectionId: string;
  selectedProvider: RunnerProvider;
  selectedMode?: RunnerTaskMode;
  selectedRunMode?: RunnerRunMode;
  selectedDisplayMode?: RunnerDisplayMode;
  result?: RunnerTaskResult;
  error?: string;
}
