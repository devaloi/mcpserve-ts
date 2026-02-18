import { registerTool } from "./registry.js";
import { runGit } from "../lib/git.js";
import { resolveSandboxed } from "../lib/sandbox.js";
import {
  gitStatusSchema,
  gitDiffSchema,
  gitLogSchema,
  gitBlameSchema,
} from "../lib/schemas.js";

export function registerGitTools(): void {
  registerTool({
    name: "git_status",
    description: "Show working tree status",
    inputSchema: gitStatusSchema,
    handler: async (params, root) => {
      const input = gitStatusSchema.parse(params);
      const cwd = input.path ? resolveSandboxed(root, input.path) : root;
      const result = await runGit(["status", "--porcelain"], cwd);
      return {
        content: [{ type: "text", text: result.stdout || "(clean)" }],
      };
    },
  });

  registerTool({
    name: "git_diff",
    description: "Show changes (staged or unstaged)",
    inputSchema: gitDiffSchema,
    handler: async (params, root) => {
      const input = gitDiffSchema.parse(params);
      const cwd = input.path ? resolveSandboxed(root, input.path) : root;
      const args = input.staged ? ["diff", "--staged"] : ["diff"];
      const result = await runGit(args, cwd);
      return {
        content: [{ type: "text", text: result.stdout || "(no changes)" }],
      };
    },
  });

  registerTool({
    name: "git_log",
    description: "Show commit history",
    inputSchema: gitLogSchema,
    handler: async (params, root) => {
      const input = gitLogSchema.parse(params);
      const cwd = input.path ? resolveSandboxed(root, input.path) : root;
      const limit = input.limit ?? 10;
      const result = await runGit(
        ["log", `--max-count=${limit}`, "--oneline", "--no-decorate"],
        cwd,
      );
      return {
        content: [{ type: "text", text: result.stdout || "(no commits)" }],
      };
    },
  });

  registerTool({
    name: "git_blame",
    description: "Show line-by-line authorship",
    inputSchema: gitBlameSchema,
    handler: async (params, root) => {
      const input = gitBlameSchema.parse(params);
      const filePath = resolveSandboxed(root, input.file);
      // Make path relative to root for git blame
      const relative = filePath.slice(root.length + 1);
      const result = await runGit(["blame", relative], root);
      return {
        content: [{ type: "text", text: result.stdout }],
      };
    },
  });
}
