import type { z } from "zod";
import { registerTool } from "./registry.js";
import type { ToolResult } from "./registry.js";
import { runGit } from "../lib/git.js";
import { resolveSandboxed } from "../lib/sandbox.js";
import {
  gitStatusSchema,
  gitDiffSchema,
  gitLogSchema,
  gitBlameSchema,
} from "../lib/schemas.js";
import { DEFAULT_GIT_LOG_LIMIT } from "../lib/constants.js";

/** Factory for git tools that resolve a working directory and run a git command. */
function makeGitTool<T extends z.ZodType>(opts: {
  name: string;
  description: string;
  schema: T;
  toArgs: (input: z.infer<T>, root: string) => { args: string[]; cwd: string };
  fallback: string;
}) {
  registerTool({
    name: opts.name,
    description: opts.description,
    inputSchema: opts.schema,
    handler: async (params, root): Promise<ToolResult> => {
      const input = opts.schema.parse(params);
      const { args, cwd } = opts.toArgs(input, root);
      const result = await runGit(args, cwd);
      return {
        content: [{ type: "text", text: result.stdout || opts.fallback }],
      };
    },
  });
}

export function registerGitTools(): void {
  makeGitTool({
    name: "git_status",
    description: "Show working tree status",
    schema: gitStatusSchema,
    toArgs: (input, root) => ({
      args: ["status", "--porcelain"],
      cwd: input.path ? resolveSandboxed(root, input.path) : root,
    }),
    fallback: "(clean)",
  });

  makeGitTool({
    name: "git_diff",
    description: "Show changes (staged or unstaged)",
    schema: gitDiffSchema,
    toArgs: (input, root) => ({
      args: input.staged ? ["diff", "--staged"] : ["diff"],
      cwd: input.path ? resolveSandboxed(root, input.path) : root,
    }),
    fallback: "(no changes)",
  });

  makeGitTool({
    name: "git_log",
    description: "Show commit history",
    schema: gitLogSchema,
    toArgs: (input, root) => ({
      args: ["log", `--max-count=${input.limit ?? DEFAULT_GIT_LOG_LIMIT}`, "--oneline", "--no-decorate"],
      cwd: input.path ? resolveSandboxed(root, input.path) : root,
    }),
    fallback: "(no commits)",
  });

  makeGitTool({
    name: "git_blame",
    description: "Show line-by-line authorship",
    schema: gitBlameSchema,
    toArgs: (input, root) => {
      const filePath = resolveSandboxed(root, input.file);
      const relative = filePath.slice(root.length + 1);
      return { args: ["blame", relative], cwd: root };
    },
    fallback: "",
  });
}
