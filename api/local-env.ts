import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const loadedLocalEnvNames = new Set<string>();

const localEnvFiles = [".env", ".env.development", ".env.local", ".env.development.local"];

function parseEnvValue(rawValue: string) {
  const trimmedValue = rawValue.trim();
  const quote = trimmedValue[0];

  if (
    (quote === `"` || quote === `'`) &&
    trimmedValue.length > 1 &&
    trimmedValue[trimmedValue.length - 1] === quote
  ) {
    const unquotedValue = trimmedValue.slice(1, -1);
    return quote === `"` ? unquotedValue.replace(/\\n/g, "\n") : unquotedValue;
  }

  const commentIndex = trimmedValue.indexOf(" #");
  return commentIndex >= 0 ? trimmedValue.slice(0, commentIndex).trim() : trimmedValue;
}

export function loadLocalEnv() {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "development") return;

  const localValues = new Map<string, string>();

  for (const fileName of localEnvFiles) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;

      localValues.set(match[1], parseEnvValue(match[2]));
    }
  }

  for (const [name, value] of localValues) {
    if (!process.env[name] || loadedLocalEnvNames.has(name)) {
      process.env[name] = value;
      loadedLocalEnvNames.add(name);
    }
  }
}
