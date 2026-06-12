import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  ClipboardCopy,
  Italic,
  Loader2,
  PlayCircle,
  RefreshCw,
  SpellCheck,
  Underline,
} from "lucide-react";
import type { ChapterProgress } from "../data/mockData";
import type {
  RunnerDisplayMode,
  RunnerProvider,
  RunnerRunMode,
  RunnerTaskMode,
  RunnerTaskResult,
  RunnerTaskState,
} from "../types/runner";
import { RetroWindow } from "./RetroWindow";

interface DraftEditorProps {
  draft: {
    section: string;
    paragraphs: string[];
    wordCount: string;
    autosaveTime: string;
    version: string;
    spellStatus: string;
  };
  chapters: ChapterProgress[];
  selectedDisplayMode: RunnerDisplayMode;
  selectedProvider: RunnerProvider;
  selectedRunMode: RunnerRunMode;
  selectedSectionId: string;
  taskState: RunnerTaskState;
  onSelectDisplayMode: (displayMode: RunnerDisplayMode) => void;
  onSelectSection: (sectionId: string) => void;
  onCopyAgentInstruction: () => void;
  onGenerate: () => void;
  onReadAgentResult: () => void;
}

const toolbarButtons = [
  { label: "加粗", icon: <Bold size={17} /> },
  { label: "斜体", icon: <Italic size={17} /> },
  { label: "下划线", icon: <Underline size={17} /> },
  { label: "左对齐", icon: <AlignLeft size={17} /> },
  { label: "居中", icon: <AlignCenter size={17} /> },
  { label: "右对齐", icon: <AlignRight size={17} /> },
  { label: "拼写检查", icon: <SpellCheck size={17} /> },
];

const taskLabels: Record<RunnerTaskState["status"], string> = {
  idle: "待生成",
  running: "正在生成……",
  success: "生成完成",
  failed: "生成失败",
};

const providerLabels: Record<RunnerProvider, string> = {
  mock: "Mock",
  local_codex: "Local Codex",
  local_openai: "OpenAI-Compatible API",
};

const displayModeLabels: Record<RunnerDisplayMode, string> = {
  direct_forge: "Direct Forge",
  agent_pack: "Agent Pack",
};

const modeLabels: Record<RunnerTaskMode, string> = {
  compact_section: "精简稿",
  subsection_batch: "逐小节",
};

const defaultManifest = {
  writingSkill: "bidforge-writing-candidate-v0.3",
  expansionSkill: "bidforge-expansion-candidate-v0.3",
  production: false,
  productionRc: false,
};

function isAgentPack(displayMode: RunnerDisplayMode, taskState: RunnerTaskState) {
  return (taskState.result?.displayMode ?? displayMode) === "agent_pack";
}

function getAgentPackFiles(result?: RunnerTaskResult) {
  if (!result?.files) {
    return [];
  }

  const files = [
    { label: "task.json", path: result.files.task },
    { label: "manifest", path: result.files.manifest },
    { label: "prompt.md", path: result.files.prompt },
    { label: "trace", path: result.files.generationTrace },
    { label: "instructions", path: result.files.codexInstructions },
    { label: "subsection_prompts/", path: result.files.subsectionPrompts },
    { label: "draft.md", path: result.files.draft },
  ];

  return files.filter((file): file is { label: string; path: string } => Boolean(file.path));
}

