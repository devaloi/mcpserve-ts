import fs from "node:fs";
import path from "node:path";
import type { ResourceProvider, ResourceDefinition, ResourceContent } from "./provider.js";
import { buildTree } from "../lib/tree.js";

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
    buildTree(this.root, "", 3, 0, lines);
    return { uri: "project:///tree", mimeType: "text/plain", text: lines.join("\n") };
  }
}
