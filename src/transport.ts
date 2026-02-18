import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import {
  type JsonRpcRequest,
  type JsonRpcNotification,
  type JsonRpcResponse,
  parseMessage,
  encodeResponse,
  makeErrorResponse,
  ErrorCode,
} from "./protocol.js";

export type MessageHandler = (
  msg: JsonRpcRequest | JsonRpcNotification,
) => Promise<JsonRpcResponse | null>;

export class StdioTransport {
  private input: Readable;
  private output: Writable;
  private handler: MessageHandler;

  constructor(input: Readable, output: Writable, handler: MessageHandler) {
    this.input = input;
    this.output = output;
    this.handler = handler;
  }

  start(): void {
    const rl = createInterface({ input: this.input, crlfDelay: Infinity });

    rl.on("line", (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      void this.processLine(trimmed);
    });

    rl.on("close", () => {
      process.exit(0);
    });
  }

  private async processLine(line: string): Promise<void> {
    let msg: JsonRpcRequest | JsonRpcNotification;
    try {
      msg = parseMessage(line);
    } catch (err) {
      const error = err as { code?: number; message?: string };
      const resp = makeErrorResponse(
        null,
        error.code ?? ErrorCode.ParseError,
        error.message ?? "Parse error",
      );
      this.send(resp);
      return;
    }

    const response = await this.handler(msg);
    if (response) {
      this.send(response);
    }
  }

  send(response: JsonRpcResponse): void {
    this.output.write(encodeResponse(response) + "\n");
  }
}
