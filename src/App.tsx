import { useState } from "react";
import { ChapterProgressPanel } from "./components/ChapterProgressPanel";
import { DraftEditor } from "./components/DraftEditor";
import { ExportDialog } from "./components/ExportDialog";
import { HeroBanner } from "./components/HeroBanner";
import { ProjectPanel } from "./components/ProjectPanel";
import { QualityPanel } from "./components/QualityPanel";
import { RiskPanel } from "./components/RiskPanel";
import { SystemPanelDialog, type SystemPanelKind } from "./components/SystemPanelDialog";
import { TopNav } from "./components/TopNav";
import { mockData } from "./data/mockData";
import { generateCompactSection, readCodexWorkspaceResult } from "./services/runnerApi";
import type {
  RunnerDisplayMode,
  RunnerProvider,
  RunnerRunMode,
  RunnerTaskMode,
  RunnerTaskState,
} from "./types/runner";
import type { WorkspaceTool } from "./types/workspace";
import { downloadMarkdown } from "./utils/download";

const apiConfig = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4.1-mini",
  maxOutputTokens: 1000,
  temperature: 0.4,
};

function resolveRunMode(displayMode: RunnerDisplayMode): RunnerRunMode {
  return displayMode === "direct_forge" ? "api_run" : "codex_workspace";
}

function resolveMode(displayMode: RunnerDisplayMode): RunnerTaskMode {
  return displayMode === "agent_pack" ? "subsection_batch" : "compact_section";
}

function resolveProvider(displayMode: RunnerDisplayMode): RunnerProvider {
  return displayMode === "direct_forge" ? "local_openai" : "local_codex";
}

