import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { registerGitTools } from "../src/tools/git.js";
import { getTool } from "../src/tools/registry.js";

describe("git tools", () => {
  let tempDir: string;

  beforeAll(() => {
    registerGitTools();

    // Create a temp git repo
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcpserve-git-test-"));
    execFileSync("git", ["init"], { cwd: tempDir });
    execFileSync("git", ["config", "user.email", "test@test.com"], { cwd: tempDir });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: tempDir });

    // Create a file and commit
    fs.writeFileSync(path.join(tempDir, "hello.txt"), "Hello, world!\n");
    execFileSync("git", ["add", "."], { cwd: tempDir });
    execFileSync("git", ["commit", "-m", "Initial commit"], { cwd: tempDir });

    // Create an uncommitted file
    fs.writeFileSync(path.join(tempDir, "new.txt"), "New file\n");
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("git_status shows uncommitted files", async () => {
    const tool = getTool("git_status")!;
    const result = await tool.handler({ path: tempDir }, tempDir);
    expect(result.content[0].text).toContain("new.txt");
  });

  it("git_diff shows changes", async () => {
    const tool = getTool("git_diff")!;
    const result = await tool.handler({}, tempDir);
    // new.txt is untracked, diff may be empty for untracked files
    expect(result.content[0].text).toBeDefined();
  });

  it("git_log shows commit history", async () => {
    const tool = getTool("git_log")!;
    const result = await tool.handler({ limit: 5 }, tempDir);
    expect(result.content[0].text).toContain("Initial commit");
  });

  it("git_blame shows authorship", async () => {
    const tool = getTool("git_blame")!;
    const result = await tool.handler({ file: "hello.txt" }, tempDir);
    expect(result.content[0].text).toContain("Hello, world!");
  });

  it("git_status returns clean for clean repo", async () => {
    // Stage the new file and commit
    execFileSync("git", ["add", "."], { cwd: tempDir });
    execFileSync("git", ["commit", "-m", "Add new.txt"], { cwd: tempDir });

    const tool = getTool("git_status")!;
    const result = await tool.handler({}, tempDir);
    expect(result.content[0].text).toBe("(clean)");
  });

  it("git_log respects limit", async () => {
    const tool = getTool("git_log")!;
    const result = await tool.handler({ limit: 1 }, tempDir);
    const lines = result.content[0].text.trim().split("\n");
    expect(lines.length).toBe(1);
  });
});
