# Contributing to mcpserve-ts

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/devaloi/mcpserve-ts.git
cd mcpserve-ts
npm install
npm run build
```

### Prerequisites

- Node.js 20+
- npm 10+

## Running Tests

```bash
npm test          # Run all tests (no real LLM calls)
npm run lint      # Run ESLint
npm run typecheck # TypeScript type checking
```

## Project Structure

```
src/
  server.ts       # MCP server — JSON-RPC 2.0 over stdio
  tools/          # Tool implementations (Git, filesystem)
  resources/      # Resource handlers
tests/            # Unit tests (vitest)
```

## Adding a New Tool

1. Implement the handler in `src/tools/`
2. Register it in `src/server.ts` tool list
3. Add tests in `tests/tools/`
4. Update README tool reference table

## Pull Request Guidelines

- One feature or fix per PR
- Run `npm test && npm run lint` before submitting
- Add tests for new tools or handlers

## Reporting Issues

Open a GitHub issue with Node.js version, steps to reproduce, and expected vs actual behavior.
