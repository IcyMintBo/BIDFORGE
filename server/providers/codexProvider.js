import { spawn } from "node:child_process";

export const providerName = "Local Codex Provider";
export const modelName = "codex-cli-default";

export const defaultTimeoutMs = 600_000;
export const defaultTimeoutSeconds = defaultTimeoutMs / 1000;
export const defaultSubsectionTimeoutMs = 240_000;
export const defaultSubsectionTimeoutSeconds = defaultSubsectionTimeoutMs / 1000;

function getCodexTimeoutMs({ subsection = false } = {}) {
  const envName = subsection ? "BIDFORGE_CODEX_SUBSECTION_TIMEOUT_MS" : "BIDFORGE_CODEX_TIMEOUT_MS";
  const configured = Number(globalThis.process?.env?.[envName]);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  return subsection ? defaultSubsectionTimeoutMs : defaultTimeoutMs;
}

function createPreview(text, maxLength = 1200) {
  const value = String(text ?? "").trim();
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function createProviderError(message, rawMeta, statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.provider = "local_codex";
  error.rawMeta = rawMeta;
  return error;
}

function runCodexCommand(args, { cwd, stdin, timeoutMs = getCodexTimeoutMs() } = {}) {
  return new Promise((resolve, reject) => {
    const useWindowsShellBridge = globalThis.process?.platform === "win32";
    const command = useWindowsShellBridge ? "cmd.exe" : "codex";
    const commandArgs = useWindowsShellBridge ? ["/d", "/s", "/c", "codex", ...args] : args;
    const child = spawn(command, commandArgs, {
      cwd,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stdoutChunks = [];
    const stderrChunks = [];
    let settled = false;
    let timedOut = false;
    let forceResolveTimer;

    const collectResult = (exitCode) => ({
      exitCode,
      timedOut,
      timeoutMs,
      stdout: Buffer.concat(stdoutChunks).toString("utf8"),
      stderr: Buffer.concat(stderrChunks).toString("utf8"),
    });

    const finish = (exitCode) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      if (forceResolveTimer) {
        clearTimeout(forceResolveTimer);
      }
      resolve(collectResult(exitCode));
    };

    const timer = setTimeout(() => {
      timedOut = true;
      if (globalThis.process?.platform === "win32" && child.pid) {
        const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
          windowsHide: true,
          stdio: "ignore",
        });
        killer.on("error", () => {
          child.kill("SIGTERM");
        });
      } else {
        child.kill("SIGTERM");
      }

      forceResolveTimer = setTimeout(() => {
        child.stdout.destroy();
        child.stderr.destroy();
        child.stdin.destroy();
        child.unref();
        finish(null);
      }, 3000);
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(Buffer.from(chunk));
    });

    child.stderr.on("data", (chunk) => {
      stderrChunks.push(Buffer.from(chunk));
    });

    child.on("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      if (forceResolveTimer) {
        clearTimeout(forceResolveTimer);
      }
      reject(error);
    });

    child.on("close", (exitCode) => {
      finish(exitCode);
    });

    child.stdin.end(stdin ?? "");
  });
}

async function getCodexVersion(projectRoot) {
  try {
    const result = await runCodexCommand(["--version"], {
      cwd: projectRoot,
      timeoutMs: 10_000,
    });

    if (result.exitCode !== 0) {
      return "";
    }

    return (result.stdout || result.stderr).trim();
  } catch {
    return "";
  }
}

function buildExecutionPrompt(context) {
  return `你现在是 BIDFORGE 的 Local Codex Provider，被本地 Runner 以非流式方式调用。

请严格遵守：

1. 只输出 draft.md 应写入的 Markdown 正文内容。
2. 不要解释执行过程。
3. 不要修改任何项目文件、规则文件、Candidate Skill 或 runs 目录。
4. 不要运行命令，不要尝试写文件；文件写入由 BIDFORGE Runner 完成。
5. 不要进入 Production，不要进入 Production RC。
6. 不要编造无依据事实。

下面是本次 run 的 prompt.md 内容，请据此生成精简版章节草稿：

---

${context.promptMarkdown}
`;
}

function buildTimeoutMessage() {
  return [
    "Local Codex Provider 执行超时，请检查 prompt 长度、网络或 Codex 登录状态。",
    "本次任务包含完整章节目录和 source_materials，生成时间可能较长。",
    "可稍后重试，或减少输出范围。",
  ].join("");
}

export async function generateCompactSection(context) {
  const projectRoot = context.projectRoot;
  const codexVersion = await getCodexVersion(projectRoot);
  const timeoutMs = context.providerTimeoutMs ?? getCodexTimeoutMs({ subsection: Boolean(context.subsection) });

  if (!codexVersion) {
    const rawMeta = {
      realAi: true,
      provider: "local_codex",
      codexCli: true,
      detected: false,
      exitCode: null,
      timedOut: false,
      timeoutMs,
      stderrPreview: "",
      stdoutLength: 0,
    };

    throw createProviderError(
      "Local Codex Provider 未连接：未检测到 Codex CLI。请安装并登录 Codex，或切换到其他 Provider。",
      rawMeta,
      503,
    );
  }

  const args = [
    "exec",
    "--cd",
    projectRoot,
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--color",
    "never",
    "-",
  ];
  const result = await runCodexCommand(args, {
    cwd: projectRoot,
    stdin: buildExecutionPrompt(context),
    timeoutMs,
  });

  const rawMeta = {
    realAi: true,
    provider: "local_codex",
    codexCli: true,
    codexVersion,
    args,
    exitCode: result.exitCode,
    timedOut: result.timedOut,
    timeoutMs: result.timeoutMs,
    stderrPreview: createPreview(result.stderr),
    stdoutLength: result.stdout.length,
  };

  if (result.timedOut) {
    throw createProviderError(buildTimeoutMessage(), rawMeta, 504);
  }

  if (result.exitCode !== 0) {
    throw createProviderError("Local Codex Provider 执行失败，请查看 auditor_result.md。", rawMeta, 502);
  }

  const markdown = result.stdout.trim();
  if (!markdown) {
    throw createProviderError("Local Codex Provider 未返回正文内容，请查看 auditor_result.md。", rawMeta, 502);
  }

  return {
    markdown,
    providerName,
    modelName: codexVersion || modelName,
    usage: {
      inputTokens: undefined,
      outputTokens: undefined,
      totalTokens: undefined,
    },
    rawMeta,
  };
}
