# SkillChain

**Decentralized AI Skill Marketplace — Publish once, works everywhere.**

Skills are validated procedures, not documents. Quality proven by shadow testing, not reviews. Trust earned through competence, not purchased.

## Install

```bash
pip install skillchain
skillchain init
```

## Quick Start

```bash
# Discover skills
skillchain discover --domain development

# Import a skill (validates, installs to your AI)
skillchain import <skill_id>

# Publish your own
skillchain publish ./my-skill/

# Debug a repo (Verified Fix Mode)
skillchain debug ./my-broken-repo

# Launch a business
skillchain launch "My idea" --audience "target market"
```

## Features
- 65+ marketplace skills across 15 domains
- 28 pre-built chains for every role
- 5 AI platform adapters (Claude, GPT, Gemini, Cursor, generic)
- Verified Fix Mode — 5 candidates, tournament selection, proven fixes
- Solopreneur Engine — idea to launchable business
- MCP server for Claude Code integration
- Skill state persistence across sessions
- Neural trust model (GovernanceNet)

## Links
- Website: [velma.ai](https://velma.ai)
- Docs: [velma.ai/docs](https://velma.ai/docs)
- Whitepaper: [velma.ai/whitepaper](https://velma.ai/whitepaper)
