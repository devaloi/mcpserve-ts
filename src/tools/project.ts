import fs from "node:fs";
import { execFile } from "node:child_process";
import { registerTool } from "./registry.js";
import { resolveSandboxed, assertFileExists, assertDirExists } from "../lib/sandbox.js";
import {
  projectTreeSchema,
  readFileSchema,
  searchFilesSchema,
} from "../lib/schemas.js";
import { buildTree } from "../lib/tree.js";
import { MAX_FILE_SIZE, EXEC_TIMEOUT, MAX_BUFFER } from "../lib/constants.js";

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
        execFile("grep", args, { timeout: EXEC_TIMEOUT, maxBuffer: MAX_BUFFER }, (error, stdout, stderr) => {
          if (error && (error as NodeJS.ErrnoException).code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
            reject(new Error("Search output too large"));
            return;
          }
          if (error && !error.killed && !stderr) {
            // exit code 1 with no stderr means no matches
            resolve("");
            return;
          }
          if (error) {
            reject(new Error(`Search failed: ${stderr || error.message}`));
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
