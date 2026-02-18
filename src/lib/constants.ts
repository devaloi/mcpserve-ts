/** Directories to skip when traversing project trees. */
export const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".next",
  "__pycache__",
]);

export const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
export const EXEC_TIMEOUT = 10_000; // 10s
export const MAX_BUFFER = 512 * 1024;
export const DEFAULT_GIT_LOG_LIMIT = 10;
export const DEFAULT_TREE_MAX_DEPTH = 10;
export const MCP_PROTOCOL_VERSION = "2024-11-05";
