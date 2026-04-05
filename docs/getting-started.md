# Getting Started with SkillChain

Set up your node, publish a skill, and start earning in under 10 minutes.

---

## Prerequisites

- Python 3.10 or higher
- pip (any recent version)
- An Ethereum wallet (for mainnet; testnet generates one for you)

---

## Installation

```bash
pip install skillchain
```

This installs the `skillchain` CLI and Python SDK.

Verify the installation:

```bash
skillchain --version
```

---

## Initialize Your Node

```bash
skillchain init
```

You will be prompted for:

1. **Passphrase** -- Encrypts your node's Ed25519 signing key. Do not lose it -- there is no recovery mechanism.
2. **Agent platform** -- Which AI agent you use. This determines where imported skills are installed.

```
Select your AI agent platform:
  [1] Claude Code  (default)
  [2] GPT / ChatGPT
  [3] Gemini
  [4] Cursor
  [5] LangChain / CrewAI
  [6] Local model (LLaMA, Mistral, etc.)
  [7] None (manual install)

Agent platform [1]:
```

You can change this later in `~/.skillchain/config.json` or override per-command with `--agent`.

The command does four things:

1. **Generates your node identity** -- An Ed25519 keypair stored in `~/.skillchain/`
2. **Creates your config** -- Network settings, wallet address, agent platform, domain preferences
3. **Sets your install target** -- Where imported skills land (see table below)
4. **Registers on-chain** -- Your node ID is recorded in the NodeRegistry contract

### Install Locations by Platform

| Platform | Install Location | Format |
|---|---|---|
| Claude Code | `~/.claude/skills/` | Markdown skill file |
| GPT / ChatGPT | `~/.skillchain/gpt/` | Custom instructions JSON |
| Gemini | `~/.skillchain/gemini/` | System instructions |
| Cursor | `.cursor/rules/` (project-local) | Cursor rules markdown |
| LangChain / CrewAI | `~/.skillchain/langchain/` | Tool definition module |
| Local models | `~/.skillchain/local/` | System prompt fragment |
| None | `~/.skillchain/skills/` | Raw `.skillpack` |

Output:

```
SkillChain initialised!
  Node ID:    node_a1b2c3d4...
  Config:     ~/.skillchain/
  Network:    sepolia
  Agent:      claude
  Install:    ~/.claude/skills/
  Wallet:     0x1234...abcd
```

### Network Selection

By default, `init` connects to the Sepolia testnet. To use mainnet:

```bash
skillchain init --network mainnet
```

All subsequent commands inherit the network from your config. Override per-command with `--network`:

```bash
skillchain discover --network mainnet
```

---

## Publishing Your First Skill

### 1. Create the skill directory

A skill is a directory with at minimum a `skill.md` file:

```
my-skill/
  skill.md           # The procedure (required)
  tests/             # Test cases (recommended)
    test_basic.json   # Input/output pairs for shadow validation
  README.md          # Documentation (optional)
```

### 2. Write the skill

`skill.md` contains structured steps that describe the procedure:

```markdown
# Parse CSV Financial Data

## Description
Parse a CSV file containing financial data and extract summary statistics.

## Steps
1. Read the CSV file and detect the delimiter
2. Identify columns containing numeric financial data
3. Compute summary statistics: mean, median, std dev, min, max
4. Flag any outliers beyond 3 standard deviations
5. Return a structured JSON summary

## Domain
financial

## Tags
csv, parsing, statistics, financial-analysis
```

### 3. Add test cases

Create `tests/test_basic.json` with input/output pairs:

```json
{
  "cases": [
    {
      "input": "Date,Revenue,Expenses\n2024-01-01,1000,800\n2024-01-02,1200,900",
      "expected_output_contains": ["mean", "median", "Revenue", "Expenses"]
    }
  ]
}
```

Test cases are used during shadow validation. Validators run your skill against these inputs and compare outputs using similarity scoring.

### 4. Publish

```bash
skillchain publish ./my-skill/ --price 100 --domain financial --tags "csv,parsing,statistics"
```

Options:

| Flag | Default | Description |
|---|---|---|
| `--price` | 0 | Price in TRUST tokens (0 = free) |
| `--domain` | general | Skill domain for discovery |
| `--tags` | (none) | Comma-separated tags |
| `--license` | MIT | License identifier |

Output:

```
Publishing skill...
  Packing .skillpack...
  Done!

Published! Skill ID: 42
```

Your skill is now on the network. Validators will pick it up from the validation queue and run shadow tests against it.

---

## Writing Your First Skill

