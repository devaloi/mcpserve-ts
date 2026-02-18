import fs from "node:fs";
import path from "node:path";
import type { ResourceProvider, ResourceDefinition, ResourceContent } from "./provider.js";
import { resolveSandboxed } from "../lib/sandbox.js";
import { SKIP_DIRS } from "../lib/constants.js";

export class ProjectFileProvider implements ResourceProvider {
  constructor(private root: string) {}

  list(): ResourceDefinition[] {
    const files = this.collectFiles(this.root, "", 3, 0);
    return files.map((f) => ({
      uri: `file:///${f}`,
      name: f,
      description: `Project file: ${f}`,
      mimeType: guessMimeType(f),
    }));
  }

  async read(uri: string): Promise<ResourceContent | null> {
    const prefix = "file:///";
    if (!uri.startsWith(prefix)) return null;

    const relativePath = uri.slice(prefix.length);
    let filePath: string;
    try {
      filePath = resolveSandboxed(this.root, relativePath);
    } catch {
      return null;
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      return null;
    }

    const text = fs.readFileSync(filePath, "utf-8");
    return { uri, mimeType: guessMimeType(relativePath), text };
  }

  private collectFiles(
    dir: string,
    prefix: string,
    maxDepth: number,
    depth: number,
  ): string[] {
    if (depth >= maxDepth) return [];
    const results: string[] = [];

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      console.error(`collectFiles: failed to read ${dir}: ${err}`);
      return [];
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isFile()) {
        results.push(rel);
      } else if (entry.isDirectory()) {
        results.push(...this.collectFiles(path.join(dir, entry.name), rel, maxDepth, depth + 1));
      }
    }

    return results;
  }
}

function guessMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".ts": "text/typescript",
    ".js": "text/javascript",
    ".json": "application/json",
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".yaml": "text/yaml",
    ".yml": "text/yaml",
    ".html": "text/html",
    ".css": "text/css",
  };
  return mimeMap[ext] ?? "text/plain";
}
