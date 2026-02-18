import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ProjectFileProvider } from "../src/resources/project.js";
import { PackageResourceProvider } from "../src/resources/package.js";

describe("resources", () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mcpserve-res-test-"));
    fs.writeFileSync(path.join(tempDir, "README.md"), "# Hello\n");
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "test-pkg", version: "1.0.0" }),
    );
    fs.mkdirSync(path.join(tempDir, "src"));
    fs.writeFileSync(path.join(tempDir, "src", "index.ts"), "export {};\n");
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe("ProjectFileProvider", () => {
    it("lists files as resources", () => {
      const provider = new ProjectFileProvider(tempDir);
      const resources = provider.list();
      expect(resources.length).toBeGreaterThan(0);
      const uris = resources.map((r) => r.uri);
      expect(uris).toContain("file:///README.md");
      expect(uris).toContain("file:///package.json");
    });

    it("reads a file resource", async () => {
      const provider = new ProjectFileProvider(tempDir);
      const content = await provider.read("file:///README.md");
      expect(content).not.toBeNull();
      expect(content?.text).toBe("# Hello\n");
      expect(content?.mimeType).toBe("text/markdown");
    });

    it("returns null for non-existent file", async () => {
      const provider = new ProjectFileProvider(tempDir);
      const content = await provider.read("file:///nonexistent.txt");
      expect(content).toBeNull();
    });

    it("returns null for path traversal", async () => {
      const provider = new ProjectFileProvider(tempDir);
      const content = await provider.read("file:///../../etc/passwd");
      expect(content).toBeNull();
    });
  });

  describe("PackageResourceProvider", () => {
    it("lists package and tree resources", () => {
      const provider = new PackageResourceProvider(tempDir);
      const resources = provider.list();
      const uris = resources.map((r) => r.uri);
      expect(uris).toContain("project:///package.json");
      expect(uris).toContain("project:///tree");
    });

    it("reads package.json", async () => {
      const provider = new PackageResourceProvider(tempDir);
      const content = await provider.read("project:///package.json");
      expect(content).not.toBeNull();
      expect(content?.mimeType).toBe("application/json");
      const parsed = JSON.parse(content!.text);
      expect(parsed.name).toBe("test-pkg");
    });

    it("reads project tree", async () => {
      const provider = new PackageResourceProvider(tempDir);
      const content = await provider.read("project:///tree");
      expect(content).not.toBeNull();
      expect(content?.text).toContain("README.md");
    });

    it("returns null for unknown URI", async () => {
      const provider = new PackageResourceProvider(tempDir);
      const content = await provider.read("project:///unknown");
      expect(content).toBeNull();
    });
  });
});
