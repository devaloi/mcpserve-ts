import type { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<unknown>;
  handler: (params: Record<string, unknown>, root: string) => Promise<ToolResult>;
}

export interface ToolResult {
  content: ContentItem[];
  isError?: boolean;
}

export interface ContentItem {
  type: "text";
  text: string;
}

const tools = new Map<string, ToolDefinition>();

export function registerTool(tool: ToolDefinition): void {
  tools.set(tool.name, tool);
}

export function getTool(name: string): ToolDefinition | undefined {
  return tools.get(name);
}

export function listTools(): ToolDefinition[] {
  return Array.from(tools.values());
}

/** Convert a Zod schema to a JSON Schema object for MCP tools/list */
export function zodToJsonSchema(schema: z.ZodType<unknown>): Record<string, unknown> {
  // Simple Zod-to-JSON-Schema converter for our known schemas
  if ("shape" in schema && typeof schema.shape === "object" && schema.shape !== null) {
    const shape = schema.shape as Record<string, z.ZodType<unknown>>;
    const properties: Record<string, Record<string, unknown>> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodFieldToJson(value);
      if (!isOptional(value)) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      ...(required.length > 0 ? { required } : {}),
    };
  }
  return { type: "object" };
}

function isOptional(schema: z.ZodType<unknown>): boolean {
  return schema.isOptional();
}

function zodFieldToJson(schema: z.ZodType<unknown>): Record<string, unknown> {
  const def = schema._def as Record<string, unknown>;

  // Unwrap optional
  if (def.typeName === "ZodOptional") {
    return zodFieldToJson(def.innerType as z.ZodType<unknown>);
  }

  // Unwrap default
  if (def.typeName === "ZodDefault") {
    return zodFieldToJson(def.innerType as z.ZodType<unknown>);
  }

  switch (def.typeName) {
    case "ZodString":
      return { type: "string" };
    case "ZodNumber":
      return { type: "number" };
    case "ZodBoolean":
      return { type: "boolean" };
    case "ZodArray": {
      const items = zodFieldToJson(def.type as z.ZodType<unknown>);
      return { type: "array", items };
    }
    default:
      return { type: "string" };
  }
}
