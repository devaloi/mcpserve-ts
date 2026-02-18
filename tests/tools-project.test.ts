import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { registerProjectTools } from "../src/tools/project.js";
import { getTool } from "../src/tools/registry.js";

describe("project tools", () => {
  let tempDir: string;

  beforeAll(() => {
    registerProjectTools();

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcpserve-proj-test-"));
    fs.mkdirSync(path.join(tempDir, "src"));
    fs.writeFileSync(path.join(tempDir, "src", "main.ts"), 'console.log("hello");\n');
    fs.writeFileSync(path.join(tempDir, "README.md"), "# Test\n");
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "test" }),
    );
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("project_tree lists directory structure", async () => {
    const tool = getTool("project_tree")!;
    const result = await tool.handler({}, tempDir);
    const text = result.content[0].text;
    expect(text).toContain("README.md");
    expect(text).toContain("src/");
  });

  it("project_tree respects depth", async () => {
    const tool = getTool("project_tree")!;
    const result = await tool.handler({ depth: 1 }, tempDir);
    const text = result.content[0].text;
    expect(text).toContain("src/");
    expect(text).not.toContain("main.ts");
  });

  it("read_file reads file content", async () => {
    const tool = getTool("read_file")!;
    const result = await tool.handler({ path: "README.md" }, tempDir);
    expect(result.content[0].text).toBe("# Test\n");
  });

  it("read_file rejects path traversal", async () => {
    const tool = getTool("read_file")!;
    await expect(
      tool.handler({ path: "../../etc/passwd" }, tempDir),
    ).rejects.toThrow("Path escapes sandbox");
  });

  it("read_file errors on non-existent file", async () => {
    const tool = getTool("read_file")!;
    await expect(
      tool.handler({ path: "nonexistent.txt" }, tempDir),
    ).rejects.toThrow("File not found");
  });

  it("search_files finds matches", async () => {
    const tool = getTool("search_files")!;
    const result = await tool.handler({ pattern: "hello", path: "src" }, tempDir);
    expect(result.content[0].text).toContain("hello");
  });

  it("search_files returns no matches for missing pattern", async () => {
    const tool = getTool("search_files")!;
    const result = await tool.handler({ pattern: "NOMATCH_xyz123" }, tempDir);
    expect(result.content[0].text).toBe("(no matches)");
  });
});
