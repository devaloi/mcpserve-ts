# mcpserve-ts

[![CI](https://github.com/devaloi/mcpserve-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/devaloi/mcpserve-ts/actions/workflows/ci.yml)

A **Model Context Protocol** (MCP) server in TypeScript — hand-rolled JSON-RPC 2.0 over stdio. Exposes Git repository tools and project resource browsing for AI assistants like Claude.

> Part of a portfolio trifecta: [Go](https://github.com/devaloi/mcpserve) · [Python](https://github.com/devaloi/mcpserve-py) · **TypeScript**

## Features

- **Hand-rolled MCP protocol** — JSON-RPC 2.0 over stdio, no SDK dependency
- **8 tools** — Git operations, project browsing, safe shell execution
- **3 resource types** — File contents, package.json, directory tree
- **Path sandboxing** — all file operations confined to project root
- **Zod validation** — strict input validation on every tool call
- **TypeScript strict** — zero `any` types, full type safety
- **Minimal dependencies** — only `zod` at runtime

## Quick Start

```bash
# Install
git clone https://github.com/devaloi/mcpserve-ts.git
cd mcpserve-ts
npm install
npm run build

# Run
PROJECT_ROOT=/path/to/your/project node dist/index.js

# Test
npm test
```

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcpserve-ts": {
      "command": "node",
      "args": ["/path/to/mcpserve-ts/dist/index.js"],
      "env": {
        "PROJECT_ROOT": "/path/to/your/project"
      }
    }
  }
}
```

## Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `git_status` | Show working tree status | `path?` |
| `git_diff` | Show staged or unstaged changes | `path?`, `staged?` |
| `git_log` | Show commit history | `path?`, `limit?` |
| `git_blame` | Show line-by-line authorship | `file` |
| `project_tree` | List directory structure | `path?`, `depth?` |
| `read_file` | Read file contents | `path` |
| `search_files` | Search with regex | `pattern`, `path?`, `glob?` |
| `run_command` | Execute allowlisted commands | `command`, `args?` |

### Shell Allowlist

Only these commands are permitted via `run_command`:
`ls`, `cat`, `wc`, `head`, `tail`, `find`, `grep`

## Resources

| URI | Description | MIME Type |
|-----|-------------|-----------|
| `file:///{path}` | Project file contents | auto-detected |
| `project:///package.json` | Parsed package.json | application/json |
| `project:///tree` | Directory tree | text/plain |

## Architecture

```
src/
├── index.ts              # Entry point: register tools, start stdio
├── server.ts             # MCP server: method dispatch
├── protocol.ts           # JSON-RPC 2.0 types and codec
├── transport.ts          # Stdio transport (line-delimited JSON)
├── config.ts             # Zod-validated env config
├── tools/
│   ├── registry.ts       # Tool registry (name → handler + schema)
│   ├── git.ts            # Git tools: status, diff, log, blame
│   ├── project.ts        # Project tools: tree, read, search
│   └── shell.ts          # Safe shell: allowlisted commands only
├── resources/
│   ├── provider.ts       # Resource provider interface
│   ├── project.ts        # File resources (file:///path)
│   └── package.ts        # package.json + tree resources
├── lib/
│   ├── constants.ts      # Shared constants (limits, skip dirs)
│   ├── git.ts            # Git CLI wrapper (execFile)
│   ├── sandbox.ts        # Path sandboxing
│   ├── schemas.ts        # Zod schemas for tool inputs
│   └── tree.ts           # Shared directory tree builder
```

## MCP Protocol

Implements the [Model Context Protocol](https://modelcontextprotocol.io/) specification:

- **Transport:** JSON-RPC 2.0 over stdio (newline-delimited JSON)
- **Protocol version:** `2024-11-05`
- **Methods:** `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`
- **Notifications:** `notifications/initialized`

### Example Handshake

```bash
# Initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' | node dist/index.js
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_ROOT` | `cwd` | Root directory for file operations |
| `LOG_LEVEL` | `info` | Log level: debug, info, warn, error |

Logs are written to stderr; stdout is reserved for JSON-RPC messages.

## Development

```bash
npm run build       # Compile TypeScript
npm run dev         # Watch mode
npm run test        # Run tests (Vitest)
npm run typecheck   # Type-check without emitting
npm run lint        # ESLint
make all            # lint + typecheck + build + test
```

## Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 (strict) |
| Protocol | Hand-rolled JSON-RPC 2.0 |
| Validation | Zod |
| Testing | Vitest |
| Linting | ESLint + typescript-eslint |

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). PRs welcome — run `npm test && npm run lint` before submitting.
