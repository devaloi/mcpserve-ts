import { execFile } from "node:child_process";
import { registerTool } from "./registry.js";
import { runCommandSchema } from "../lib/schemas.js";

const ALLOWED_COMMANDS = new Set([
  "ls",
  "cat",
  "wc",
  "head",
  "tail",
  "find",
  "grep",
]);

export function registerShellTools(): void {
  registerTool({
    name: "run_command",
    description: "Execute allowlisted shell commands",
    inputSchema: runCommandSchema,
    handler: async (params, root) => {
      const input = runCommandSchema.parse(params);

      if (!ALLOWED_COMMANDS.has(input.command)) {
        return {
          content: [
            {
              type: "text",
              text: `Command not allowed: ${input.command}. Allowed: ${Array.from(ALLOWED_COMMANDS).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      const args = input.args ?? [];
      const result = await new Promise<string>((resolve, reject) => {
        execFile(
          input.command,
          args,
          { cwd: root, timeout: 10000, maxBuffer: 512 * 1024 },
          (error, stdout, stderr) => {
            if (error) {
              reject(new Error(`Command failed: ${stderr || error.message}`));
              return;
            }
            resolve(stdout);
          },
        );
      });

      return {
        content: [{ type: "text", text: result }],
      };
    },
  });
}
