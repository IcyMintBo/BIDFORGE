import { FilePlus2, PlugZap, ServerCog, Settings2, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import {
  checkCodexProvider,
  fetchOpenAiProviderModels,
  getCloudProviderStatus,
  getOpenAiProviderStatus,
  getProviderConfigStatus,
  saveOpenAiProviderConfig,
  testOpenAiProviderConnection,
} from "../services/providerConfigApi";
import { getRunnerStatus } from "../services/runnerStatusApi";
import type {
  CloudProviderStatus,
  CodexProviderCheck,
  OpenAiProviderModel,
  OpenAiProviderStatus,
  ProviderConfigId,
  ProviderConfigStatus,
} from "../types/providerConfig";
import type { ProviderStatus, RunnerStatus } from "../types/runnerStatus";

export type SystemPanelKind = "new-task" | "api" | "runner" | "settings" | "compliance";

interface SystemPanelDialogProps {
  kind: SystemPanelKind;
  onClose: () => void;
}

interface PanelSection {
  title: string;
  items: string[];
}

interface PanelContent {
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  sections: PanelSection[];
  note?: string;
}

type RunnerStatusState =
  | { status: "idle" | "loading" }
  | { status: "success"; data: RunnerStatus }
  | { status: "failed"; error: string };

type ProviderConfigState =
  | { status: "idle" | "loading" }
  | {
      status: "success";
      data: {
        config: ProviderConfigStatus;
        codex: CodexProviderCheck;
        openai: OpenAiProviderStatus;
        cloud: CloudProviderStatus;
      };
    }
  | { status: "failed"; error: string };

interface OpenAiConfigForm {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxOutputTokens: string;
  temperature: string;
}

const runnerOfflineMessage = "本地 Runner 未连接，请确认已运行 npm run server。";
const providerConfigOfflineMessage = "Provider 配置状态读取失败，请确认已运行 npm run server。";

const panelContent: Record<SystemPanelKind, PanelContent> = {
  "new-task": {
    title: "新建任务",
    eyebrow: "MVP Task Center",
    description: "当前入口用于展示 BIDFORGE 后续任务类型，本阶段不创建真实多任务队列。",
    icon: <FilePlus2 size={29} />,
    sections: [
      {
        title: "新建任务类型",
        items: ["章节精简稿", "章节扩写", "废标风险审查", "合规检查"],
      },
      {
        title: "当前 MVP 已支持",
        items: ["章节精简稿 Mock / 本地 Runner 任务", "Provider 可选择 Mock / Codex / OpenAI"],
      },
    ],
    note: "其他任务类型后续接入，目前不进入 Production 或 Production RC。",
  },
  api: {
    title: "API 接口",
    eyebrow: "Provider 配置中心",
    description: "在这里选择和管理 BIDFORGE Local 使用的 AI Provider。",
    icon: <PlugZap size={29} />,
    sections: [],
  },
  runner: {
    title: "本地 Runner",
    eyebrow: "Local Runner",
    description: "本地 Runner 面板只读取状态，不触发生成任务。",
    icon: <ServerCog size={29} />,
    sections: [],
  },
  settings: {
    title: "设置",
    eyebrow: "Current Defaults",
    description: "本阶段仅展示默认配置，不做真实设置保存。",
    icon: <Settings2 size={29} />,
    sections: [
      {
        title: "当前 Candidate Skill",
        items: ["Writing Candidate v0.3", "Expansion Candidate v0.3"],
      },
      {
        title: "默认生成与导出",
        items: ["默认生成模式：compact_section", "默认导出：Markdown"],
      },
      {
        title: "发布状态",
        items: ["Production：否", "Production RC：否"],
      },
    ],
  },
  compliance: {
    title: "合规检查",
    eyebrow: "Compliance Preview",
    description: "合规检查暂未接入完整自动审查，当前仅展示后续检查方向。",
    icon: <ShieldCheck size={29} />,
    sections: [
      {
        title: "当前可检查方向",
        items: [
          "是否进入 Production / RC",
          "是否存在未接真实 AI 却误标成功",
          "是否存在无依据事实",
          "是否存在专业边界混乱",
          "是否存在导出前风险",
        ],
      },
      {
        title: "当前阶段",
        items: ["不做真实自动审查", "不做 Production / Production RC 判定升级"],
      },
    ],
  },
};

const providerStatusLabels: Record<string, string> = {
  available: "可用",
  placeholder: "占位，暂未接入",
  configured: "已配置",
  configured_placeholder: "已配置，待接入",
  not_configured: "未配置",
  future: "未来占位",
};

function yesNo(value: boolean) {
  return value ? "是" : "否";
}

function providerStatusLabel(provider: ProviderStatus) {
  return providerStatusLabels[provider.status] ?? provider.status;
}

function renderSelectedProviderPanel(
  selectedProvider: ProviderConfigId,
  providerData: ProviderConfigState & { status: "success" },
  onCheckCodex: () => void,
  codexChecking: boolean,
  openAiForm: OpenAiConfigForm,
  onOpenAiFormChange: (patch: Partial<OpenAiConfigForm>) => void,
  onSaveOpenAiConfig: () => void,
  openAiSaving: boolean,
  openAiSaveMessage: string,
  openAiModels: OpenAiProviderModel[],
  onFetchOpenAiModels: () => void,
  openAiModelsLoading: boolean,
  openAiModelsMessage: string,
  onTestOpenAiConnection: () => void,
  openAiTesting: boolean,
  openAiTestMessage: string,
) {
  const { cloud, codex, openai } = providerData.data;

  if (selectedProvider === "mock") {
    return (
      <article className="system-panel-card provider-config-detail-card">
        <h3>Mock Provider</h3>
        <ul>
          <li>用于开发调试和界面演示。</li>
          <li>不调用真实 AI。</li>
          <li>无需配置。</li>
        </ul>
        <p className="provider-config-note">适合测试前后端通信、Runner 落盘和页面展示。</p>
      </article>
    );
  }

  if (selectedProvider === "local_codex") {
    return (
      <article className="system-panel-card provider-config-detail-card">
        <h3>Local Codex Provider</h3>
        <p className="provider-config-body">
          使用当前电脑上已安装并登录的 Codex CLI。BIDFORGE 不保存 Codex 账号，也不管理 Codex 登录状态。
        </p>
        <div className="provider-config-fields">
          <div>
            <span>Codex CLI 状态</span>
            <strong>{codex.detected ? "已检测到" : "未连接"}</strong>
          </div>
          <div>
            <span>Codex 版本</span>
            <strong>{codex.version || "未检测到"}</strong>
          </div>
          <div>
            <span>是否支持非交互执行</span>
            <strong>{codex.supportsNonInteractive ? "支持" : "待确认"}</strong>
          </div>
          <div>
            <span>工作目录</span>
            <strong>BIDFORGE 项目根目录</strong>
          </div>
          <div>
            <span>当前执行超时</span>
            <strong>{codex.executionTimeoutSeconds ?? 600} 秒（预设）</strong>
          </div>
        </div>
        <div className="provider-config-actions">
          <button className="provider-config-action-button" disabled={codexChecking} onClick={onCheckCodex} type="button">
            {codexChecking ? "检测中……" : "检测 Codex CLI"}
          </button>
        </div>
        {!codex.detected ? <p className="provider-config-error">{codex.message}</p> : <p className="provider-config-note">{codex.message}</p>}
      </article>
    );
  }

  if (selectedProvider === "local_openai" || selectedProvider === "openai_compatible") {
    const feedbackMessage =
      [openAiSaveMessage, openAiModelsMessage, openAiTestMessage].filter(Boolean).join(" ｜ ") || openai.message;
    const feedbackIsError = [openAiSaveMessage, openAiModelsMessage, openAiTestMessage].some(
      (message) => message.includes("失败") || message.includes("HTTP") || message.includes("未配置") || message.includes("超时"),
    );

    return (
      <article className="system-panel-card provider-config-detail-card">
        <h3>OpenAI-Compatible API Provider</h3>
        <p className="provider-config-body">使用当前电脑本地配置的 OpenAI-compatible API Key，用于 Direct Forge 非流式生成。</p>
        <div className="provider-config-fields">
          <div>
            <span>API Key 状态</span>
            <strong>{openai.keyConfigured ? "已配置" : "未配置"}</strong>
          </div>
          <label>
            <span>Base URL</span>
            <input
              autoComplete="off"
              name="bidforge-api-base-url"
              onChange={(event) => onOpenAiFormChange({ baseUrl: event.target.value })}
              placeholder="例如 https://api.xxx.com/v1"
              type="text"
              value={openAiForm.baseUrl}
            />
          </label>
          <label>
            <span>API Key</span>
            <input
              autoComplete="new-password"
              name="bidforge-api-key"
              onChange={(event) => onOpenAiFormChange({ apiKey: event.target.value })}
              placeholder={openai.keyConfigured ? "留空则沿用当前 Key" : "粘贴你的本地 API Key"}
              type="password"
              value={openAiForm.apiKey}
            />
          </label>
          <label>
            <span>Model</span>
            {openAiModels.length > 0 ? (
              <select onChange={(event) => onOpenAiFormChange({ model: event.target.value })} value={openAiForm.model}>
                {openAiModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                autoComplete="off"
                name="bidforge-api-model"
                onChange={(event) => onOpenAiFormChange({ model: event.target.value })}
                placeholder="先获取模型列表，或手动填写模型名"
                type="text"
                value={openAiForm.model}
              />
            )}
          </label>
        </div>
        <div className="provider-config-actions">
          <div className="provider-config-action-buttons">
            <button className="provider-config-action-button" disabled={openAiModelsLoading} onClick={onFetchOpenAiModels} type="button">
              {openAiModelsLoading ? "获取中……" : "获取模型列表"}
            </button>
            <button className="provider-config-action-button" disabled={openAiTesting} onClick={onTestOpenAiConnection} type="button">
              {openAiTesting ? "测试中……" : "测试连接"}
            </button>
            <button className="provider-config-action-button" disabled={openAiSaving} onClick={onSaveOpenAiConfig} type="button">
              {openAiSaving ? "保存中……" : "保存本地配置"}
            </button>
          </div>
          <p className={`provider-config-feedback ${feedbackIsError ? "error" : ""}`}>{feedbackMessage}</p>
        </div>
        <div className="provider-config-advanced">
          <strong>
            高级设置 <span>（看不懂就不改）</span>
          </strong>
          <div className="provider-config-fields provider-config-advanced-fields">
            <label>
              <span>max_output_tokens</span>
              <input
                min={1}
                onChange={(event) => onOpenAiFormChange({ maxOutputTokens: event.target.value })}
                type="number"
                value={openAiForm.maxOutputTokens}
              />
            </label>
            <label>
              <span>temperature</span>
              <input
                max={2}
                min={0}
                onChange={(event) => onOpenAiFormChange({ temperature: event.target.value })}
                step={0.1}
                type="number"
                value={openAiForm.temperature}
              />
            </label>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="system-panel-card provider-config-detail-card">
      <h3>Cloud API Provider</h3>
      <p className="provider-config-body">未来用于云端统一服务，当前暂未开放。</p>
      <ul>
        <li>当前状态：暂未开放。</li>
        <li>当前仅保留入口，不需要配置。</li>
        <li>不影响本地 Provider 使用。</li>
      </ul>
      <p className="provider-config-note">{cloud.message}</p>
    </article>
  );
}

function renderRunnerStatusContent(runnerState: RunnerStatusState) {
  const isOnline = runnerState.status === "success";
  const latestRun = isOnline ? runnerState.data.latestRun : null;
  const providers = isOnline ? runnerState.data.providers : [];

  return (
    <div className="system-panel-sections runner-status-sections">
      <article className="system-panel-card">
        <h3>Runner 状态</h3>
        <ul>
          <li>状态：{runnerState.status === "loading" ? "读取中……" : isOnline ? "在线" : "未连接"}</li>
          <li>地址：http://localhost:8787</li>
          <li>Health：/api/health</li>
          <li>Status：/api/runner/status</li>
        </ul>
        {runnerState.status === "failed" ? <p className="runner-status-error">{runnerState.error}</p> : null}
      </article>

      <article className="system-panel-card">
        <h3>Provider 状态</h3>
        {providers.length > 0 ? (
          <ul>
            {providers.map((provider) => (
              <li key={provider.id}>
                {provider.name}：{providerStatusLabel(provider)}，真实 AI：{yesNo(provider.realAi)}
              </li>
            ))}
          </ul>
        ) : (
          <ul>
            <li>Mock：可用</li>
            <li>Codex：占位，暂未接入</li>
            <li>OpenAI：占位，暂未接入</li>
          </ul>
        )}
      </article>

      <article className="system-panel-card runner-latest-run-card">
        <h3>最新 run</h3>
        {latestRun ? (
          <>
            <ul>
              <li>run 目录：{latestRun.runDir}</li>
              <li>
                章节：{latestRun.sectionId} {latestRun.sectionTitle}
              </li>
              <li>provider：{latestRun.provider}</li>
              <li>createdAt：{latestRun.createdAt}</li>
            </ul>
            <div className="runner-file-list">
              <strong>文件列表</strong>
              <ul>
                {latestRun.files.map((fileName) => (
                  <li key={fileName}>{fileName}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <ul>
            <li>{runnerState.status === "loading" ? "正在读取 latest run……" : "暂无 run 目录"}</li>
          </ul>
        )}
      </article>

      <article className="system-panel-card">
        <h3>阶段边界</h3>
        <ul>
          <li>Direct Forge：需配置本机 API，用户确认后才调用</li>
          <li>Agent Pack：生成任务包，不调用 API</li>
          <li>当前未解析 PDF/DOCX</li>
          <li>当前未进入 Production</li>
          <li>当前未进入 Production RC</li>
        </ul>
      </article>
    </div>
  );
}

function renderProviderConfigContent(
  providerState: ProviderConfigState,
  selectedProvider: ProviderConfigId,
  setSelectedProvider: (providerId: ProviderConfigId) => void,
  onCheckCodex: () => void,
  codexChecking: boolean,
  openAiForm: OpenAiConfigForm,
  onOpenAiFormChange: (patch: Partial<OpenAiConfigForm>) => void,
  onSaveOpenAiConfig: () => void,
  openAiSaving: boolean,
  openAiSaveMessage: string,
  openAiModels: OpenAiProviderModel[],
  onFetchOpenAiModels: () => void,
  openAiModelsLoading: boolean,
  openAiModelsMessage: string,
  onTestOpenAiConnection: () => void,
  openAiTesting: boolean,
  openAiTestMessage: string,
) {
  if (providerState.status !== "success") {
    if (providerState.status === "failed") {
      return (
        <div className="system-panel-sections">
          <article className="system-panel-card provider-config-wide-card">
            <h3>Provider 配置状态</h3>
            <p className="runner-status-error">{providerState.error}</p>
            <ul>
              <li>请确认本地 Runner 已启动。</li>
              <li>Provider 状态暂时无法读取。</li>
              <li>默认 Provider 仍为 Mock</li>
            </ul>
          </article>
        </div>
      );
    }

    return (
      <div className="system-panel-sections">
        <article className="system-panel-card provider-config-wide-card">
          <h3>Provider 配置状态</h3>
          <ul>
            <li>正在读取 Provider 配置中心……</li>
            <li>Direct Forge：读取本机 API 配置后可用</li>
            <li>Agent Pack：无需 API，可生成任务包</li>
          </ul>
        </article>
      </div>
    );
  }

  return (
    <>
      <div className="provider-config-select-row">
        <label htmlFor="provider-config-select">Provider 选择预览</label>
        <select
          id="provider-config-select"
          onChange={(event) => setSelectedProvider(event.target.value as ProviderConfigId)}
          value={selectedProvider}
        >
          <option value="openai_compatible">OpenAI-Compatible API Provider</option>
          <option value="cloud_api">Cloud API Provider</option>
        </select>
      </div>

      <div className="system-panel-sections provider-config-sections">
        {renderSelectedProviderPanel(
          selectedProvider,
          providerState,
          onCheckCodex,
          codexChecking,
          openAiForm,
          onOpenAiFormChange,
          onSaveOpenAiConfig,
          openAiSaving,
          openAiSaveMessage,
          openAiModels,
          onFetchOpenAiModels,
          openAiModelsLoading,
          openAiModelsMessage,
          onTestOpenAiConnection,
          openAiTesting,
          openAiTestMessage,
        )}
      </div>
    </>
  );
}

export function SystemPanelDialog({ kind, onClose }: SystemPanelDialogProps) {
  const content = panelContent[kind];
  const [runnerState, setRunnerState] = useState<RunnerStatusState>({ status: "idle" });
  const [providerState, setProviderState] = useState<ProviderConfigState>({ status: "idle" });
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfigId>("openai_compatible");
  const [codexChecking, setCodexChecking] = useState(false);
  const [openAiForm, setOpenAiForm] = useState<OpenAiConfigForm>({
    baseUrl: "",
    apiKey: "",
    model: "",
    maxOutputTokens: "1000",
    temperature: "0.4",
  });
  const [openAiSaving, setOpenAiSaving] = useState(false);
  const [openAiSaveMessage, setOpenAiSaveMessage] = useState("");
  const [openAiModels, setOpenAiModels] = useState<OpenAiProviderModel[]>([]);
  const [openAiModelsLoading, setOpenAiModelsLoading] = useState(false);
  const [openAiModelsMessage, setOpenAiModelsMessage] = useState("");
  const [openAiTesting, setOpenAiTesting] = useState(false);
  const [openAiTestMessage, setOpenAiTestMessage] = useState("");
  const [dialogOffset, setDialogOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    initialX: number;
    initialY: number;
    startX: number;
    startY: number;
  } | null>(null);

  useEffect(() => {
    if (kind !== "runner") {
      return;
    }

    let active = true;
    setRunnerState({ status: "loading" });

    getRunnerStatus()
      .then((data) => {
        if (active) {
          setRunnerState({ status: "success", data });
        }
      })
      .catch(() => {
        if (active) {
          setRunnerState({ status: "failed", error: runnerOfflineMessage });
        }
      });

    return () => {
      active = false;
    };
  }, [kind]);

  useEffect(() => {
    if (kind !== "api") {
      return;
    }

    let active = true;
    setProviderState({ status: "loading" });

    Promise.all([getProviderConfigStatus(), checkCodexProvider(), getOpenAiProviderStatus(), getCloudProviderStatus()])
      .then(([config, codex, openai, cloud]) => {
        if (active) {
          setProviderState({ status: "success", data: { config, codex, openai, cloud } });
          setOpenAiForm({
            baseUrl: openai.baseUrl,
            apiKey: "",
            model: openai.model,
            maxOutputTokens: String(openai.maxOutputTokens),
            temperature: String(openai.temperature),
          });
          setOpenAiSaveMessage("");
          setOpenAiModels([]);
          setOpenAiModelsMessage("");
          setOpenAiTestMessage("");
        }
      })
      .catch(() => {
        if (active) {
          setProviderState({ status: "failed", error: providerConfigOfflineMessage });
        }
      });

    return () => {
      active = false;
    };
  }, [kind]);

  useEffect(() => {
    if (kind !== "api") {
      setDialogOffset({ x: 0, y: 0 });
      dragStateRef.current = null;
    }
  }, [kind]);

  useEffect(() => {
    if (kind !== "api") {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStateRef.current) {
        return;
      }

      setDialogOffset({
        x: dragStateRef.current.initialX + event.clientX - dragStateRef.current.startX,
        y: dragStateRef.current.initialY + event.clientY - dragStateRef.current.startY,
      });
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [kind]);

  const handleTitlebarMouseDown = (event: ReactMouseEvent<HTMLElement>) => {
    if (kind !== "api" || event.button !== 0) {
      return;
    }

    if (event.target instanceof HTMLElement && event.target.closest("button, input, select, textarea, a")) {
      return;
    }

    dragStateRef.current = {
      initialX: dialogOffset.x,
      initialY: dialogOffset.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    event.preventDefault();
  };

  const handleCheckCodex = () => {
    setCodexChecking(true);

    checkCodexProvider()
      .then((codex) => {
        setProviderState((current) => {
          if (current.status !== "success") {
            return current;
          }

          return {
            status: "success",
            data: {
              ...current.data,
              codex,
            },
          };
        });
      })
      .catch(() => undefined)
      .finally(() => {
        setCodexChecking(false);
      });
  };

  const handleOpenAiFormChange = (patch: Partial<OpenAiConfigForm>) => {
    setOpenAiForm((current) => ({
      ...current,
      ...patch,
    }));
    setOpenAiSaveMessage("");
    setOpenAiTestMessage("");
    if (patch.baseUrl !== undefined || patch.apiKey !== undefined) {
      setOpenAiModels([]);
      setOpenAiModelsMessage("");
    }
  };

  const createOpenAiConfigInput = () => ({
    baseUrl: openAiForm.baseUrl.trim(),
    apiKey: openAiForm.apiKey.trim() || undefined,
    model: openAiForm.model.trim(),
    maxOutputTokens: Number(openAiForm.maxOutputTokens),
    temperature: Number(openAiForm.temperature),
  });

  const handleSaveOpenAiConfig = () => {
    setOpenAiSaving(true);
    setOpenAiSaveMessage("");

    saveOpenAiProviderConfig(createOpenAiConfigInput())
      .then((result) => {
        setOpenAiForm((current) => ({
          ...current,
          apiKey: "",
          baseUrl: result.status.baseUrl,
          model: result.status.model,
          maxOutputTokens: String(result.status.maxOutputTokens),
          temperature: String(result.status.temperature),
        }));
        setOpenAiSaveMessage(result.message);
        setProviderState((current) => {
          if (current.status !== "success") {
            return current;
          }

          return {
            status: "success",
            data: {
              ...current.data,
              openai: result.status,
              config: {
                ...current.data.config,
                providers: current.data.config.providers.map((provider) =>
                  provider.id === "openai_compatible"
                    ? {
                        ...provider,
                        status: result.status.status,
                        configured: result.status.configured,
                        realAi: result.status.realAi,
                        keySource: result.status.keySource,
                        apiConfig: {
                          baseUrl: result.status.baseUrl,
                          model: result.status.model,
                          maxOutputTokens: result.status.maxOutputTokens,
                          temperature: result.status.temperature,
                        },
                      }
                    : provider,
                ),
              },
            },
          };
        });
      })
      .catch((error) => {
        setOpenAiSaveMessage(error instanceof Error ? `保存失败：${error.message}` : "保存失败：Provider 配置接口异常。");
      })
      .finally(() => {
        setOpenAiSaving(false);
      });
  };

  const handleFetchOpenAiModels = () => {
    setOpenAiModelsLoading(true);
    setOpenAiModelsMessage("");
    setOpenAiTestMessage("");

    fetchOpenAiProviderModels(createOpenAiConfigInput())
      .then((result) => {
        setOpenAiModels(result.models);
        setOpenAiModelsMessage(`${result.message}（模型列表获取耗时：${result.durationMs}ms）`);
        setOpenAiForm((current) => {
          if (result.models.some((model) => model.id === current.model)) {
            return current;
          }

          return {
            ...current,
            model: result.models[0]?.id ?? current.model,
          };
        });
      })
      .catch((error) => {
        setOpenAiModels([]);
        setOpenAiModelsMessage(error instanceof Error ? `获取模型失败：${error.message}` : "获取模型失败：接口异常。");
      })
      .finally(() => {
        setOpenAiModelsLoading(false);
      });
  };

  const handleTestOpenAiConnection = () => {
    setOpenAiTesting(true);
    setOpenAiTestMessage("");

    testOpenAiProviderConnection(createOpenAiConfigInput())
      .then((result) => {
        setOpenAiTestMessage(result.message.includes("非空内容") ? "测试成功，模型返回了非空内容。" : "测试成功。");
      })
      .catch((error) => {
        setOpenAiTestMessage(error instanceof Error ? `测试失败：${error.message}` : "测试失败：接口异常。");
      })
      .finally(() => {
        setOpenAiTesting(false);
      });
  };

  return (
    <div className="system-panel-overlay" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="system-panel-title"
        className={`system-panel-dialog${kind === "api" ? " provider-config-dialog" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        style={kind === "api" ? { transform: `translate(${dialogOffset.x}px, ${dialogOffset.y}px)` } : undefined}
      >
        <button aria-label="关闭系统面板" className="system-panel-close" onClick={onClose} type="button">
          <X size={21} strokeWidth={3} />
        </button>

        <header
          className={`system-panel-titlebar${kind === "api" ? " draggable-titlebar" : ""}`}
          onMouseDown={handleTitlebarMouseDown}
        >
          <span className="system-panel-icon">{content.icon}</span>
          <div>
            <small>{content.eyebrow}</small>
            <h2 id="system-panel-title">{content.title}</h2>
          </div>
        </header>

        <p className="system-panel-description">{content.description}</p>

        {kind === "runner" ? (
          renderRunnerStatusContent(runnerState)
        ) : kind === "api" ? (
          renderProviderConfigContent(
            providerState,
            selectedProvider,
            setSelectedProvider,
            handleCheckCodex,
            codexChecking,
            openAiForm,
            handleOpenAiFormChange,
            handleSaveOpenAiConfig,
            openAiSaving,
            openAiSaveMessage,
            openAiModels,
            handleFetchOpenAiModels,
            openAiModelsLoading,
            openAiModelsMessage,
            handleTestOpenAiConnection,
            openAiTesting,
            openAiTestMessage,
          )
        ) : (
          <div className="system-panel-sections">
            {content.sections.map((section) => (
              <article className="system-panel-card" key={section.title}>
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}

        {content.note ? <div className="system-panel-note">{content.note}</div> : null}
      </section>
    </div>
  );
}
