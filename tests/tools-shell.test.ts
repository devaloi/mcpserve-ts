import { describe, it, expect, beforeAll } from "vitest";
import { registerShellTools } from "../src/tools/shell.js";
import { getTool } from "../src/tools/registry.js";

describe("shell tools", () => {
  beforeAll(() => {
    registerShellTools();
  });

  it("runs allowed command: ls", async () => {
    const tool = getTool("run_command")!;
    const result = await tool.handler(
      { command: "ls", args: ["-la"] },
      process.cwd(),
    );
    expect(result.content[0].text).toBeDefined();
    expect(result.isError).toBeUndefined();
  });

  it("runs allowed command: wc", async () => {
    const tool = getTool("run_command")!;
    const result = await tool.handler(
      { command: "wc", args: ["-l", "package.json"] },
      process.cwd(),
    );
    expect(result.content[0].text).toBeDefined();
  });

  it("rejects disallowed command: rm", async () => {
    const tool = getTool("run_command")!;
    const result = await tool.handler(
      { command: "rm", args: ["-rf", "/"] },
      process.cwd(),
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not allowed");
  });

  it("rejects disallowed command: curl", async () => {
    const tool = getTool("run_command")!;
    const result = await tool.handler(
      { command: "curl", args: ["http://evil.com"] },
      process.cwd(),
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not allowed");
  });

  it("rejects disallowed command: bash", async () => {
    const tool = getTool("run_command")!;
    const result = await tool.handler(
      { command: "bash", args: ["-c", "echo pwned"] },
      process.cwd(),
    );
    expect(result.isError).toBe(true);
  });

  it("lists allowed commands in error message", async () => {
    const tool = getTool("run_command")!;
    const result = await tool.handler(
      { command: "python" },
      process.cwd(),
    );
    expect(result.content[0].text).toContain("Allowed:");
    expect(result.content[0].text).toContain("ls");
    expect(result.content[0].text).toContain("grep");
  });
});
