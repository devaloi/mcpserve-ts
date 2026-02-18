import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string | null;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

function sendAndReceive(
  proc: ReturnType<typeof spawn>,
  request: Record<string, unknown>,
): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);
    let buffer = "";

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line) as JsonRpcResponse;
            clearTimeout(timeout);
            proc.stdout?.off("data", onData);
            resolve(parsed);
            return;
          } catch {
            // Incomplete line, continue
          }
        }
      }
    };

    proc.stdout?.on("data", onData);
    proc.stdin?.write(JSON.stringify(request) + "\n");
  });
}

describe("integration", () => {
  let tempDir: string;

  beforeAll(() => {
    // Build the project first
    execFileSync("npx", ["tsc"], {
      cwd: path.resolve(import.meta.dirname, ".."),
      timeout: 30000,
    });

    // Create a temp git repo for integration testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcpserve-integ-test-"));
    execFileSync("git", ["init"], { cwd: tempDir });
    execFileSync("git", ["config", "user.email", "test@test.com"], { cwd: tempDir });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: tempDir });
    fs.writeFileSync(path.join(tempDir, "hello.txt"), "Hello!\n");
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "test-integ", version: "1.0.0" }),
    );
    execFileSync("git", ["add", "."], { cwd: tempDir });
    execFileSync("git", ["commit", "-m", "init"], { cwd: tempDir });
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("full MCP handshake: initialize → tools/list → tools/call → resources", async () => {
    const projectRoot = path.resolve(import.meta.dirname, "..");
    const proc = spawn("node", ["dist/index.js"], {
      cwd: projectRoot,
      env: { ...process.env, PROJECT_ROOT: tempDir, LOG_LEVEL: "error" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    try {
      // 1. Initialize
      const initResp = await sendAndReceive(proc, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test-client", version: "0.1.0" },
        },
      });
      expect(initResp.result).toBeDefined();
      expect((initResp.result as Record<string, unknown>).protocolVersion).toBe("2024-11-05");

      // 2. Send initialized notification (no response expected)
      proc.stdin?.write(
        JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }) + "\n",
      );

      // 3. Ping
      const pingResp = await sendAndReceive(proc, {
        jsonrpc: "2.0",
        id: 2,
        method: "ping",
      });
      expect(pingResp.result).toEqual({});

      // 4. List tools
      const toolsResp = await sendAndReceive(proc, {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/list",
      });
      const tools = (toolsResp.result as Record<string, unknown>).tools as Array<{ name: string }>;
      expect(tools.length).toBeGreaterThanOrEqual(8);

      // 5. Call git_status
      const statusResp = await sendAndReceive(proc, {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "git_status", arguments: {} },
      });
      expect(statusResp.result).toBeDefined();

      // 6. Call read_file
      const readResp = await sendAndReceive(proc, {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "read_file", arguments: { path: "hello.txt" } },
      });
      const readResult = readResp.result as { content: Array<{ text: string }> };
      expect(readResult.content[0].text).toBe("Hello!\n");

      // 7. List resources
      const resListResp = await sendAndReceive(proc, {
        jsonrpc: "2.0",
        id: 6,
        method: "resources/list",
      });
      const resources = (resListResp.result as Record<string, unknown>).resources as Array<{ uri: string }>;
      expect(resources.length).toBeGreaterThan(0);

      // 8. Read package.json resource
      const resReadResp = await sendAndReceive(proc, {
        jsonrpc: "2.0",
        id: 7,
        method: "resources/read",
        params: { uri: "project:///package.json" },
      });
      expect(resReadResp.result).toBeDefined();
      const contents = (resReadResp.result as Record<string, unknown>).contents as Array<{ text: string }>;
      const pkgData = JSON.parse(contents[0].text);
      expect(pkgData.name).toBe("test-integ");

      // 9. Unknown method
      const unknownResp = await sendAndReceive(proc, {
        jsonrpc: "2.0",
        id: 8,
        method: "nonexistent/method",
      });
      expect(unknownResp.error).toBeDefined();
      expect(unknownResp.error?.code).toBe(-32601);
    } finally {
      proc.kill();
    }
  });
});