export function DraftEditor({
  chapters,
  draft,
  onCopyAgentInstruction,
  onGenerate,
  onReadAgentResult,
  onSelectDisplayMode,
  onSelectSection,
  selectedDisplayMode,
  selectedProvider,
  selectedRunMode,
  selectedSectionId,
  taskState,
}: DraftEditorProps) {
  const isRunning = taskState.status === "running";
  const selectedSection = chapters.find((chapter) => chapter.id === selectedSectionId);
  const manifest = taskState.result?.manifestSummary ?? defaultManifest;
  const providerName = taskState.result?.providerName ?? providerLabels[selectedProvider];
  const selectedMode = taskState.selectedMode ?? (selectedDisplayMode === "agent_pack" ? "subsection_batch" : "compact_section");
  const currentIsAgentPack = isAgentPack(selectedDisplayMode, taskState);
  const generateLabel = selectedDisplayMode === "direct_forge" ? "开始生成" : "生成任务包";
  const runningLabel = selectedDisplayMode === "direct_forge" ? "正在准备 Direct Forge……" : "正在生成任务包……";
  const agentPackFiles = getAgentPackFiles(taskState.result);
  const subsectionPromptCount = taskState.result?.subsectionSummary?.attemptedCount ?? taskState.result?.subsectionSummary?.targetCount;

  return (
    <RetroWindow title="当前草稿（Current Draft）" className="draft-editor" bodyClassName="p-0">
      <div className="editor-toolbar">
        <select
          aria-label="章节选择"
          className="runner-section-select"
          disabled={isRunning}
          onChange={(event) => onSelectSection(event.target.value)}
          value={selectedSectionId}
        >
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.id} {chapter.title}
            </option>
          ))}
        </select>
        <select aria-label="字体">
          <option>宋体</option>
        </select>
        <select aria-label="字号">
          <option>10.5</option>
        </select>
        <div className="editor-tools">
          {toolbarButtons.map((button) => (
            <button aria-label={button.label} className="editor-icon-button" key={button.label} type="button">
              {button.icon}
            </button>
          ))}
        </div>
        <div className="runner-actions">
          <label className="runner-provider-control runner-display-mode-control">
            <span>模式</span>
            <select
              aria-label="前台模式"
              disabled={isRunning}
              onChange={(event) => onSelectDisplayMode(event.target.value as RunnerDisplayMode)}
              value={selectedDisplayMode}
            >
              <option value="direct_forge">Direct Forge</option>
              <option value="agent_pack">Agent Pack</option>
            </select>
          </label>
          <button className="editor-action-button primary" disabled={isRunning} onClick={onGenerate} type="button">
            {isRunning ? <Loader2 className="spin" size={17} /> : <PlayCircle size={17} />}
            <span>{isRunning ? runningLabel : generateLabel}</span>
          </button>
        </div>
      </div>

      <div className="runner-manifest">
        <strong>当前使用 Candidate Skill</strong>
        <span>Writing v0.3：{manifest.writingSkill}</span>
        <span>Expansion v0.3：{manifest.expansionSkill}</span>
        <span>Provider：{providerName}</span>
        {taskState.result?.modelName ? <span>Model：{taskState.result.modelName}</span> : null}
        {taskState.result?.skillManifest ? <span>已加载 Skill Manifest</span> : null}
        <span>{manifest.production ? "已进入 Production" : "未进入 Production"}</span>
        <span>{manifest.productionRc ? "已进入 Production RC" : "未进入 Production RC"}</span>
      </div>

      <article className="draft-paper">
        {taskState.status === "failed" ? <div className="runner-error">{taskState.error ?? "生成失败，请稍后重试。"}</div> : null}
        {taskState.result?.warning ? <div className="runner-warning">{taskState.result.warning}</div> : null}
        {taskState.result?.runDir ? (
          <section className="codex-workspace-panel" aria-label="Agent Pack 操作区">
            <div className="agent-pack-panel-main">
              <strong>{currentIsAgentPack ? "Agent Pack" : "Run 文件"}</strong>
              <span>当前 run 路径：{taskState.result.runDir}</span>
              {taskState.result.absoluteRunDir ? <span>本机绝对路径：{taskState.result.absoluteRunDir}</span> : null}
              {currentIsAgentPack && agentPackFiles.length > 0 ? (
                <div className="agent-pack-files" aria-label="任务包文件">
                  {agentPackFiles.map((file) => (
                    <span key={file.label} title={file.path}>
                      {file.label}
                    </span>
                  ))}
                  {subsectionPromptCount ? <span>小节 prompts：{subsectionPromptCount}</span> : null}
                </div>
              ) : null}
            </div>
            {currentIsAgentPack ? (
              <div className="codex-workspace-actions">
                <button className="editor-action-button" onClick={onCopyAgentInstruction} type="button">
                  <ClipboardCopy size={16} />
                  <span>复制 Agent 指令</span>
                </button>
                <button className="editor-action-button primary" onClick={onReadAgentResult} type="button">
                  <RefreshCw size={16} />
                  <span>读取结果</span>
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
        {taskState.result ? (
          <pre className="markdown-preview">{taskState.result.markdown}</pre>
        ) : (
          <>
            <h2>{selectedSection ? `${selectedSection.id} ${selectedSection.title}` : draft.section}</h2>
            {draft.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </>
        )}
      </article>

      <footer className="editor-statusbar">
        <span>当前章节：{selectedSection ? `${selectedSection.id} ${selectedSection.title}` : "未选择"}</span>
        <span className="status-dot-text">任务状态：{taskLabels[taskState.status]}</span>
        <span>前台模式：{displayModeLabels[selectedDisplayMode]}</span>
        <span>生成结构：{modeLabels[selectedMode]}</span>
        <span>Provider：{providerLabels[selectedProvider]}</span>
        <span>版本：{taskState.result ? taskState.result.modelName ?? "local-runner" : draft.version}</span>
        <span className="ml-auto inline-flex items-center gap-1">
          Candidate 环境 <CheckSquare size={16} />
        </span>
      </footer>
    </RetroWindow>
  );
}
