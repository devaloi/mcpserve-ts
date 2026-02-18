// JSON-RPC 2.0 types and MCP protocol constants

export const JSONRPC_VERSION = "2.0" as const;

// --- JSON-RPC 2.0 Error Codes ---
export const ErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

// --- JSON-RPC 2.0 Types ---

export interface JsonRpcRequest {
  jsonrpc: typeof JSONRPC_VERSION;
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcNotification {
  jsonrpc: typeof JSONRPC_VERSION;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

// --- Codec ---

export function parseMessage(
  line: string,
): JsonRpcRequest | JsonRpcNotification {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw makeError(ErrorCode.ParseError, "Invalid JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("jsonrpc" in parsed) ||
    (parsed as Record<string, unknown>).jsonrpc !== JSONRPC_VERSION
  ) {
    throw makeError(ErrorCode.InvalidRequest, "Invalid JSON-RPC 2.0 message");
  }

  const msg = parsed as Record<string, unknown>;

  if (typeof msg.method !== "string") {
    throw makeError(ErrorCode.InvalidRequest, "Missing method");
  }

  // Notification (no id)
  if (!("id" in msg) || msg.id === undefined) {
    return {
      jsonrpc: JSONRPC_VERSION,
      method: msg.method,
      params: (msg.params as Record<string, unknown>) ?? undefined,
    };
  }

  // Request (has id)
  return {
    jsonrpc: JSONRPC_VERSION,
    id: msg.id as string | number,
    method: msg.method,
    params: (msg.params as Record<string, unknown>) ?? undefined,
  };
}

export function isRequest(
  msg: JsonRpcRequest | JsonRpcNotification,
): msg is JsonRpcRequest {
  return "id" in msg && msg.id !== undefined;
}

export function makeResponse(
  id: string | number | null,
  result: unknown,
): JsonRpcResponse {
  return { jsonrpc: JSONRPC_VERSION, id, result };
}

export function makeErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
  };
}

export function makeError(code: number, message: string): JsonRpcError {
  return { code, message };
}

export function encodeResponse(response: JsonRpcResponse): string {
  return JSON.stringify(response);
}
