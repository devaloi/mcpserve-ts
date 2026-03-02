# Changelog

All notable changes to mcpserve-ts are documented here.

## [0.2.0] - 2026-02-20

### Added
- Git diff and git log tools
- Project resource browser with directory listing
- GitHub Actions CI pipeline

### Changed
- Improved JSON-RPC error handling with proper error codes
- Stdio transport now handles partial reads correctly

## [0.1.0] - 2026-02-18

### Added
- MCP server with JSON-RPC 2.0 over stdio (hand-rolled, no SDK)
- Git tools: `git_status`, `git_log`, `git_diff`
- Resource handlers: `project://` URI scheme
- TypeScript strict mode throughout
- Vitest test suite with no real LLM calls
- ESLint + typescript-eslint configuration
- MIT License
