import fs from "node:fs";
import path from "node:path";
import { SKIP_DIRS } from "./constants.js";

/**
 * Build an ASCII directory tree, appending lines to `lines`.
 */
export function buildTree(
  dirPath: string,
  prefix: string,
  maxDepth: number,
  currentDepth: number,
  lines: string[],
): void {
  if (currentDepth >= maxDepth) return;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    console.error(`buildTree: failed to read ${dirPath}: ${err}`);
    return;
  }

  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.name.startsWith(".") && entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const isLast = i === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const suffix = entry.isDirectory() ? "/" : "";
    lines.push(`${prefix}${connector}${entry.name}${suffix}`);

    if (entry.isDirectory()) {
      const newPrefix = prefix + (isLast ? "    " : "│   ");
      buildTree(
        path.join(dirPath, entry.name),
        newPrefix,
        maxDepth,
        currentDepth + 1,
        lines,
      );
    }
  }
}
