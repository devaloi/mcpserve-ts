import fs from "node:fs";
import path from "node:path";
import type { ResourceProvider, ResourceDefinition, ResourceContent } from "./provider.js";

export class PackageResourceProvider implements ResourceProvider {
  constructor(private root: string) {}

  list(): ResourceDefinition[] {
    const resources: ResourceDefinition[] = [
      {
        uri: "project:///package.json",
        name: "package.json",
        description: "Parsed package.json as structured data",
        mimeType: "application/json",
      },
      {
        uri: "project:///tree",
        name: "Project tree",
        description: "Project directory tree",
        mimeType: "text/plain",
      },
    ];
    return resources;
  }

  async read(uri: string): Promise<ResourceContent | null> {
    if (uri === "project:///package.json") {
      return this.readPackageJson();
    }
    if (uri === "project:///tree") {
      return this.readTree();
    }
    return null;
  }

  private readPackageJson(): ResourceContent | null {
    const pkgPath = path.join(this.root, "package.json");
    if (!fs.existsSync(pkgPath)) {
      return null;
    }
    const text = fs.readFileSync(pkgPath, "utf-8");
    return { uri: "project:///package.json", mimeType: "application/json", text };
  }

  private readTree(): ResourceContent {
    const lines: string[] = [];
    this.buildTree(this.root, "", 3, 0, lines);
    return { uri: "project:///tree", mimeType: "text/plain", text: lines.join("\n") };
  }

  private buildTree(
    dir: string,
    prefix: string,
    maxDepth: number,
    depth: number,
    lines: string[],
  ): void {
    if (depth >= maxDepth) return;
    const SKIP = new Set(["node_modules", ".git", "dist"]);

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry.name.startsWith(".") && entry.isDirectory()) continue;
      if (SKIP.has(entry.name)) continue;

      const isLast = i === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const suffix = entry.isDirectory() ? "/" : "";
      lines.push(`${prefix}${connector}${entry.name}${suffix}`);

      if (entry.isDirectory()) {
        const newPrefix = prefix + (isLast ? "    " : "│   ");
        this.buildTree(
          path.join(dir, entry.name),
          newPrefix,
          maxDepth,
          depth + 1,
          lines,
        );
      }
    }
  }
}
