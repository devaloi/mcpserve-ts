import { describe, it, expect } from "vitest";
import {
  parseMessage,
  makeResponse,
  makeErrorResponse,
  encodeResponse,
  ErrorCode,
  JSONRPC_VERSION,
} from "../src/protocol.js";

describe("protocol", () => {
  describe("parseMessage", () => {
    it("parses a valid request", () => {
      const msg = parseMessage(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "test",
          params: { foo: "bar" },
        }),
      );
      expect(msg).toEqual({
        jsonrpc: "2.0",
        id: 1,
        method: "test",
        params: { foo: "bar" },
      });
    });

    it("parses a notification (no id)", () => {
      const msg = parseMessage(
        JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      );
      expect(msg).toEqual({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: undefined,
      });
    });

    it("throws on invalid JSON", () => {
      expect(() => parseMessage("{bad json")).toThrow();
    });

    it("throws on missing jsonrpc version", () => {
      expect(() =>
        parseMessage(JSON.stringify({ id: 1, method: "test" })),
      ).toThrow();
    });

    it("throws on missing method", () => {
      expect(() =>
        parseMessage(JSON.stringify({ jsonrpc: "2.0", id: 1 })),
      ).toThrow();
    });
  });

  describe("makeResponse", () => {
    it("creates a success response", () => {
      const resp = makeResponse(1, { data: "ok" });
      expect(resp).toEqual({
        jsonrpc: JSONRPC_VERSION,
        id: 1,
        result: { data: "ok" },
      });
    });
  });

  describe("makeErrorResponse", () => {
    it("creates an error response", () => {
      const resp = makeErrorResponse(2, ErrorCode.MethodNotFound, "Not found");
      expect(resp).toEqual({
        jsonrpc: JSONRPC_VERSION,
        id: 2,
        error: { code: -32601, message: "Not found" },
      });
    });

    it("includes data when provided", () => {
      const resp = makeErrorResponse(3, ErrorCode.InternalError, "fail", {
        detail: "extra",
      });
      expect(resp.error?.data).toEqual({ detail: "extra" });
    });
  });

  describe("encodeResponse", () => {
    it("serializes to JSON string", () => {
      const resp = makeResponse(1, "ok");
      const encoded = encodeResponse(resp);
      expect(JSON.parse(encoded)).toEqual(resp);
    });
  });

  describe("error codes", () => {
    it("has correct values", () => {
      expect(ErrorCode.ParseError).toBe(-32700);
      expect(ErrorCode.InvalidRequest).toBe(-32600);
      expect(ErrorCode.MethodNotFound).toBe(-32601);
      expect(ErrorCode.InvalidParams).toBe(-32602);
      expect(ErrorCode.InternalError).toBe(-32603);
    });
  });
});
