import path from "node:path";
import fs from "node:fs";

/**
 * Resolve a user-supplied path against a sandbox root.
 * Rejects any path that escapes the root via ".." traversal.
 */
export function resolveSandboxed(root: string, userPath: string): string {
  const resolved = path.resolve(root, userPath);
  const normalizedRoot = path.resolve(root);
  if (!resolved.startsWith(normalizedRoot + path.sep) && resolved !== normalizedRoot) {
    throw new Error(`Path escapes sandbox: ${userPath}`);
  }
  return resolved;
}

/**
 * Check that a sandboxed path exists and is a file.
 */
export function assertFileExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }
}

/**
 * Check that a sandboxed path exists and is a directory.
 */
export function assertDirExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`);
  }
}
