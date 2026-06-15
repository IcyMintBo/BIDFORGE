import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import * as xlsx from "xlsx";
import { listProjectFiles } from "./projectFiles.js";
import { confirmProjectOutline, ensureProjectOutlineReady } from "./projectOutline.js";
import { normalizeOpenAiCompatibleBaseUrl } from "../utils/openAiCompatibleBaseUrl.js";
import { safeFileName } from "../utils/safeFileName.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const maxTextCharsPerFile = 40000;
const maxExtractCharsInMarkdown = 18000;
const maxFactCount = 80;
const refineInputMaxChars = 60000;
const refineTimeoutMs = 120000;

const materialKeywords = [
  "项目名称",
  "建设地点",
  "建设规模",
  "招标范围",
  "建筑面积",
  "总建筑面积",
  "标准厂房",
  "辅助用房",
  "食堂",
  "门卫",
  "变配电",
  "垃圾",
  "消防",
  "道路",
  "绿地",
  "围墙",
  "给排水",
  "安防",
  "建筑设计",
  "总平面",
  "功能组织",
  "平面布局",
  "立面",
  "无障碍",
  "卫生防疫",
  "使用安全",
  "重卡",
  "产业园",
];

function getProjectDir(projectId) {
  return path.join(projectRoot, "projects", safeFileName(projectId, "project"));
}

function getMaterialsDir(projectId) {
  return path.join(getProjectDir(projectId), "materials");
}

function getSourceMaterialsPath(projectId) {
  return path.join(getMaterialsDir(projectId), "source_materials.md");
}

function getRawExtractPath(projectId) {
  return path.join(getMaterialsDir(projectId), "raw_extract.md");
}

function getRefinedSourceMaterialsPath(projectId) {
  return path.join(getMaterialsDir(projectId), "source_materials_refined.md");
}

function getEvidenceMapPath(projectId) {
  return path.join(getMaterialsDir(projectId), "evidence_map.json");
}

function getMaterialsManifestPath(projectId) {
  return path.join(getMaterialsDir(projectId), "materials_manifest.json");
}

