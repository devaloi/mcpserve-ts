import { execFile } from "node:child_process";

export interface GitResult {
  stdout: string;
  stderr: string;
}

/**
 * Run a git command safely with execFile (no shell interpolation).
 */
export function runGit(
  args: string[],
  cwd: string,
  timeout = 10000,
): Promise<GitResult> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      { cwd, timeout, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`git ${args[0]} failed: ${stderr || error.message}`));
          return;
        }
        resolve({ stdout, stderr });
      },
    );
  });
}