export default function App() {
  const [openTools, setOpenTools] = useState<WorkspaceTool[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [systemPanel, setSystemPanel] = useState<SystemPanelKind | null>(null);
  const [runnerTask, setRunnerTask] = useState<RunnerTaskState>({
    status: "idle",
    selectedSectionId: "5.1",
    selectedProvider: "local_codex",
    selectedMode: "subsection_batch",
    selectedRunMode: "codex_workspace",
    selectedDisplayMode: "agent_pack",
  });

  const leftTools = openTools.filter((tool) => tool === "project" || tool === "quality");
  const rightTools = openTools.filter((tool) => tool === "chapters" || tool === "risks");
  const workspaceClassName = [
    "workspace-grid",
    leftTools.length > 0 ? "has-left" : "",
    rightTools.length > 0 ? "has-right" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const selectedSection = mockData.chapters.find((chapter) => chapter.id === runnerTask.selectedSectionId);
  const selectedSectionLabel = selectedSection ? `${selectedSection.id} ${selectedSection.title}` : "未选择章节";

  function openTool(tool: WorkspaceTool) {
    setOpenTools((tools) => (tools.includes(tool) ? tools : [...tools, tool]));
  }

  function closeTool(tool: WorkspaceTool) {
    setOpenTools((tools) => tools.filter((item) => item !== tool));
  }

  function selectSection(sectionId: string) {
    setRunnerTask((task) => ({
      status: "idle",
      selectedSectionId: sectionId,
      selectedProvider: task.selectedProvider,
      selectedMode: task.selectedMode,
      selectedRunMode: task.selectedRunMode,
      selectedDisplayMode: task.selectedDisplayMode,
    }));
  }

  function selectDisplayMode(displayMode: RunnerDisplayMode) {
    const provider = resolveProvider(displayMode);
    const runMode = resolveRunMode(displayMode);
    setRunnerTask((task) => ({
      status: "idle",
      selectedSectionId: task.selectedSectionId,
      selectedProvider: provider,
      selectedMode: resolveMode(displayMode),
      selectedRunMode: runMode,
      selectedDisplayMode: displayMode,
    }));
  }

  async function generateSelectedSection() {
    const selectedSection = mockData.chapters.find((chapter) => chapter.id === runnerTask.selectedSectionId);
    const selectedDisplayMode = runnerTask.selectedDisplayMode ?? "agent_pack";
    const selectedRunMode = resolveRunMode(selectedDisplayMode);
    const selectedProvider = resolveProvider(selectedDisplayMode);
    const selectedMode = resolveMode(selectedDisplayMode);

    if (!selectedSection) {
      setRunnerTask((task) => ({
        ...task,
        status: "failed",
        error: "未找到所选章节，无法生成草稿。",
      }));
      return;
    }

    if (selectedDisplayMode === "direct_forge") {
      const confirmed = window.confirm(
        "本次将调用真实 API，可能产生费用。是否继续？",
      );
      if (!confirmed) {
        return;
      }
    }

    setRunnerTask({
      status: "running",
      selectedSectionId: selectedSection.id,
      selectedProvider,
      selectedMode,
      selectedRunMode,
      selectedDisplayMode,
    });

    try {
      const result = await generateCompactSection({
        projectId: mockData.project.id,
        sectionId: selectedSection.id,
        sectionTitle: selectedSection.title,
        mode: selectedMode,
        runMode: selectedRunMode,
        displayMode: selectedDisplayMode,
        skillProfile: "current_candidate",
        provider: selectedProvider,
        ...apiConfig,
      });

      setRunnerTask({
        status: "success",
        selectedSectionId: selectedSection.id,
        selectedProvider,
        selectedMode,
        selectedRunMode,
        selectedDisplayMode,
        result,
      });
    } catch (error) {
      setRunnerTask({
        status: "failed",
        selectedSectionId: selectedSection.id,
        selectedProvider,
        selectedMode,
        selectedRunMode,
        selectedDisplayMode,
        error: error instanceof Error ? error.message : "生成失败，请稍后重试。",
      });
    }
  }

  function downloadRunnerMarkdown() {
    if (!runnerTask.result) {
      return;
    }

    downloadMarkdown(runnerTask.result.fileName, runnerTask.result.markdown);
    setIsExportOpen(false);
  }

  async function copyAgentInstruction() {
    const result = runnerTask.result;
    if (!result?.runDir) {
      return;
    }

    const absoluteInstructionPath =
      result.files?.codexInstructionsAbsolute ??
      (result.absoluteRunDir ? `${result.absoluteRunDir}\\codex_instructions.md` : "");
    const relativeInstructionPath = result.files?.codexInstructions ?? `${result.runDir}/codex_instructions.md`;

    const instruction = `请读取并执行：
${absoluteInstructionPath || relativeInstructionPath}

如果无法访问绝对路径，请在 BIDFORGE 项目根目录读取：
${relativeInstructionPath}

输出要求：写入 draft.md；若逐小节生成，写入 subsection_drafts/ 后合并 draft.md。`;

    try {
      await navigator.clipboard.writeText(instruction);
      setRunnerTask((task) => ({
        ...task,
        result: task.result
          ? {
              ...task.result,
              warning: "已复制 Agent 指令。请在 Codex、Claude Code、Cursor 等外部 Agent 中执行，完成后点击“读取结果”。",
            }
          : task.result,
      }));
    } catch {
      setRunnerTask((task) => ({
        ...task,
        status: "failed",
        error: "复制失败，请手动复制 run 路径和 codex_instructions.md。",
      }));
    }
  }

  async function readAgentDraft() {
    const result = runnerTask.result;
    if (!result?.runDir) {
      return;
    }

    try {
      const codexResult = await readCodexWorkspaceResult(result.runDir);
      const warning =
        codexResult.resultSource === "subsection_drafts"
          ? `已从 subsection_drafts/ 读取并合并 ${codexResult.subsectionDraftCount ?? codexResult.subsectionDrafts.length} 个小节结果。`
          : `已读取 Agent 结果：${codexResult.fileName}（${codexResult.draftSize} bytes）。`;

      setRunnerTask((task) => ({
        ...task,
        status: "success",
        result: task.result
          ? {
              ...task.result,
              markdown: codexResult.markdown,
              fileName: codexResult.fileName,
              warning,
            }
          : task.result,
        error: undefined,
      }));
    } catch (error) {
      setRunnerTask((task) => ({
        ...task,
        status: "failed",
        error: error instanceof Error ? error.message : "读取 Agent 结果失败。",
      }));
    }
  }

  return (
    <main className="app-shell">
      <TopNav date={mockData.statusBar.date} onOpenSystemPanel={setSystemPanel} time={mockData.statusBar.time} />
      <HeroBanner activeTools={openTools} onOpenExport={() => setIsExportOpen(true)} onOpenTool={openTool} />

      <section className={workspaceClassName} aria-label="BIDFORGE 首页工作台">
        {leftTools.length > 0 ? (
          <aside className="workspace-side workspace-left" style={{ gridTemplateRows: `repeat(${leftTools.length}, minmax(0, 1fr))` }}>
            {leftTools.includes("project") ? <ProjectPanel onClose={() => closeTool("project")} project={mockData.project} /> : null}
            {leftTools.includes("quality") ? <QualityPanel onClose={() => closeTool("quality")} quality={mockData.quality} /> : null}
          </aside>
        ) : null}

        <div className="workspace-draft">
          <DraftEditor
            chapters={mockData.chapters}
            draft={mockData.draft}
            onCopyAgentInstruction={copyAgentInstruction}
            onGenerate={generateSelectedSection}
            onReadAgentResult={readAgentDraft}
            onSelectDisplayMode={selectDisplayMode}
            onSelectSection={selectSection}
            selectedDisplayMode={runnerTask.selectedDisplayMode ?? "agent_pack"}
            selectedProvider={runnerTask.selectedProvider}
            selectedRunMode={runnerTask.selectedRunMode ?? "codex_workspace"}
            selectedSectionId={runnerTask.selectedSectionId}
            taskState={runnerTask}
          />
        </div>

        {rightTools.length > 0 ? (
          <aside className="workspace-side workspace-right" style={{ gridTemplateRows: `repeat(${rightTools.length}, minmax(0, 1fr))` }}>
            {rightTools.includes("chapters") ? (
              <ChapterProgressPanel
                chapters={mockData.chapters}
                onClose={() => closeTool("chapters")}
                onSelectSection={selectSection}
                selectedSectionId={runnerTask.selectedSectionId}
                taskStatus={runnerTask.status}
              />
            ) : null}
            {rightTools.includes("risks") ? <RiskPanel onClose={() => closeTool("risks")} risks={mockData.risks} /> : null}
          </aside>
        ) : null}
      </section>

      {systemPanel ? <SystemPanelDialog kind={systemPanel} onClose={() => setSystemPanel(null)} /> : null}
      {isExportOpen ? (
        <ExportDialog
          currentSectionLabel={selectedSectionLabel}
          onClose={() => setIsExportOpen(false)}
          onExportMarkdown={downloadRunnerMarkdown}
          result={runnerTask.result}
          taskStatus={runnerTask.status}
        />
      ) : null}
    </main>
  );
}
