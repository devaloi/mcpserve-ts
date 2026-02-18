import {
  type JsonRpcRequest,
  type JsonRpcNotification,
  type JsonRpcResponse,
  ErrorCode,
  isRequest,
  makeResponse,
  makeErrorResponse,
} from "./protocol.js";
import { MCP_PROTOCOL_VERSION } from "./lib/constants.js";
import { listTools, getTool, zodToJsonSchema } from "./tools/registry.js";
import type { ResourceProvider } from "./resources/provider.js";
import type { Logger } from "./config.js";

export interface ServerOptions {
  name: string;
  version: string;
  root: string;
  resourceProviders: ResourceProvider[];
  logger: Logger;
}

export class McpServer {
  private options: ServerOptions;
  private initialized = false;

  constructor(options: ServerOptions) {
    this.options = options;
  }

  async handleMessage(
    msg: JsonRpcRequest | JsonRpcNotification,
  ): Promise<JsonRpcResponse | null> {
    // Handle notifications (no response)
    if (!isRequest(msg)) {
      this.handleNotification(msg);
      return null;
    }

    const { id, method, params } = msg;

    try {
      switch (method) {
        case "initialize":
          return this.handleInitialize(id);
        case "ping":
          return makeResponse(id, {});
        case "tools/list":
          return this.handleToolsList(id);
        case "tools/call":
          return await this.handleToolsCall(id, params ?? {});
        case "resources/list":
          return this.handleResourcesList(id);
        case "resources/read":
          return await this.handleResourcesRead(id, params ?? {});
        default:
          return makeErrorResponse(
            id,
            ErrorCode.MethodNotFound,
            `Method not found: ${method}`,
          );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.options.logger.error(`Error handling ${method}: ${message}`);
      return makeErrorResponse(id, ErrorCode.InternalError, message);
    }
  }

  private handleNotification(msg: JsonRpcNotification): void {
    if (msg.method === "notifications/initialized") {
      this.initialized = true;
      this.options.logger.info("Client initialized");
    }
  }

  private handleInitialize(id: string | number): JsonRpcResponse {
    return makeResponse(id, {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {
        tools: { listChanged: false },
        resources: { subscribe: false, listChanged: false },
      },
      serverInfo: {
        name: this.options.name,
        version: this.options.version,
      },
    });
  }

  private handleToolsList(id: string | number): JsonRpcResponse {
    const tools = listTools().map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.inputSchema),
    }));
    return makeResponse(id, { tools });
  }

  private async handleToolsCall(
    id: string | number,
    params: Record<string, unknown>,
  ): Promise<JsonRpcResponse> {
    if (typeof params.name !== "string" || !params.name) {
      return makeErrorResponse(id, ErrorCode.InvalidParams, "Missing tool name");
    }
    const toolName = params.name;

    const tool = getTool(toolName);
    if (!tool) {
      return makeErrorResponse(
        id,
        ErrorCode.InvalidParams,
        `Unknown tool: ${toolName}`,
      );
    }

    const toolArgs =
      params.arguments != null && typeof params.arguments === "object"
        ? (params.arguments as Record<string, unknown>)
        : {};

    try {
      const result = await tool.handler(toolArgs, this.options.root);
      return makeResponse(id, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return makeResponse(id, {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      });
    }
  }

  private handleResourcesList(id: string | number): JsonRpcResponse {
    const resources = this.options.resourceProviders.flatMap((p) => p.list());
    return makeResponse(id, { resources });
  }

  private async handleResourcesRead(
    id: string | number,
    params: Record<string, unknown>,
  ): Promise<JsonRpcResponse> {
    if (typeof params.uri !== "string" || !params.uri) {
      return makeErrorResponse(id, ErrorCode.InvalidParams, "Missing uri");
    }
    const uri = params.uri;

    for (const provider of this.options.resourceProviders) {
      const content = await provider.read(uri);
      if (content) {
        return makeResponse(id, {
          contents: [content],
        });
      }
    }

    return makeErrorResponse(
      id,
      ErrorCode.InvalidParams,
      `Resource not found: ${uri}`,
    );
  }
}