async function readMaterialsManifest(projectId) {
  try {
    const content = await readFile(getMaterialsManifestPath(projectId), "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeMaterialsManifest(projectId, manifest) {
  await mkdir(getMaterialsDir(projectId), { recursive: true });
  await writeFile(getMaterialsManifestPath(projectId), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function toProjectRelativePath(absolutePath) {
  return path.relative(projectRoot, absolutePath).replaceAll(path.sep, "/");
}

function resolveProjectFilePath(file) {
  if (!file.path) {
    return "";
  }

  return path.resolve(projectRoot, file.path);
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function normalizeText(text) {
  return String(text ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(text, maxChars) {
  if (text.length <= maxChars) {
    return {
      text,
      truncated: false,
    };
  }

  return {
    text: `${text.slice(0, maxChars)}\n\n[已截断：原文 ${text.length} 字符，本次保留前 ${maxChars} 字符]`,
    truncated: true,
  };
}

function splitCandidateLines(text) {
  return normalizeText(text)
    .replace(/([。；;])/g, "$1\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 8 && line.length <= 260);
}

function extractFactCandidates(text, fileName) {
  const seen = new Set();
  const facts = [];
  const lines = splitCandidateLines(text);

  for (const line of lines) {
    if (!materialKeywords.some((keyword) => line.includes(keyword))) {
      continue;
    }

    const normalized = line.replace(/\s+/g, " ");
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    facts.push({
      sourceFile: fileName,
      text: normalized,
    });

    if (facts.length >= maxFactCount) {
      break;
    }
  }

  if (facts.length === 0) {
    for (const line of lines.slice(0, 8)) {
      const normalized = line.replace(/\s+/g, " ");
      if (seen.has(normalized)) {
        continue;
      }

      seen.add(normalized);
      facts.push({
        sourceFile: fileName,
        text: normalized,
      });
    }
  }

  return facts;
}

async function extractPdfText(absolutePath) {
  const buffer = await readFile(absolutePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(absolutePath) {
  const result = await mammoth.extractRawText({ path: absolutePath });
  return result.value ?? "";
}

function extractWorkbookText(absolutePath) {
  const workbook = xlsx.readFile(absolutePath, { cellDates: true });
  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = xlsx.utils.sheet_to_csv(sheet, { FS: "\t" });
    return `# Sheet: ${sheetName}\n${csv}`;
  }).join("\n\n");
}

async function extractTextFromFile(file, absolutePath) {
  const extension = path.extname(file.name || absolutePath).toLowerCase();

  if (extension === ".md" || extension === ".txt") {
    return readFile(absolutePath, "utf8");
  }

  if (extension === ".pdf") {
    return extractPdfText(absolutePath);
  }

  if (extension === ".docx") {
    return extractDocxText(absolutePath);
  }

  if (extension === ".xlsx" || extension === ".xls") {
    return extractWorkbookText(absolutePath);
  }

  const error = new Error("当前文件类型暂不支持自动文本提取");
  error.code = "UNSUPPORTED_FILE_TYPE";
  throw error;
}

function renderFileTable(items) {
  if (items.length === 0) {
    return "| 文件 | 类型 | 状态 | 字符数 | 说明 |\n| ---- | ---- | ---- | ---- | ---- |\n| 未读取 | - | empty | 0 | 当前项目没有可整理文件 |";
  }

  const rows = items.map((item) => {
    const note = item.error ? item.error.replaceAll("|", "\\|") : item.truncated ? "文本较长，已截断入库" : "已提取";
    return `| ${item.name.replaceAll("|", "\\|")} | ${item.type} | ${item.status} | ${item.charCount} | ${note} |`;
  });

  return ["| 文件 | 类型 | 状态 | 字符数 | 说明 |", "| ---- | ---- | ---- | ---- | ---- |", ...rows].join("\n");
}

function renderFactList(facts) {
  if (facts.length === 0) {
    return "- 暂未从项目文件中识别到建筑设计相关候选事实，请人工检查源文件或补充资料。";
  }

  return facts.map((fact) => `- [${fact.sourceFile}] ${fact.text}`).join("\n");
}

function renderTextExtracts(items) {
  const loadedItems = items.filter((item) => item.status === "loaded" && item.extract);
  if (loadedItems.length === 0) {
    return "暂无可写入的文本摘录。";
  }

  return loadedItems
    .map((item) => {
      const preview = truncateText(item.extract, maxExtractCharsInMarkdown);
      return `### ${item.name}\n\n来源路径：${item.path}\n\n~~~text\n${preview.text}\n~~~`;
    })
    .join("\n\n");
}

function renderRawExtract({ projectId, generatedAt, items, facts, totalExtractedChars }) {
  return `# BIDFORGE Raw Extract

## 1. 生成信息

- projectId：${projectId}
- generatedAt：${generatedAt}
- parseMode：local_text_extract
- 是否调用真实 AI：否
- 是否进入 Production：否
- 是否进入 Production RC：否
- 说明：本文件由 BIDFORGE 本地 Runner 从项目文件中提取文本并整理候选事实生成，属于 raw 层，仅用于追溯、调试和后续 AI 精炼，不建议直接作为正式写作唯一背景资料。

## 2. 文件清单

${renderFileTable(items)}

## 3. 可用事实摘录（待人工核对）

${renderFactList(facts)}

## 4. 文件文本摘录

${renderTextExtracts(items)}

## 5. 缺失与限制

- PDF 仅支持可复制文本提取，暂不做 OCR。
- DOC 旧版 Word 格式暂不保证可解析，建议转换为 DOCX。
- XLS/XLSX 以表格文本方式提取，暂不做复杂表格语义分析。
- 本地整理不调用真实 API，不消耗 token。
- 如需作为写作背景，建议继续执行“AI 资料精炼”，生成 source_materials_refined.md。
- totalExtractedChars：${totalExtractedChars}
`;
}

async function extractProjectMaterials(projectId) {
  if (!projectId || typeof projectId !== "string") {
    const error = new Error("projectId 不能为空。");
    error.statusCode = 400;
    throw error;
  }

  const { files } = await listProjectFiles(projectId);
  if (files.length === 0) {
    const error = new Error("当前项目没有文件，请先上传文件，或把文件放入 input_files 后点击刷新。");
    error.statusCode = 400;
    throw error;
  }

  const projectDir = getProjectDir(projectId);
  const materialsDir = getMaterialsDir(projectId);
  const generatedAt = new Date().toISOString();
  const items = [];
  const facts = [];
  let totalExtractedChars = 0;

  await mkdir(materialsDir, { recursive: true });

  for (const file of files) {
    const absolutePath = resolveProjectFilePath(file);
    const item = {
      id: file.id,
      name: file.name,
      type: file.type,
      path: file.path ?? "",
      status: "pending",
      charCount: 0,
      truncated: false,
      error: "",
      extract: "",
    };

    try {
      if (!absolutePath || !isPathInside(projectDir, absolutePath)) {
        throw new Error("文件路径不在当前项目目录内，已跳过。");
      }

      const rawText = await extractTextFromFile(file, absolutePath);
      const normalized = normalizeText(rawText);
      const truncated = truncateText(normalized, maxTextCharsPerFile);
      item.status = "loaded";
      item.charCount = normalized.length;
      item.truncated = truncated.truncated;
      item.extract = truncated.text;
      totalExtractedChars += normalized.length;
      facts.push(...extractFactCandidates(normalized, file.name));
    } catch (error) {
      item.status = error?.code === "UNSUPPORTED_FILE_TYPE" ? "unsupported" : "failed";
      item.error = error instanceof Error ? error.message : "文件解析失败";
    }

    items.push(item);
  }

  const uniqueFacts = [];
  const seenFactText = new Set();
  for (const fact of facts) {
    if (seenFactText.has(fact.text)) {
      continue;
    }

    seenFactText.add(fact.text);
    uniqueFacts.push(fact);
    if (uniqueFacts.length >= maxFactCount) {
      break;
    }
  }

  return {
    projectId,
    projectDir,
    materialsDir,
    generatedAt,
    items,
    facts: uniqueFacts,
    totalExtractedChars,
    stats: {
      totalFiles: items.length,
      loadedFiles: items.filter((item) => item.status === "loaded").length,
      unsupportedFiles: items.filter((item) => item.status === "unsupported").length,
      failedFiles: items.filter((item) => item.status === "failed").length,
      totalExtractedChars,
      factCount: uniqueFacts.length,
    },
  };
}

export async function buildProjectMaterials(projectId) {
  const extracted = await extractProjectMaterials(projectId);
  const rawExtractPath = getRawExtractPath(projectId);
  const legacySourceMaterialsPath = getSourceMaterialsPath(projectId);
  const manifestPath = getMaterialsManifestPath(projectId);
  const rawExtractMarkdown = renderRawExtract({
    projectId,
    generatedAt: extracted.generatedAt,
    items: extracted.items,
    facts: extracted.facts,
    totalExtractedChars: extracted.totalExtractedChars,
  });
  const manifest = {
    projectId,
    generatedAt: extracted.generatedAt,
    confirmed: false,
    confirmedAt: null,
    confirmedBy: "",
    parseMode: "local_text_extract",
    materialLevel: "raw",
    aiCalled: false,
    production: false,
    productionRc: false,
    rawExtractPath: toProjectRelativePath(rawExtractPath),
    rawExtractAbsolutePath: rawExtractPath,
    sourceMaterialsPath: toProjectRelativePath(legacySourceMaterialsPath),
    sourceMaterialsAbsolutePath: legacySourceMaterialsPath,
    sourceMaterialsRefinedPath: "",
    sourceMaterialsRefinedAbsolutePath: "",
    evidenceMapPath: "",
    evidenceMapAbsolutePath: "",
    files: extracted.items.map(({ extract, ...item }) => item),
    facts: extracted.facts,
    stats: extracted.stats,
  };

  await Promise.all([
    writeFile(rawExtractPath, `${rawExtractMarkdown.trim()}\n`, "utf8"),
    writeFile(legacySourceMaterialsPath, `${rawExtractMarkdown.trim()}\n`, "utf8"),
    writeMaterialsManifest(projectId, manifest),
  ]);

  return {
    status: "success",
    projectId,
    generatedAt: extracted.generatedAt,
    materialDir: toProjectRelativePath(extracted.materialsDir),
    materialDirAbsolute: extracted.materialsDir,
    materialLevel: manifest.materialLevel,
    aiCalled: false,
    rawExtractPath: toProjectRelativePath(rawExtractPath),
    rawExtractAbsolutePath: rawExtractPath,
    sourceMaterialsPath: toProjectRelativePath(legacySourceMaterialsPath),
    sourceMaterialsAbsolutePath: legacySourceMaterialsPath,
    sourceMaterialsRefinedPath: "",
    sourceMaterialsRefinedAbsolutePath: "",
    evidenceMapPath: "",
    evidenceMapAbsolutePath: "",
    manifestPath: toProjectRelativePath(manifestPath),
    manifestAbsolutePath: manifestPath,
    files: manifest.stats,
    message: `资料整理完成：已解析 ${manifest.stats.loadedFiles}/${manifest.stats.totalFiles} 个文件，提取 ${manifest.stats.factCount} 条候选事实。`,
  };
}

function getApiKey() {
  return (
    process.env.BIDFORGE_API_KEY ||
    process.env.BIDFORGE_OPENAI_COMPATIBLE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.BIDFORGE_OPENAI_API_KEY ||
    ""
  );
}

function getRefineApiConfig() {
  return {
    baseUrl: normalizeOpenAiCompatibleBaseUrl(process.env.BIDFORGE_API_BASE_URL ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_BASE_URL ?? ""),
    apiKey: getApiKey(),
    model: process.env.BIDFORGE_API_MODEL ?? process.env.BIDFORGE_OPENAI_COMPATIBLE_MODEL ?? "",
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = refineTimeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function getChatContent(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content.map((part) => (typeof part?.text === "string" ? part.text : "")).join("").trim();
  }

  return "";
}

function createMaterialsError(message, statusCode = 500, extra = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extra);
  return error;
}

function createRefinePayload({ model, rawExtract, tokenParam = "max_tokens" }) {
  return {
    model,
    messages: [
      {
        role: "system",
        content:
          "你是 BIDFORGE 的招标资料精炼整理助手。只依据用户提供的 raw extract 输出 Markdown，不编造，不解释过程。",
      },
      {
        role: "user",
        content: `请将以下 BIDFORGE raw extract 精炼为后续标书写作可用的项目资料包。

必须遵守：
1. 只从原始文件中提取事实，不要编造。
2. 不确定的信息标注“需人工核对”。
3. 删除广告页、空白页、模板空表、重复标题、无效页眉页脚。
4. 对模板条文要谨慎，不要全部当成项目专属要求。
5. 对“不得”“不允许”“必须”“应当”“否决”“实质性响应”等内容重点保留。
6. 输出语言要服务于标书写作，而不是简单摘要。
7. 每条关键事实尽量保留来源文件或原文摘录线索。

请严格按以下结构输出 Markdown：

# BIDFORGE Source Materials Refined

## 1. 项目基本信息
- 项目名称：
- 招标人：
- 建设地点：
- 建设性质：
- 标段划分：
- 项目投资：
- 工期要求：
- 质量要求：

## 2. 本次招标范围与硬性要求
- 设计范围：
- 施工范围：
- 采购范围：
- 专项设计要求：
- 后续服务要求：
- 明确不属于本次范围或需谨慎处理的内容：

## 3. 工程规模与建设内容
- 总建筑面积：
- 主要单体：
- 室外工程：
- 市政配套：
- 消防 / 安防 / 给排水 / 电气等配套内容：

## 4. 发包人要求摘要
- 工程目的：
- 功能需求：
- 最低技术要求：
- 设计成果要求：
- 限额设计 / 造价控制要求：
- 驻场 / 配合 / 报批报审要求：

## 5. 评分办法与技术标响应点
- 承包人建议书相关得分点：
- 承包人实施计划相关得分点：
- 设计管理相关得分点：
- 施工组织相关得分点：
- 质量 / 进度 / 安全 / 环保 / 服务相关得分点：

## 6. 初步设计条件摘要
- 项目定位：
- 总体构思：
- 总平面布局：
- 交通组织：
- 单体功能：
- 建筑风格：
- 结构体系：
- 各专业设计条件：

## 7. 重点专项信息
- 消防：
- 给排水：
- 电气：
- 弱电智能化：
- 暖通：
- 绿色建筑：
- 海绵城市：
- 装配式：
- 景观：
- 室外管网：

## 8. 可用于标书写作的项目理解
用正式标书语言整理，不要空泛，不要像介绍资料，要能直接服务于“项目理解、重难点分析、设计组织、EPC协同”等章节。

## 9. 可能的写作重难点
- 园区分期建设与现状衔接：
- 生产厂房与综合配套协同：
- 场内外交通组织：
- 市政接驳：
- 消防与安全疏散：
- 多专业协同：
- 设计施工总承包管理：

## 10. 易误用 / 易混淆 / 禁止编造信息
列出后续写作时容易写错、不能写死、需要人工核对的内容。

## 11. 证据索引
| 编号 | 事实 | 来源文件 | 页码/章节 | 原文摘录 |
|---|---|---|---|---|

raw extract：

${rawExtract.slice(0, refineInputMaxChars)}`,
      },
    ],
    temperature: 0.2,
    [tokenParam]: 4000,
    stream: false,
  };
}

function shouldRetryWithAlternateTokenLimit(response, bodyText) {
  if (response.status !== 400) {
    return false;
  }

  return /max_tokens|max_completion_tokens|unsupported|not supported|invalid/i.test(String(bodyText ?? ""));
}

function renderEvidenceMap({ projectId, generatedAt, manifest, refinedPath, model, usage }) {
  return {
    projectId,
    generatedAt,
    source: "ai_refine_from_raw_extract",
    refinedMaterialsPath: toProjectRelativePath(refinedPath),
    aiCalled: true,
    model,
    usage: usage ?? null,
    production: false,
    productionRc: false,
    note: "MVP 阶段 evidence_map 先记录本地候选事实来源；source_materials_refined.md 中的证据索引需人工核查。",
    facts: (manifest.facts ?? []).map((fact, index) => ({
      id: `F-${String(index + 1).padStart(3, "0")}`,
      fact: fact.text,
      sourceFile: fact.sourceFile,
      page: "需人工核对",
      category: "候选事实",
      writingUse: [],
      riskNote: "",
      confidence: "medium",
    })),
  };
}

export async function refineProjectMaterials(projectId) {
  const config = getRefineApiConfig();

  if (!config.baseUrl) {
    throw createMaterialsError("Base URL 未配置，无法执行大模型资料精炼。", 400);
  }

  if (!config.apiKey) {
    throw createMaterialsError("API Key 未配置，无法执行大模型资料精炼。", 400);
  }

  if (!config.model) {
    throw createMaterialsError("Model 未配置，无法执行大模型资料精炼。", 400);
  }

  const extracted = await extractProjectMaterials(projectId);
  const rawExtractPath = getRawExtractPath(projectId);
  const refinedPath = getRefinedSourceMaterialsPath(projectId);
  const evidenceMapPath = getEvidenceMapPath(projectId);
  const rawExtract = renderRawExtract({
    projectId,
    generatedAt: extracted.generatedAt,
    items: extracted.items,
    facts: extracted.facts,
    totalExtractedChars: extracted.totalExtractedChars,
  });
  const endpoint = `${config.baseUrl}/chat/completions`;
  let response;
  let bodyText = "";
  let payload;
  let tokenParam = "max_tokens";

  try {
    response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRefinePayload({ model: config.model, rawExtract, tokenParam })),
    });
    bodyText = await response.text();

    if (!response.ok && shouldRetryWithAlternateTokenLimit(response, bodyText)) {
      tokenParam = "max_completion_tokens";
      response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createRefinePayload({ model: config.model, rawExtract, tokenParam })),
      });
      bodyText = await response.text();
    }

    try {
      payload = bodyText ? JSON.parse(bodyText) : undefined;
    } catch {
      payload = undefined;
    }
  } catch (error) {
    const message = isAbortError(error)
      ? `大模型资料精炼超时（${Math.round(refineTimeoutMs / 1000)} 秒）。`
      : error instanceof Error
        ? `大模型资料精炼请求失败：${error.message}`
        : "大模型资料精炼请求失败。";
    throw createMaterialsError(message, 502);
  }

  if (!response.ok) {
    throw createMaterialsError(`大模型资料精炼失败：HTTP ${response.status}。`, response.status, {
      detail: String(bodyText ?? "").slice(0, 500),
    });
  }

  const refinedMarkdown = getChatContent(payload);
  if (!refinedMarkdown) {
    throw createMaterialsError("大模型资料精炼返回为空。", 502);
  }

  const generatedAt = extracted.generatedAt;
  const usage = payload?.usage
    ? {
        inputTokens: payload.usage.prompt_tokens ?? payload.usage.input_tokens ?? null,
        outputTokens: payload.usage.completion_tokens ?? payload.usage.output_tokens ?? null,
        totalTokens: payload.usage.total_tokens ?? null,
      }
    : null;
  const evidenceMap = renderEvidenceMap({
    projectId,
    generatedAt,
    manifest: {
      facts: extracted.facts,
    },
    refinedPath,
    model: config.model,
    usage,
  });
  const nextManifest = {
    projectId,
    generatedAt,
    confirmed: false,
    confirmedAt: null,
    confirmedBy: "",
    parseMode: "local_text_extract",
    materialLevel: "refined",
    aiCalled: true,
    refineProvider: "openai_compatible",
    refineModel: config.model,
    refineTokenLimitParam: tokenParam,
    rawExtractPath: toProjectRelativePath(rawExtractPath),
    rawExtractAbsolutePath: rawExtractPath,
    sourceMaterialsRefinedPath: toProjectRelativePath(refinedPath),
    sourceMaterialsRefinedAbsolutePath: refinedPath,
    evidenceMapPath: toProjectRelativePath(evidenceMapPath),
    evidenceMapAbsolutePath: evidenceMapPath,
    sourceMaterialsPath: toProjectRelativePath(refinedPath),
    sourceMaterialsAbsolutePath: refinedPath,
    files: extracted.items.map(({ extract, ...item }) => item),
    facts: extracted.facts,
    stats: extracted.stats,
    usage,
    production: false,
    productionRc: false,
  };

  await Promise.all([
    writeFile(rawExtractPath, `${rawExtract.trim()}\n`, "utf8"),
    writeFile(refinedPath, `${refinedMarkdown.trim()}\n`, "utf8"),
    writeFile(evidenceMapPath, `${JSON.stringify(evidenceMap, null, 2)}\n`, "utf8"),
    writeMaterialsManifest(projectId, nextManifest),
  ]);

  return {
    status: "success",
    projectId,
    generatedAt,
    materialLevel: "refined",
    aiCalled: true,
    model: config.model,
    rawExtractPath: toProjectRelativePath(rawExtractPath),
    rawExtractAbsolutePath: rawExtractPath,
    sourceMaterialsRefinedPath: toProjectRelativePath(refinedPath),
    sourceMaterialsRefinedAbsolutePath: refinedPath,
    evidenceMapPath: toProjectRelativePath(evidenceMapPath),
    evidenceMapAbsolutePath: evidenceMapPath,
    sourceMaterialsPath: toProjectRelativePath(refinedPath),
    sourceMaterialsAbsolutePath: refinedPath,
    manifestPath: toProjectRelativePath(getMaterialsManifestPath(projectId)),
    manifestAbsolutePath: getMaterialsManifestPath(projectId),
    files: nextManifest.stats,
    usage,
    message: "AI 资料精炼完成，已生成 source_materials_refined.md 和 evidence_map.json。",
  };
}

export async function getProjectMaterialsStatus(projectId) {
  const manifest = await readMaterialsManifest(projectId);
  if (!manifest) {
    return {
      projectId,
      exists: false,
      confirmed: false,
      confirmedAt: null,
      materialLevel: "none",
      aiCalled: false,
      rawExtractPath: "",
      rawExtractAbsolutePath: "",
      sourceMaterialsPath: "",
      sourceMaterialsAbsolutePath: "",
      sourceMaterialsRefinedPath: "",
      sourceMaterialsRefinedAbsolutePath: "",
      evidenceMapPath: "",
      evidenceMapAbsolutePath: "",
      files: null,
    };
  }

  return {
    projectId,
    exists: true,
    generatedAt: manifest.generatedAt ?? "",
    confirmed: Boolean(manifest.confirmed),
    confirmedAt: manifest.confirmedAt ?? null,
    materialLevel: manifest.materialLevel ?? (manifest.aiCalled ? "refined" : "raw"),
    aiCalled: Boolean(manifest.aiCalled),
    rawExtractPath: manifest.rawExtractPath ?? "",
    rawExtractAbsolutePath: manifest.rawExtractAbsolutePath ?? "",
    sourceMaterialsPath: manifest.sourceMaterialsPath ?? "",
    sourceMaterialsAbsolutePath: manifest.sourceMaterialsAbsolutePath ?? "",
    sourceMaterialsRefinedPath: manifest.sourceMaterialsRefinedPath ?? "",
    sourceMaterialsRefinedAbsolutePath: manifest.sourceMaterialsRefinedAbsolutePath ?? "",
    evidenceMapPath: manifest.evidenceMapPath ?? "",
    evidenceMapAbsolutePath: manifest.evidenceMapAbsolutePath ?? "",
    files: manifest.stats ?? null,
  };
}

export async function confirmProjectMaterials(projectId) {
  const manifest = await readMaterialsManifest(projectId);
  if (!manifest) {
    const error = new Error("当前还没有整理资料，请先点击“整理资料”。");
    error.statusCode = 400;
    throw error;
  }

  await ensureProjectOutlineReady(projectId);
  const outlineConfirmation = await confirmProjectOutline(projectId);

  const confirmedAt = new Date().toISOString();
  const nextManifest = {
    ...manifest,
    confirmed: true,
    confirmedAt,
    confirmedBy: "local_user",
  };

  await writeMaterialsManifest(projectId, nextManifest);

  return {
    projectId,
    confirmed: true,
    confirmedAt,
    outlineConfirmedAt: outlineConfirmation.confirmedAt,
    outlinePath: outlineConfirmation.outlinePath,
    sourceMaterialsPath: nextManifest.sourceMaterialsPath ?? "",
    message: "资料与章节大纲已确认，可用于后续生成。",
  };
}

export async function openProjectMaterialsFolder(projectId) {
  if (!projectId || typeof projectId !== "string") {
    const error = new Error("projectId 不能为空。");
    error.statusCode = 400;
    throw error;
  }

  const materialsDir = getMaterialsDir(projectId);
  await mkdir(materialsDir, { recursive: true });

  const platform = globalThis.process?.platform;
  const command = platform === "win32" ? "explorer.exe" : platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [materialsDir], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  return {
    projectId,
    materialsDir,
    opened: true,
  };
}
