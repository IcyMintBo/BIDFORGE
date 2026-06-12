import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

const candidateFileNames = ["README.md", "rules.md", "source_cases.md", "auditor_notes.md", "changelog.md"];

const defaultSkillConfig = {
  writingSkill: {
    name: "bidforge-writing-candidate-v0.3",
    path: "candidate_skills/bidforge-writing-candidate-v0.3",
  },
  expansionSkill: {
    name: "bidforge-expansion-candidate-v0.3",
    path: "candidate_skills/bidforge-expansion-candidate-v0.3",
  },
  docs: [
    "docs/BIDFORGE_当前有效文件与规则清单.md",
    "docs/BIDFORGE_当前阶段状态收口_2026-06.md",
  ],
};

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

async function readManifestFile(relativePath, displayName = path.basename(relativePath)) {
  const absolutePath = path.join(projectRoot, relativePath);

  try {
    const content = await readFile(absolutePath, "utf8");

    return {
      name: displayName,
      path: toPosixPath(relativePath),
      status: "loaded",
      charCount: content.length,
      content,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        name: displayName,
        path: toPosixPath(relativePath),
        status: "missing",
        charCount: 0,
        content: "",
      };
    }

    return {
      name: displayName,
      path: toPosixPath(relativePath),
      status: "error",
      charCount: 0,
      content: "",
      error: error instanceof Error ? error.message : "读取失败",
    };
  }
}

async function loadCandidateSkill(skillConfig) {
  const files = await Promise.all(
    candidateFileNames.map((fileName) => readManifestFile(path.join(skillConfig.path, fileName), fileName)),
  );

  return {
    name: skillConfig.name,
    path: skillConfig.path,
    files,
  };
}

export async function loadCurrentSkillManifest() {
  const loadedAt = new Date().toISOString();
  const [writingSkill, expansionSkill, docs] = await Promise.all([
    loadCandidateSkill(defaultSkillConfig.writingSkill),
    loadCandidateSkill(defaultSkillConfig.expansionSkill),
    Promise.all(defaultSkillConfig.docs.map((docPath) => readManifestFile(docPath))),
  ]);

  return {
    writingSkill,
    expansionSkill,
    docs,
    production: false,
    productionRc: false,
    loadedAt,
  };
}

export function summarizeSkillManifest(skillManifest) {
  return {
    writingSkill: skillManifest.writingSkill.name,
    expansionSkill: skillManifest.expansionSkill.name,
    production: false,
    productionRc: false,
    loadedAt: skillManifest.loadedAt,
    writingFiles: skillManifest.writingSkill.files.map((file) => ({
      name: file.name,
      status: file.status,
      charCount: file.charCount,
    })),
    expansionFiles: skillManifest.expansionSkill.files.map((file) => ({
      name: file.name,
      status: file.status,
      charCount: file.charCount,
    })),
    docs: skillManifest.docs.map((file) => ({
      name: file.name,
      path: file.path,
      status: file.status,
      charCount: file.charCount,
    })),
  };
}

function renderFileList(files) {
  return files
    .map((file) => {
      const suffix = file.status === "loaded" ? `loaded, ${file.charCount} chars` : file.status;
      return `* ${file.path}：${suffix}`;
    })
    .join("\n");
}

function renderRealAiStatus(providerKey, providerExecution = {}) {
  const providerName = providerExecution.providerName ?? providerKey;

  if (providerExecution.realAi && providerExecution.status === "success") {
    return `* 当前已接入真实 AI：${providerName}`;
  }

  if (providerExecution.realAi && providerExecution.status === "failed") {
    return `* 当前尝试调用真实 AI：${providerName}，但本次调用失败`;
  }

  if (providerExecution.realAi) {
    return `* 当前尝试调用真实 AI：${providerName}`;
  }

  return "* 当前未接真实 AI";
}

export function renderUsedSkillManifest({ input, providerKey, taskId, skillManifest, providerExecution }) {
  return `# Used Skill Manifest

## 1. 当前任务

* taskId：${taskId}
* sectionId：${input.sectionId}
* sectionTitle：${input.sectionTitle}
* mode：${input.mode}
* provider：${providerKey}

## 2. 当前有效 Candidate Skill

* Writing Candidate v0.3：${skillManifest.writingSkill.name}
* Expansion Candidate v0.3：${skillManifest.expansionSkill.name}

## 3. 已读取文件

### Writing Candidate v0.3

${renderFileList(skillManifest.writingSkill.files)}

### Expansion Candidate v0.3

${renderFileList(skillManifest.expansionSkill.files)}

### 状态文档

${renderFileList(skillManifest.docs)}

## 4. 阶段状态

* Production：否
* Production RC：否
* 当前为 Candidate Skill 验证 / MVP 功能阶段
${renderRealAiStatus(providerKey, providerExecution)}
* 当前未解析 PDF/DOCX

## 5. 摘要

* Writing Candidate v0.3 用于精简小节写作；
* Expansion Candidate v0.3 用于扩写、类型判断、通用内容正文化、关系逻辑型信息密度控制；
* 本次 run 仍由当前 provider 生成正文。`;
}
