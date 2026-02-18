import { execFile } from "node:child_process";
import { EXEC_TIMEOUT, MAX_FILE_SIZE } from "./constants.js";

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
  timeout = EXEC_TIMEOUT,
): Promise<GitResult> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      { cwd, timeout, maxBuffer: MAX_FILE_SIZE },
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
