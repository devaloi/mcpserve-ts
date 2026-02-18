import { describe, it, expect, beforeAll } from "vitest";
import { McpServer } from "../src/server.js";
import { registerGitTools } from "../src/tools/git.js";
import { registerProjectTools } from "../src/tools/project.js";
import { registerShellTools } from "../src/tools/shell.js";
import { ProjectFileProvider } from "../src/resources/project.js";
import { PackageResourceProvider } from "../src/resources/package.js";
import { createLogger } from "../src/config.js";
import type { JsonRpcRequest } from "../src/protocol.js";
import { JSONRPC_VERSION, ErrorCode } from "../src/protocol.js";

function makeReq(
  id: number,
  method: string,
  params?: Record<string, unknown>,
): JsonRpcRequest {
  return { jsonrpc: JSONRPC_VERSION, id, method, params };
}

describe("McpServer", () => {
  let server: McpServer;

  beforeAll(() => {
    registerGitTools();
    registerProjectTools();
    registerShellTools();

    server = new McpServer({
      name: "test-server",
      version: "0.0.1",
      root: process.cwd(),
      resourceProviders: [
        new ProjectFileProvider(process.cwd()),
        new PackageResourceProvider(process.cwd()),
      ],
      logger: createLogger("error"),
    });
  });

  it("responds to initialize", async () => {
    const resp = await server.handleMessage(
      makeReq(1, "initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test", version: "0.1.0" },
      }),
    );
    expect(resp?.result).toBeDefined();
    const result = resp?.result as Record<string, unknown>;
    expect(result.protocolVersion).toBe("2024-11-05");
    expect(result.serverInfo).toBeDefined();
    expect(result.capabilities).toBeDefined();
  });

  it("responds to ping", async () => {
    const resp = await server.handleMessage(makeReq(2, "ping"));
    expect(resp?.result).toEqual({});
  });

  it("lists tools", async () => {
    const resp = await server.handleMessage(makeReq(3, "tools/list"));
    const result = resp?.result as { tools: Array<{ name: string }> };
    expect(result.tools.length).toBeGreaterThanOrEqual(8);
    const names = result.tools.map((t) => t.name);
    expect(names).toContain("git_status");
    expect(names).toContain("read_file");
    expect(names).toContain("run_command");
  });

  it("returns MethodNotFound for unknown method", async () => {
    const resp = await server.handleMessage(makeReq(4, "unknown/method"));
    expect(resp?.error).toBeDefined();
    expect(resp?.error?.code).toBe(ErrorCode.MethodNotFound);
  });

  it("returns null for notification", async () => {
    const resp = await server.handleMessage({
      jsonrpc: JSONRPC_VERSION,
      method: "notifications/initialized",
    });
    expect(resp).toBeNull();
  });

  it("lists resources", async () => {
    const resp = await server.handleMessage(makeReq(5, "resources/list"));
    const result = resp?.result as { resources: Array<{ uri: string }> };
    expect(result.resources.length).toBeGreaterThan(0);
  });

  it("returns error for missing tool name", async () => {
    const resp = await server.handleMessage(
      makeReq(6, "tools/call", { arguments: {} }),
    );
    expect(resp?.error).toBeDefined();
    expect(resp?.error?.code).toBe(ErrorCode.InvalidParams);
  });

  it("returns error for missing resource uri", async () => {
    const resp = await server.handleMessage(
      makeReq(7, "resources/read", {}),
    );
    expect(resp?.error).toBeDefined();
    expect(resp?.error?.code).toBe(ErrorCode.InvalidParams);
  });
});
