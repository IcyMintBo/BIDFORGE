import { readFile } from "node:fs/promises";
import path from "node:path";

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const equalsIndex = trimmed.indexOf("=");
  if (equalsIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, equalsIndex).trim();
  let value = trimmed.slice(equalsIndex + 1).trim();

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return {
    key,
    value,
  };
}

export async function loadLocalEnv(projectRoot) {
  const originalEnvKeys = new Set(Object.keys(process.env));
  const values = new Map();

  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(projectRoot, fileName);

    try {
      const content = await readFile(filePath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const parsed = parseEnvLine(line);
        if (parsed && !originalEnvKeys.has(parsed.key)) {
          values.set(parsed.key, parsed.value);
        }
      }
    } catch {
      // Env files are optional in BIDFORGE Local.
    }
  }

  for (const [key, value] of values) {
    process.env[key] = value;
  }
}
