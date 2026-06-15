import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { safeFileName } from "../utils/safeFileName.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

const architectureSectionOutline = [
  { id: "5.1.1", title: "建筑设计总体思路" },
  { id: "5.1.2", title: "建筑设计范围与单体组成" },
  { id: "5.1.3", title: "总平面与建筑群体关系" },
  { id: "5.1.4", title: "建筑功能组织与平面布局" },
  { id: "5.1.5", title: "综合楼建筑设计" },
  { id: "5.1.6", title: "多层丙类标准厂房建筑设计" },
  { id: "5.1.7", title: "2-5#厂房复合功能建筑设计" },
  { id: "5.1.8", title: "2-6#单层丁类厂房建筑设计" },
  { id: "5.1.9", title: "门卫、垃圾站及后勤配套建筑设计" },
  { id: "5.1.10", title: "建筑立面与形象设计" },
  { id: "5.1.11", title: "竖向交通与剖面设计" },
  { id: "5.1.12", title: "建筑构造与装修做法" },
  { id: "5.1.13", title: "建筑消防设计" },
  { id: "5.1.14", title: "无障碍、卫生防疫与使用安全设计" },
  { id: "5.1.15", title: "建筑设计综合说明" },
];

const architectureSourceMaterialsPath = "trials/architectural_design_5_1/input/source_materials.md";

const architectureFactSummaries = [
  "项目为绵阳高新区重卡智能制造产业园基础设施项目。",
  "拟新建总建筑面积约 91613.67 平方米的产业园建筑群体。",
  "多层钢筋混凝土框架结构标准厂房建筑面积约 71543.16 平方米。",
  "单层门式钢架结构标准厂房建筑面积约 13382.24 平方米。",
  "辅助用房、食堂、门卫室、变配电站、垃圾收集房等配套用房建筑面积约 6688.27 平方米。",
  "配套用房中包含地下消防设备及附属房约 1124.00 平方米。",
  "室外道路工程约 32392.78 平方米，生态修复绿地约 9234.4 平方米。",
  "建设内容包含 35KV 电力开闭所一处、金属栏杆围墙约 799.01 米。",
  "配套内容包含给排水、消防设施、厂区安防等，建筑章节只表达界面关系，不替代专项专业展开。",
  "建筑章节不得编造楼栋层数、高度、耐火等级、防火分区面积、疏散距离、门窗参数或未明确的专业参数。",
];

function buildTargetWordCountHint(mode) {
  if (mode === "expanded_section") {
    return "expanded_section：每个小节 200–350 字左右。";
  }

  return "compact_section：覆盖 5.1.1–5.1.15，每个小节 80–150 字左右，整体不追求长篇扩写。";
}

async function loadSourceMaterials(relativePath, factSummaries) {
  const absolutePath = path.join(projectRoot, relativePath);

  try {
    const content = await readFile(absolutePath, "utf8");

    return {
      status: "loaded",
      path: relativePath,
      charCount: content.length,
      content,
      factSummaries,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        status: "missing",
        path: relativePath,
        charCount: 0,
        content: "",
        factSummaries: [],
      };
    }

    return {
      status: "error",
      path: relativePath,
      charCount: 0,
      content: "",
      factSummaries: [],
      error: error instanceof Error ? error.message : "读取失败",
    };
  }
}

function getProjectSourceMaterialPaths(projectId) {
  if (!projectId) {
    return [];
  }

  const projectDir = path.posix.join("projects", safeFileName(projectId, "project"), "materials");
  return [
    path.posix.join(projectDir, "source_materials_refined.md"),
    path.posix.join(projectDir, "source_materials.md"),
    path.posix.join(projectDir, "raw_extract.md"),
  ];
}

function deriveFactSummariesFromMaterials(content) {
  const facts = [];
  const seen = new Set();
  let inFactSection = false;
  let inEvidenceTable = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      inFactSection = line.includes("可用事实摘录") || line.includes("项目基本信息") || line.includes("工程规模") || line.includes("招标范围");
      inEvidenceTable = line.includes("证据索引");
      continue;
    }

    if (inEvidenceTable && line.startsWith("|") && !line.includes("---")) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      const fact = cells.length >= 2 ? cells[1] : "";
      if (fact && fact !== "事实" && !seen.has(fact)) {
        seen.add(fact);
        facts.push(fact);
      }
      if (facts.length >= 80) {
        break;
      }
      continue;
    }

    if (!inFactSection || !line.startsWith("- ")) {
      continue;
    }

    const fact = line.replace(/^-\s+/, "").trim();
    if (!fact || seen.has(fact)) {
      continue;
    }

    seen.add(fact);
    facts.push(fact);
    if (facts.length >= 80) {
      break;
    }
  }

  return facts;
}

async function loadProjectSourceMaterials(input) {
  const relativePaths = getProjectSourceMaterialPaths(input.projectId);
  if (relativePaths.length === 0) {
    return {
      status: "missing",
      path: "",
      charCount: 0,
      content: "",
      factSummaries: [],
    };
  }

  let lastMissing = null;

  for (const relativePath of relativePaths) {
    const sourceMaterials = await loadSourceMaterials(relativePath, []);
    if (sourceMaterials.status !== "loaded") {
      lastMissing = sourceMaterials;
      continue;
    }

    return {
      ...sourceMaterials,
      factSummaries: deriveFactSummariesFromMaterials(sourceMaterials.content),
    };
  }

  return lastMissing;
}

export async function loadSectionContext(input) {
  const projectSourceMaterials = await loadProjectSourceMaterials(input);

  if (input.sectionId === "5.1") {
    const sourceMaterials =
      projectSourceMaterials.status === "loaded"
        ? projectSourceMaterials
        : await loadSourceMaterials(architectureSourceMaterialsPath, architectureFactSummaries);

    return {
      sectionOutline: {
        title: "5.1 建筑设计",
        items: architectureSectionOutline,
        directoryFidelityRequired: true,
      },
      sourceMaterials,
      targetWordCountHint: buildTargetWordCountHint(input.mode),
    };
  }

  if (projectSourceMaterials.status === "loaded") {
    return {
      sectionOutline: {
        title: `${input.sectionId} ${input.sectionTitle}`,
        items: [],
        directoryFidelityRequired: false,
      },
      sourceMaterials: projectSourceMaterials,
      targetWordCountHint: buildTargetWordCountHint(input.mode),
    };
  }

  return {
    sectionOutline: {
      title: `${input.sectionId} ${input.sectionTitle}`,
      items: [],
      directoryFidelityRequired: false,
    },
    sourceMaterials: {
      status: "missing",
      path: "",
      charCount: 0,
      content: "",
      factSummaries: [],
    },
    targetWordCountHint: buildTargetWordCountHint(input.mode),
  };
}
