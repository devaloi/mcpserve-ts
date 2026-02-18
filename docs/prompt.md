# Build mcpserve-ts — MCP Server in TypeScript

You are building a **portfolio project** for a Senior AI Engineer's public GitHub. It must be impressive, clean, and production-grade. Read these docs before writing any code:

1. **`A03-mcp-server-typescript.md`** — Complete project spec: architecture, phases, Git tools, project resources, commit plan. This is your primary blueprint. Follow it phase by phase.
2. **`github-portfolio.md`** — Portfolio goals and Definition of Done (Level 1 + Level 2). Understand the quality bar.
3. **`github-portfolio-checklist.md`** — Pre-publish checklist. Every item must pass before you're done.

---

## Instructions

### Read first, build second
Read all three docs completely before writing a single line of code. Understand the MCP SDK usage, the Git CLI wrapper pattern, Zod validation, and the resource system.

### Follow the phases in order
The project spec has 5 phases. Do them in order:
1. **Foundation** — project setup (TypeScript strict, ESM), MCP SDK server skeleton, config, types
2. **Git Tools** — git status, git log, git diff, git blame tools via child_process git CLI wrapper
3. **Project Tools** — file tree, dependency analysis (package.json/go.mod), TODO finder
4. **Resources** — project README as resource, directory listing resource, git branch list resource
5. **Polish** — comprehensive Vitest tests, refactor, README

### Commit frequently
Follow the commit plan in the spec. Use **conventional commits**. Each commit should be a logical unit.

### Quality non-negotiables
- **Official MCP SDK.** Use `@modelcontextprotocol/sdk`. This shows you know the TypeScript ecosystem tools.
- **TypeScript strict mode.** Zero `any` types. Strict null checks. Full type safety.
- **Zod validation.** All tool inputs validated with Zod schemas. Parse, don't validate.
- **Git CLI wrapper.** Tools execute `git` commands via `child_process.execFile`. Parse output into structured data. Don't shell out with `exec` — use `execFile` for safety.
- **Real tool implementations.** git status returns parsed status. git log returns structured commits. Not string dumps.
- **Comprehensive Vitest tests.** Mock child_process for git tests. Test tool registration, input validation, output format.
- **ESM throughout.** ES modules, not CommonJS. `"type": "module"` in package.json.
- **Lint clean.** ESLint + Prettier. `tsc --noEmit` passes. Zero warnings.
- **No Docker.** Just `npm install` and `npm start`.

### What NOT to do
- Don't implement JSON-RPC yourself. Use the MCP SDK.
- Don't use `exec()` for git commands. Use `execFile()` for security.
- Don't use `any` anywhere. TypeScript strict mode means strict.
- Don't skip Zod validation. Every tool input must be validated.
- Don't commit `node_modules/` or `.env` files.
- Don't leave `// TODO` or `// FIXME` comments anywhere.

---

## GitHub Username

The GitHub username is **devaloi**. For npm scripts and package.json, use package name `mcpserve-ts`. For any GitHub URLs, use `github.com/devaloi/mcpserve-ts`.

## Start

Read the three docs. Then begin Phase 1 from `A03-mcp-server-typescript.md`.