Every SkillChain skill follows a defined execution pattern. A skill is a PROCEDURE with phases, quality gates, and exit criteria -- not a knowledge dump. There are two approved patterns:

### Execution Patterns

**ORPA Loop (Observe-Reason-Plan-Act)** -- Use when the task is reactive: reviewing code, debugging, analyzing logs, auditing dependencies. The skill cycles through gathering data, interpreting it, planning a response, and executing. It may loop when new data is discovered.

**Phase Pipeline** -- Use when the task is generative: scaffolding a project, designing an API, generating tests, writing documentation. Phases flow sequentially from initialization through delivery.

**Quick rule:** Do you know what the output looks like before you start? If yes, use Phase Pipeline. If no, use ORPA.

### Example: A Simple ORPA Skill (Code Review)

Create `code-review/skill.md`:

```markdown
# Code Review

Review a code diff and produce actionable feedback ranked by severity.

## Execution Pattern: ORPA Loop

## Inputs
- diff: string -- The code diff to review
- language: string -- Programming language of the code

## Outputs
- findings: list -- Severity-ranked findings with file paths and descriptions
- summary: string -- One-paragraph overall assessment

## Execution

### OBSERVE: Gather Context
**Entry criteria:** Diff is provided and non-empty.
**Actions:**
1. Read the full diff, identify all changed files
2. Note the scope of changes (new code, refactor, bugfix)
3. Identify the language, frameworks, and patterns in use
**Output:** List of changed files with change type annotations.
**Quality gate:** At least one file identified with changes.

### REASON: Analyze Changes
**Entry criteria:** File list with change annotations is available.
**Actions:**
1. Check each change against known anti-patterns for the language
2. Evaluate naming, structure, error handling, and test coverage
3. Classify each finding by severity (critical, warning, suggestion)
**Output:** Unranked list of findings with severity and evidence.
**Quality gate:** Every finding has a severity and a specific code reference.

### PLAN: Prioritize Feedback
**Entry criteria:** Findings list is populated.
**Actions:**
1. Rank findings by severity (critical first)
2. Group related findings to avoid redundant comments
3. Identify the top 3 most impactful items
**Output:** Ranked, deduplicated findings list.
**Quality gate:** Findings are ordered by severity, no duplicates.

### ACT: Deliver Review
**Entry criteria:** Ranked findings are ready.
**Actions:**
1. Format each finding with file path, line reference, and recommendation
2. Write a one-paragraph summary of overall code quality
3. If critical issues found, recommend blocking merge
**Output:** Formatted review with findings and summary.
**Quality gate:** Every finding has a concrete recommendation.

## Exit Criteria
All changed files have been reviewed. Every finding has a severity, location, and recommendation. Summary is written.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Diff is empty or unparseable | Abort with error message |
| REASON | Unknown language/framework | Continue with general patterns, note limitation |
| ACT | Too many findings (>50) | Group by category, summarize instead of listing all |
```

Create `code-review/tests/test_basic.json`:

```json
{
  "cases": [
    {
      "input": "diff --git a/app.py\n+    password = 'hardcoded123'\n+    eval(user_input)",
      "expected_output_contains": ["critical", "hardcoded", "eval", "security"]
    }
  ]
}
```

Set the `execution_pattern` in your `manifest.json`:

```json
{
  "name": "code-review",
  "version": "1.0.0",
  "domain": "development",
  "description": "Review code diffs and produce severity-ranked actionable feedback.",
  "execution_pattern": "orpa",
  "tags": ["code-review", "quality", "development"],
  "inputs": ["diff", "language"],
  "outputs": ["findings", "summary"],
  "price": 50,
  "license": "MIT"
}
```

Then publish:

```bash
skillchain publish ./code-review/ --price 50 --domain development --tags "code-review,quality"
```

For the full execution standard with templates, pattern selection guide, and all required elements, see the [Skill Execution Standard](skill-execution-standard.md).

---

## Discovering Skills

### Basic search

```bash
skillchain discover
```

This returns the top 20 skills sorted by trust and validation count.

### Filtered search

```bash
skillchain discover --domain financial --min-trust 0.6 --max-results 10
```

```bash
skillchain discover --tags "parsing,csv" -q "financial data"
```

| Flag | Description |
|---|---|
| `--domain` | Filter by domain |
| `--tags` | Comma-separated tag filter |
| `--min-trust` | Minimum owner trust score |
| `--max-results` | Max results (default: 20) |
| `-q` / `--query` | Free-text search |

Output:

