#!/usr/bin/env node

import { loadConfig, createLogger } from "./config.js";
import { StdioTransport } from "./transport.js";
import { McpServer } from "./server.js";
import { registerGitTools } from "./tools/git.js";
import { registerProjectTools } from "./tools/project.js";
import { registerShellTools } from "./tools/shell.js";
import { ProjectFileProvider } from "./resources/project.js";
import { PackageResourceProvider } from "./resources/package.js";

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL);

// Register all tools
registerGitTools();
registerProjectTools();
registerShellTools();

// Create resource providers
const resourceProviders = [
  new ProjectFileProvider(config.PROJECT_ROOT),
  new PackageResourceProvider(config.PROJECT_ROOT),
];

// Create MCP server
const server = new McpServer({
  name: "mcpserve-ts",
  version: "0.1.0",
  root: config.PROJECT_ROOT,
  resourceProviders,
  logger,
});

// Start stdio transport
const transport = new StdioTransport(
  process.stdin,
  process.stdout,
  (msg) => server.handleMessage(msg),
);

logger.info(`mcpserve-ts starting, root: ${config.PROJECT_ROOT}`);
transport.start();
