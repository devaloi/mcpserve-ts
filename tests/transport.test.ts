import { describe, it, expect } from "vitest";
import { PassThrough } from "node:stream";
import { StdioTransport } from "../src/transport.js";
import type { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse } from "../src/protocol.js";
import { JSONRPC_VERSION } from "../src/protocol.js";

describe("StdioTransport", () => {
  function createTransport(handler: (msg: JsonRpcRequest | JsonRpcNotification) => Promise<JsonRpcResponse | null>) {
    const input = new PassThrough();
    const output = new PassThrough();
    const transport = new StdioTransport(input, output, handler);
    return { input, output, transport };
  }

  function collectOutput(output: PassThrough): Promise<string> {
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      output.on("data", (chunk: Buffer) => chunks.push(chunk));
      setTimeout(() => resolve(Buffer.concat(chunks).toString()), 100);
    });
  }

  it("reads line-delimited JSON and sends response", async () => {
    const { input, output, transport } = createTransport(async (msg) => {
      if ("id" in msg) {
        return { jsonrpc: JSONRPC_VERSION, id: msg.id, result: "ok" };
      }
      return null;
    });

    transport.start();

    const request = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "ping",
    });
    input.write(request + "\n");

    const result = await collectOutput(output);
    const parsed = JSON.parse(result.trim());
    expect(parsed).toEqual({ jsonrpc: "2.0", id: 1, result: "ok" });
  });

  it("handles notifications without sending a response", async () => {
    const { input, output, transport } = createTransport(async () => null);

    transport.start();

    const notification = JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });
    input.write(notification + "\n");

    const result = await collectOutput(output);
    expect(result).toBe("");
  });

  it("handles invalid JSON with error response", async () => {
    const { input, output, transport } = createTransport(async () => null);

    transport.start();

    input.write("{bad json\n");

    const result = await collectOutput(output);
    const parsed = JSON.parse(result.trim());
    expect(parsed.error).toBeDefined();
    expect(parsed.error.code).toBe(-32700);
  });

  it("skips empty lines", async () => {
    const { input, output, transport } = createTransport(async () => null);

    transport.start();

    input.write("\n\n\n");

    const result = await collectOutput(output);
    expect(result).toBe("");
  });
});
