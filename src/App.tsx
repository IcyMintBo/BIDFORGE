import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ChapterProgressPanel } from "./components/ChapterProgressPanel";
import { DirectForgeConfirmDialog } from "./components/DirectForgeConfirmDialog";
import { DraftEditor } from "./components/DraftEditor";
import { ExportDialog } from "./components/ExportDialog";
import { HeroBanner } from "./components/HeroBanner";
import { MaterialsArrangeDialog } from "./components/MaterialsArrangeDialog";
import { OutlineRequiredDialog } from "./components/OutlineRequiredDialog";
import { ProjectPanel } from "./components/ProjectPanel";
import { QualityPanel } from "./components/QualityPanel";
import { RiskPanel } from "./components/RiskPanel";
import { SystemPanelDialog, type SystemPanelKind } from "./components/SystemPanelDialog";
import { TopNav } from "./components/TopNav";
import { mockData, type ProjectFile } from "./data/mockData";
import {
  buildProjectMaterials,
  confirmProjectMaterials,
  getProjectMaterialsStatus,
  openProjectMaterialsFolder,
  refineProjectMaterials,
} from "./services/projectMaterialsApi";
import { deleteProjectFile, listProjectFiles, openProjectInputFolder, uploadProjectFiles } from "./services/projectFilesApi";
import { buildProjectOutlineFromUpload, generateProjectOutline, getProjectOutlineStatus } from "./services/projectOutlineApi";
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
  baseUrl: "",
  model: "",
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
  const [isDirectForgeConfirmOpen, setIsDirectForgeConfirmOpen] = useState(false);
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false);
  const [isOutlineDialogOpen, setIsOutlineDialogOpen] = useState(false);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isRefiningMaterials, setIsRefiningMaterials] = useState(false);
  const [systemPanel, setSystemPanel] = useState<SystemPanelKind | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(mockData.project.files);
  const [projectUploadMessage, setProjectUploadMessage] = useState("");
  const [isProjectUploading, setIsProjectUploading] = useState(false);
  const [isBuildingMaterials, setIsBuildingMaterials] = useState(false);
  const [materialsConfirmed, setMaterialsConfirmed] = useState(false);
  const [materialsConfirmedAt, setMaterialsConfirmedAt] = useState<string | null>(null);
  const [runnerTask, setRunnerTask] = useState<RunnerTaskState>({
    status: "idle",
    selectedSectionId: "5.1",
    selectedProvider: "local_codex",
    selectedMode: "subsection_batch",
    selectedRunMode: "codex_workspace",
    selectedDisplayMode: "agent_pack",
  });
  const outlineFileInputRef = useRef<HTMLInputElement | null>(null);

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

  async function refreshProjectFiles(options?: { quiet?: boolean }) {
    if (!options?.quiet) {
      setProjectUploadMessage("正在刷新项目文件……");
    }

    try {
      const files = await listProjectFiles(mockData.project.id);
      setProjectFiles(files);
      setProjectUploadMessage(files.length > 0 ? `已刷新 ${files.length} 个项目文件。` : "当前项目文件夹为空。");
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "项目文件刷新失败。");
    }
  }

  useEffect(() => {
    let cancelled = false;

    listProjectFiles(mockData.project.id)
      .then((files) => {
        if (!cancelled) {
          setProjectFiles(files);
          setProjectUploadMessage(files.length > 0 ? `已读取 ${files.length} 个本地项目文件。` : "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProjectUploadMessage("本地文件清单暂未连接，请确认本地 Runner 已启动。");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    getProjectMaterialsStatus(mockData.project.id)
      .then((status) => {
        if (!cancelled) {
          setMaterialsConfirmed(status.confirmed);
          setMaterialsConfirmedAt(status.confirmedAt);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMaterialsConfirmed(false);
          setMaterialsConfirmedAt(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  async function addProjectFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setIsProjectUploading(true);
    setProjectUploadMessage(`正在添加 ${files.length} 个文件……`);

    try {
      const uploadedFiles = await uploadProjectFiles(mockData.project.id, files);
      setProjectFiles(uploadedFiles.length > 0 ? uploadedFiles : mockData.project.files);
      setProjectUploadMessage(`已添加 ${files.length} 个文件，已写入本地项目目录。`);
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "项目文件上传失败。");
    } finally {
      setIsProjectUploading(false);
    }
  }

  async function openProjectFolder() {
    try {
      const inputFilesDir = await openProjectInputFolder(mockData.project.id);
      setProjectUploadMessage(`已打开文件夹：${inputFilesDir}`);
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "项目文件夹打开失败。");
    }
  }

  async function removeProjectFile(fileId: string) {
    setProjectUploadMessage("正在删除文件……");

    try {
      const files = await deleteProjectFile(mockData.project.id, fileId);
      setProjectFiles(files);
      setProjectUploadMessage("文件已删除。");
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "项目文件删除失败。");
    }
  }

  function organizeProjectMaterials() {
    setIsMaterialsDialogOpen(true);
  }

  async function runLocalProjectMaterials() {
    setIsMaterialsDialogOpen(false);
    setIsBuildingMaterials(true);
    setProjectUploadMessage("正在进行本地整理……");

    try {
      const result = await buildProjectMaterials(mockData.project.id);
      setMaterialsConfirmed(false);
      setMaterialsConfirmedAt(null);
      setProjectUploadMessage(
        `本地整理完成：已解析 ${result.files.loadedFiles}/${result.files.totalFiles} 个文件，生成 raw_extract.md。`,
      );
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "本地整理失败。");
    } finally {
      setIsBuildingMaterials(false);
    }
  }

  async function runAiRefineProjectMaterials() {
    setIsRefiningMaterials(true);
    setProjectUploadMessage("正在调用大模型精炼资料……");

    try {
      const result = await refineProjectMaterials(mockData.project.id);
      setIsMaterialsDialogOpen(false);
      setMaterialsConfirmed(false);
      setMaterialsConfirmedAt(null);
      setProjectUploadMessage(
        `大模型精炼完成：已生成 source_materials_refined.md${result.evidenceMapPath ? " 和 evidence_map.json" : ""}。`,
      );
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "大模型资料精炼失败。");
    } finally {
      setIsRefiningMaterials(false);
    }
  }

  async function openMaterialsFolder() {
    try {
      const materialsDir = await openProjectMaterialsFolder(mockData.project.id);
      setProjectUploadMessage(`已打开资料文件夹：${materialsDir}`);
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "资料文件夹打开失败。");
    }
  }

  async function confirmMaterialsForGeneration() {
    try {
      const outlineStatus = await getProjectOutlineStatus(mockData.project.id);

      if (!outlineStatus.exists) {
        if (outlineStatus.candidateFiles.length > 0) {
          setProjectUploadMessage("已检测到大纲文件，正在整理章节大纲……");
          await buildProjectOutlineFromUpload(mockData.project.id);
        } else {
          setIsOutlineDialogOpen(true);
          setProjectUploadMessage("还没有章节大纲，请先上传大纲文件，或调用 API 生成建议大纲。");
          return;
        }
      }

      const result = await confirmProjectMaterials(mockData.project.id);
      setMaterialsConfirmed(true);
      setMaterialsConfirmedAt(result.confirmedAt);
      setProjectUploadMessage("资料与章节大纲已确认，可用于后续生成。");
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "资料确认失败。");
    }
  }

  function uploadOutlineFile() {
    outlineFileInputRef.current?.click();
  }

  async function handleOutlineFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    setIsProjectUploading(true);
    setProjectUploadMessage("正在上传并整理大纲文件……");

    try {
      const uploadedFiles = await uploadProjectFiles(mockData.project.id, files);
      setProjectFiles(uploadedFiles.length > 0 ? uploadedFiles : mockData.project.files);
      await buildProjectOutlineFromUpload(mockData.project.id);
      setIsOutlineDialogOpen(false);

      const result = await confirmProjectMaterials(mockData.project.id);
      setMaterialsConfirmed(true);
      setMaterialsConfirmedAt(result.confirmedAt);
      setProjectUploadMessage("大纲已读取，资料与章节大纲已确认。");
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "大纲文件上传或读取失败。");
    } finally {
      setIsProjectUploading(false);
    }
  }

  async function generateOutlineFromApi() {
    setIsGeneratingOutline(true);
    setProjectUploadMessage("正在调用 API 生成建议章节大纲……");

    try {
      await generateProjectOutline(mockData.project.id);
      setIsOutlineDialogOpen(false);

      const result = await confirmProjectMaterials(mockData.project.id);
      setMaterialsConfirmed(true);
      setMaterialsConfirmedAt(result.confirmedAt);
      setProjectUploadMessage("建议章节大纲已生成，资料与章节大纲已确认。");
    } catch (error) {
      setProjectUploadMessage(error instanceof Error ? error.message : "建议章节大纲生成失败。");
    } finally {
      setIsGeneratingOutline(false);
    }
  }

  async function generateSelectedSection(options?: { skipDirectForgeConfirm?: boolean }) {
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

    if (selectedDisplayMode === "direct_forge" && !options?.skipDirectForgeConfirm) {
      setIsDirectForgeConfirmOpen(true);
      return;
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
        materialsConfirmed,
        materialsConfirmedAt,
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

  function confirmDirectForgeGeneration() {
    setIsDirectForgeConfirmOpen(false);
    void generateSelectedSection({ skipDirectForgeConfirm: true });
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
      <input
        ref={outlineFileInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.md,.txt"
        className="sr-only"
        multiple
        onChange={(event) => void handleOutlineFileChange(event)}
        type="file"
      />
      <TopNav date={mockData.statusBar.date} onOpenSystemPanel={setSystemPanel} time={mockData.statusBar.time} />
      <HeroBanner activeTools={openTools} onOpenExport={() => setIsExportOpen(true)} onOpenTool={openTool} />

      <section className={workspaceClassName} aria-label="BIDFORGE 首页工作台">
        {leftTools.length > 0 ? (
          <aside className="workspace-side workspace-left" style={{ gridTemplateRows: `repeat(${leftTools.length}, minmax(0, 1fr))` }}>
            {leftTools.includes("project") ? (
              <ProjectPanel
                isBuildingMaterials={isBuildingMaterials}
                isMaterialsConfirmed={materialsConfirmed}
                isUploading={isProjectUploading}
                onAddFiles={(files) => void addProjectFiles(files)}
                onBuildMaterials={() => void organizeProjectMaterials()}
                onConfirmMaterials={() => void confirmMaterialsForGeneration()}
                onClose={() => closeTool("project")}
                onDeleteFile={(fileId) => void removeProjectFile(fileId)}
                onOpenFolder={() => void openProjectFolder()}
                onOpenMaterialsFolder={() => void openMaterialsFolder()}
                onRefreshFiles={() => void refreshProjectFiles()}
                project={{ ...mockData.project, files: projectFiles }}
                uploadMessage={projectUploadMessage}
              />
            ) : null}
            {leftTools.includes("quality") ? <QualityPanel onClose={() => closeTool("quality")} quality={mockData.quality} /> : null}
          </aside>
        ) : null}

        <div className="workspace-draft">
          <DraftEditor
            chapters={mockData.chapters}
            draft={mockData.draft}
            onCopyAgentInstruction={copyAgentInstruction}
            onGenerate={() => void generateSelectedSection()}
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
      {isDirectForgeConfirmOpen ? (
        <DirectForgeConfirmDialog
          onCancel={() => setIsDirectForgeConfirmOpen(false)}
          onConfirm={confirmDirectForgeGeneration}
        />
      ) : null}
      {isMaterialsDialogOpen ? (
        <MaterialsArrangeDialog
          isRefining={isRefiningMaterials}
          onAiRefine={() => void runAiRefineProjectMaterials()}
          onCancel={() => setIsMaterialsDialogOpen(false)}
          onLocalArrange={() => void runLocalProjectMaterials()}
        />
      ) : null}
      {isOutlineDialogOpen ? (
        <OutlineRequiredDialog
          isGenerating={isGeneratingOutline}
          onCancel={() => setIsOutlineDialogOpen(false)}
          onGenerateOutline={() => void generateOutlineFromApi()}
          onUploadOutline={uploadOutlineFile}
        />
      ) : null}
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