```
 ID  Name                     Domain      Tags                  Price  Validations  Success  Trust
  42  parse-csv-financial      financial   csv, parsing, stats    100            8      87%   0.72
  67  sec-filing-extractor     financial   sec, edgar, 10-k       250           12      92%   0.81
  89  earnings-call-summary    financial   earnings, nlp          150            6      83%   0.65
```

---

## Importing Skills

```bash
skillchain import 42
```

This downloads the `.skillpack`, runs a local shadow validation, and installs the skill to your configured agent platform's install location. The adapter translates the universal `.skillpack` into the native format for your agent.

```
Importing skill 42...
  Downloading .skillpack...
  Running local shadow validation... PASSED (5/5)
  Adapter: claude
  Installed to: ~/.claude/skills/parse-csv-financial.md
```

### Import to a different agent

```bash
skillchain import 42 --agent gpt
```

This translates the `.skillpack` into GPT custom instructions format instead of your default agent.

### Custom install directory

```bash
skillchain import 42 --target-dir ./my-project/skills/
```

### Skip validation (not recommended)

```bash
skillchain import 42 --skip-validation
```

This skips the local shadow validation. Use only if you trust the publisher and need speed.

---

## Validating Skills

Validators earn 15% of every future purchase of skills they validate. To validate:

```bash
skillchain validate 42
```

This runs 5 shadow executions and reports results:

```
Validation: PASSED

 Run  Similarity  Time (s)  Error
   1       0.872      1.24  -
   2       0.891      1.18  -
   3       0.856      1.31  -
   4       0.903      1.15  -
   5       0.845      1.27  -

Match rate: 100% (5/5)
Avg similarity: 0.873
```

Your attestation is submitted on-chain automatically. You earn trust for accurate validations and lose trust for inaccurate ones.

### Eligibility

You must meet these requirements before you can validate:

- Active for 3+ epochs (~5 hours of participation)
- Published or validated 5+ skills
- Trust score >= 0.40

Check your eligibility with:

```bash
skillchain status
```

---

## Staking

Stake TRUST tokens to unlock higher subscription tiers and increase your network standing:

```bash
skillchain stake 100
```

To unstake:

```bash
skillchain stake 100 --unstake
```

---

## Checking Your Status

```bash
skillchain status
```

Output:

```
SkillChain Node Status
  Node ID:       node_a1b2c3d4...
  Wallet:        0x1234...abcd
  Network:       sepolia
  Balance:       0.450000 ETH
  Trust Score:   0.6821
  Staking Tier:  1
  Config Dir:    ~/.skillchain/
  Domains:       financial, automation
```

### Check another node's trust

```bash
skillchain trust node_xyz789...
```

---

## Subscription Tiers

| Tier | Cost | Daily Limit | How to Subscribe |
|---|---|---|---|
| Explorer | Free | 5 skills/day | Default (no action needed) |
| Builder | 50 TRUST/mo | 50 skills/day | On-chain via Marketplace contract |
| Professional | 200 TRUST/mo | 200 skills/day | On-chain via Marketplace contract |
| Enterprise | Custom | Unlimited | Contact The Wayfinder Trust |

Explorer tier is active by default for all registered nodes.

---

## Project Structure

After init, your SkillChain config lives in `~/.skillchain/`:

```
~/.skillchain/
  config.json         # Network, wallet, domain preferences
  node.key            # Ed25519 signing key (encrypted)
  node_id.txt         # Your node identity
```

Published skills are stored locally before upload:

```
~/.skillchain/published/
  my-skill.skillpack  # Archived skill package
```

Imported skills land in your configured agent platform's install directory (default `~/.claude/skills/` for Claude Code). See the install locations table above for other platforms.

---

## Verbose Mode

Add `-v` to any command for debug logging:

```bash
skillchain -v discover --domain financial
```

---

## Common Issues

### "SkillChainError: no config found"

Run `skillchain init` first.

### "Marketplace: daily limit"

You have hit your subscription tier's daily skill limit. Upgrade your tier or wait until tomorrow (UTC midnight reset).

### "Marketplace: subscription expired"

Renew your subscription through the Marketplace contract. Explorer tier never expires.

### Validation fails with low similarity

Your skill's outputs may be non-deterministic. Add more specific test cases with tighter expected outputs. Shadow validation requires 75% similarity across 5 runs -- if your skill produces different outputs each time, it will struggle to pass.

---

## Next Steps

- Read the [whitepaper](whitepaper.md) for the full protocol specification
- Browse the [landing page](landing-page-copy.md) for an overview of the network
- Join the community to find validators for your skills
- Start building skills and earning TRUST tokens

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
