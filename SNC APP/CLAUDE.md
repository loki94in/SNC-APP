# Development Workflow Reference

## Core Tools
- **graphify** — knowledge graph from codebase (49x token reduction)
- **claude-mem** — persistent cross-session memory
- **gstack** — workflow tools: /office-hours, /plan, /code-review, /ship, /browse, /qa, /retro
- **security-guidance** — auto-scans all code edits for vulnerabilities

## Key Commands
| Command | Purpose |
|---------|---------|
| `/office-hours` | Plan with gstack |
| `/code-review` | 5-agent parallel review before PR |
| `/ship` | Deploy to gstack |
| `graphify .` | Rebuild knowledge graph after major changes |
| `/browse` | Web browsing via gstack |

## Prerequisites
- Node.js 18+, Python 3.8+, Bun runtime
- Optional: Docker, Git

## Workflow Notes
- Security scans run automatically on every edit
- Frontend uses frontend-design skill for production-grade UI
- Context persists via claude-mem
- No manual intervention needed for security scanning
