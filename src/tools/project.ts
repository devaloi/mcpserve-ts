import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { registerTool } from "./registry.js";
import { resolveSandboxed, assertFileExists, assertDirExists } from "../lib/sandbox.js";
import {
  projectTreeSchema,
  readFileSchema,
  searchFilesSchema,
} from "../lib/schemas.js";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "__pycache__"]);
const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

export function registerProjectTools(): void {
  registerTool({
    name: "project_tree",
    description: "List project directory structure",
    inputSchema: projectTreeSchema,
    handler: async (params, root) => {
      const input = projectTreeSchema.parse(params);
      const dirPath = input.path ? resolveSandboxed(root, input.path) : root;
      assertDirExists(dirPath);
      const maxDepth = input.depth ?? 3;
      const lines: string[] = [];
      buildTree(dirPath, "", maxDepth, 0, lines);
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  });

  registerTool({
    name: "read_file",
    description: "Read file contents",
    inputSchema: readFileSchema,
    handler: async (params, root) => {
      const input = readFileSchema.parse(params);
      const filePath = resolveSandboxed(root, input.path);
      assertFileExists(filePath);
      const stat = fs.statSync(filePath);
      if (stat.size > MAX_FILE_SIZE) {
        return {
          content: [{ type: "text", text: `File too large: ${stat.size} bytes (max ${MAX_FILE_SIZE})` }],
          isError: true,
        };
      }
      const text = fs.readFileSync(filePath, "utf-8");
      return { content: [{ type: "text", text }] };
    },
  });

  registerTool({
    name: "search_files",
    description: "Search file contents with regex",
    inputSchema: searchFilesSchema,
    handler: async (params, root) => {
      const input = searchFilesSchema.parse(params);
      const searchRoot = input.path ? resolveSandboxed(root, input.path) : root;
      assertDirExists(searchRoot);

      const args = ["-r", "-n", "--include", input.glob ?? "*", input.pattern, searchRoot];
      const result = await new Promise<string>((resolve, reject) => {
        execFile("grep", args, { timeout: 10000, maxBuffer: 512 * 1024 }, (error, stdout) => {
          if (error && error.code === 1) {
            // grep returns 1 when no matches
            resolve("");
            return;
          }
          if (error) {
            reject(new Error(`Search failed: ${error.message}`));
            return;
          }
          resolve(stdout);
        });
      });

      return {
        content: [{ type: "text", text: result || "(no matches)" }],
      };
    },
  });
}

function buildTree(
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
  } catch {
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
