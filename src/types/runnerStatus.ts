export interface ProviderStatus {
  id: "mock" | "local_codex" | "local_openai" | string;
  name: string;
  status: "available" | "placeholder" | string;
  realAi: boolean;
}

export interface LatestRunSummary {
  runDir: string;
  files: string[];
  createdAt: string;
  sectionId: string;
  sectionTitle: string;
  provider: string;
}

export interface RunnerStatus {
  status: "online";
  port: number;
  providers: ProviderStatus[];
  latestRun: LatestRunSummary | null;
  production: false;
  productionRc: false;
  realAi: false;
  parseSourceFiles?: false;
}
