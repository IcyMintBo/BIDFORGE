import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProvider, getSupportedProviders } from "../providers/providerRegistry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");
const runsRoot = path.join(projectRoot, "runs");

function toRunPath(directoryName) {
  return path.posix.join("runs", directoryName);
}

function getProviderStatus(id) {
  const { provider } = getProvider(id);
  const status = id === "mock" || id === "local_codex" ? "available" : "placeholder";

  return {
    id,
    name: provider.providerName ?? id,
    status,
    realAi: id === "local_codex",
  };
}

async function readLatestRun() {
  let entries;

  try {
    entries = await readdir(runsRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }

  const directories = entries.filter((entry) => entry.isDirectory());
  if (directories.length === 0) {
    return null;
  }

  const directoryStats = await Promise.all(
    directories.map(async (entry) => {
      const absolutePath = path.join(runsRoot, entry.name);
      const stats = await stat(absolutePath);

      return {
        name: entry.name,
        absolutePath,
        modifiedAt: stats.mtimeMs,
        createdAt: stats.birthtime.toISOString(),
      };
    }),
  );

  directoryStats.sort((a, b) => b.modifiedAt - a.modifiedAt);
  const latest = directoryStats[0];
  const fileEntries = await readdir(latest.absolutePath, { withFileTypes: true });
  const files = fileEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  let task = {};
  try {
    task = JSON.parse(await readFile(path.join(latest.absolutePath, "task.json"), "utf8"));
  } catch {
    task = {};
  }

  return {
    runDir: toRunPath(latest.name),
    files,
    createdAt: task.createdAt ?? latest.createdAt,
    sectionId: task.sectionId ?? "",
    sectionTitle: task.sectionTitle ?? "",
    provider: task.provider ?? "",
  };
}

export async function getRunnerStatus({ port }) {
  const providers = getSupportedProviders().map(getProviderStatus);
  const latestRun = await readLatestRun();

  return {
    status: "online",
    port,
    providers,
    latestRun,
    production: false,
    productionRc: false,
    realAi: false,
    parseSourceFiles: false,
  };
}
