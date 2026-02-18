# A03: mcpserve-ts — MCP Server in TypeScript

**Catalog ID:** A03 | **Size:** M | **Language:** TypeScript
**Repo name:** `mcpserve-ts`
**One-liner:** A Model Context Protocol server in TypeScript using the official MCP SDK — exposes Git repository tools and project resource browsing.

---

## Why This Stands Out

- **Completes the MCP trifecta** — Go, Python, and TypeScript MCP servers show full-stack AI tooling fluency
- **Official MCP TypeScript SDK** — proper use of `@modelcontextprotocol/sdk`
- **Git tools** — status, diff, log, blame — useful for AI-assisted code review
- **Project resources** — browse project structure, read files, package.json as resources
- **TypeScript strict** — no `any`, Zod validation on tool inputs
- **Well-structured** — clean module boundaries, dependency injection

---

## Architecture

```
mcpserve-ts/
├── src/
│   ├── index.ts                  # Entry: create server, register tools, start stdio
│   ├── server.ts                 # MCP server setup with SDK
│   ├── config.ts                 # Typed config from env
│   ├── tools/
│   │   ├── git.ts                # Git tools (status, diff, log, blame)
│   │   ├── git.test.ts
│   │   ├── project.ts            # Project tools (tree, read file, search)
│   │   ├── project.test.ts
│   │   ├── shell.ts              # Safe shell command execution (allowlist)
│   │   └── shell.test.ts
│   ├── resources/
│   │   ├── project.ts            # Project file resources (file:///path)
│   │   ├── package.ts            # package.json as structured resource
│   │   └── resources.test.ts
│   ├── lib/
│   │   ├── git.ts                # Git command runner (wraps child_process)
│   │   ├── sandbox.ts            # Path sandboxing: prevent traversal
│   │   └── schemas.ts            # Zod schemas for tool inputs
│   └── types/
│       └── index.ts              # Shared types
├── tests/
│   ├── setup.ts                  # Test fixtures: temp git repos
│   └── integration.test.ts       # End-to-end MCP protocol tests
├── examples/
│   └── claude_config.json        # Claude Desktop config example
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── .env.example
├── .gitignore
├── .eslintrc.json
├── LICENSE
└── README.md
```

---

## Tools Provided

| Tool | Description | Parameters |
|------|-------------|------------|
| `git_status` | Show working tree status | `{ path?: string }` |
| `git_diff` | Show changes (staged or unstaged) | `{ path?: string, staged?: boolean }` |
| `git_log` | Show commit history | `{ path?: string, limit?: number }` |
| `git_blame` | Show line-by-line authorship | `{ file: string }` |
| `project_tree` | List project directory structure | `{ path?: string, depth?: number }` |
| `read_file` | Read file contents | `{ path: string }` |
| `search_files` | Search file contents with regex | `{ pattern: string, path?: string, glob?: string }` |
| `run_command` | Execute allowlisted shell commands | `{ command: string, args?: string[] }` |

## Resources Provided

| URI Pattern | Description |
|-------------|-------------|
| `file:///{path}` | Project file contents |
| `project:///package.json` | Parsed package.json as structured data |
| `project:///tree` | Project directory tree |

---

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5+ (strict) |
| MCP SDK | @modelcontextprotocol/sdk |
| Validation | Zod |
| Git | child_process (git CLI wrapper) |
| Testing | Vitest |
| Linting | ESLint + Prettier |

---

## Phased Build Plan

### Phase 1: Foundation

**1.1 — Project setup**
- npm init, TypeScript strict, ESLint, Vitest
- Install @modelcontextprotocol/sdk, zod
- Scripts: build, dev, test, lint

**1.2 — MCP server shell**
- Create MCP server with SDK's `Server` class
- Stdio transport setup
- Register capabilities (tools, resources)
- Test: server initializes, responds to ping

### Phase 2: Git Tools

**2.1 — Git command runner**
- Async wrapper around `child_process.execFile`
- Run git commands in configurable working directory
- Timeout + error handling
- Tests: run git status on test repo

**2.2 — Git tools**
- `git_status` — parse `git status --porcelain`
- `git_diff` — return diff output (staged or working tree)
- `git_log` — parse `git log --oneline` with limit
- `git_blame` — parse `git blame` output into structured data
- Zod input validation for each tool
- Tests: each tool against a temp git repo with known state

### Phase 3: Project Tools

**3.1 — Path sandboxing**
- Resolve paths relative to configured root
- Reject `..` traversal outside root
- Tests: valid paths pass, traversal blocked

**3.2 — Project tools**
- `project_tree` — recursive directory listing with depth limit, skip node_modules/.git
- `read_file` — read with size limit, detect binary
- `search_files` — ripgrep-style recursive search with glob filter
- `run_command` — execute from allowlist only (ls, cat, wc, head, tail)
- Tests: tree output, file read, search matches, blocked commands

### Phase 4: Resources

**4.1 — File resources**
- List files in project root as resources
- Read by `file:///` URI
- MIME type detection

**4.2 — Package resources**
- `project:///package.json` — return parsed JSON
- `project:///tree` — return directory tree as text
- Tests: list, read, parse

### Phase 5: Polish

**5.1 — Integration tests**
- Simulated MCP client: initialize → list tools → call git tools → read resources
- Test with temp git repo fixture

**5.2 — README**
- Badges, install, Claude Desktop config
- Tool reference table
- Setup instructions (requires git in PATH)

---

## Commit Plan

1. `chore: scaffold project with MCP SDK`
2. `feat: add MCP server shell with stdio transport`
3. `feat: add git command runner`
4. `feat: add git tools (status, diff, log, blame)`
5. `feat: add path sandboxing`
6. `feat: add project tools (tree, read, search, shell)`
7. `feat: add file and package resources`
8. `test: add integration tests`
9. `docs: add README with tool reference`
