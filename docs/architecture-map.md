# SkillChain Architecture Map

Generated: 2026-03-31
Mapper: codebase-mapper (ORPA pattern)

---

## 1. Directory Tree

```
skillchain/                          # Root — Decentralized AI Skill-Sharing Network
|
|-- protocol/                        # P2P network protocol layer (3,622 LoC + 1,155 test LoC)
|   |-- __init__.py                  # Re-exports all protocol types
|   |-- config.py                    # Network constants (block time, DHT params, trust thresholds)
|   |-- identity.py                  # Ed25519 keypair, node ID, Fernet-encrypted keystore
|   |-- discovery.py                 # Kademlia DHT (k=20, alpha=3) for peer discovery
|   |-- messages.py                  # Signed wire-format messages (Ed25519 + freshness check)
|   |-- trust.py                     # ALG trust: exp(-5.0 * divergence) + EMA(0.15)
|   |-- consensus.py                 # Trust-weighted BFT (Tendermint-style, 2/3 supermajority)
|   |-- blocks.py                    # Block structure, SQLite chain storage, Merkle state root
|   |-- validation.py                # Network SkillShadower (sandboxed validation + disputes)
|   |-- sybil.py                     # Sybil detection (attestation diversity, temporal clustering)
|   +-- tests/                       # 5 test files (identity, trust, blocks, validation, consensus)
|
|-- sdk/                             # Python SDK + CLI (7,567 LoC + 4,454 test LoC)
|   |-- __init__.py                  # Public API surface (SkillChainNode, SkillChain, adapters, etc.)
|   |-- cli.py                       # Click CLI — 20+ commands across 8 command groups (1,890 LoC)
|   |-- config.py                    # ~/.skillchain/ config management, network presets (Base Sepolia/Mainnet)
|   |-- exceptions.py                # SkillChainError hierarchy
|   |-- node.py                      # SkillChainNode — primary entry point (register, publish, import, validate)
|   |-- chain_client.py              # Web3.py client for on-chain interactions (gas, nonce, retry)
|   |-- ipfs_client.py               # Pinata-compatible IPFS upload/download with hash verification
|   |-- skill_discovery.py           # GraphQL + chain-event fallback skill search (5min cache)
|   |-- skill_packer.py              # .skillpack ZIP format (manifest + skill.md + tests + provenance)
|   |-- shadow_runner.py             # Sandboxed skill validation (Jaccard + bigram similarity)
|   |-- skill_chain.py               # DAG pipeline composition (multi-skill chaining)
|   |-- skill_state.py               # Persistent per-skill state (~/.skillchain/state/)
|   |-- adapters.py                  # Platform adapters (Claude, GPT, Gemini, Cursor, Generic)
|   |-- agent_social.py              # Agent-to-agent social layer (profiles, messaging, bounties, teams)
|   |-- user_profile.py              # Local user profile + role-based skill recommendations
|   |-- trust_reporter.py            # Background trust attestation daemon (batched, EMA-smoothed)
|   |-- hooks.py                     # Claude Code hook integration (auto-pack on skill write)
|   |-- run_mcp.py                   # Standalone MCP server launcher
|   |-- contracts/                   # ABI + address bindings for on-chain contracts
|   |   |-- abis.py                  # Contract ABIs (852 LoC)
|   |   +-- addresses.py             # Deployed contract addresses per network
|   |-- mcp_bridge/                  # MCP server for Claude Code integration
|   |   |-- __init__.py
|   |   |-- config.py                # Server name/version/port (3179)
|   |   |-- server.py                # FastMCP server: 6 resources + tools (539 LoC)
|   |   |-- claude_settings.py       # Install/uninstall MCP in ~/.claude/settings.json
|   |   +-- tests/                   # MCP server tests
|   |-- templates/                   # Skill file templates
|   +-- tests/                       # 10 test files covering all SDK modules
|
|-- contracts/                       # Solidity smart contracts (2,977 src LoC + 1,082 test LoC)
|   |-- foundry.toml                 # Foundry config (solc 0.8.24, optimizer 200 runs, via_ir)
|   |-- src/
|   |   |-- SkillToken.sol           # ERC-20 "TRUST" token — 1B cap, vesting, burn, permit
|   |   |-- NodeRegistry.sol         # Node registration with 100 TRUST minimum stake
|   |   |-- SkillRegistry.sol        # On-chain skill metadata (versioning, deactivation)
|   |   |-- ValidationRegistry.sol   # Shadow validation records + dispute arbitration
|   |   |-- TrustOracle.sol          # Weighted-median trust aggregation (ring buffer, 50 attestations)
|   |   |-- Marketplace.sol          # Skill purchasing (70/15/10/5 creator/validator/treasury/burn)
|   |   |-- Staking.sol              # Tiered staking (Bronze-Platinum) with slashing
|   |   |-- GovernanceDAO.sol        # Trust-weighted governance (sqrt(stake) * trust * log2(rep))
|   |   |-- SkillBounty.sol          # On-chain bounty board with escrow + arbitration
|   |   |-- LifeRewards.sol          # Life Protocol — Proof of Living rewards (6 categories)
|   |   +-- libraries/
|   |       |-- TrustMath.sol        # Fixed-point exp-decay + EMA (Taylor series, WAD)
|   |       +-- MerkleVerifier.sol   # Merkle proof verification
|   |-- test/                        # Foundry tests (6 files)
|   |   |-- SkillRegistry.t.sol
|   |   |-- ValidationRegistry.t.sol
|   |   |-- Staking.t.sol
|   |   |-- SkillToken.t.sol
|   |   |-- TrustOracle.t.sol
|   |   +-- Marketplace.t.sol
|   +-- script/
|       +-- Deploy.s.sol             # Full deployment script (wires all contracts)
|
|-- graduation/                      # Skill graduation pipeline (1,583 LoC + 817 test LoC)
|   |-- __init__.py                  # Re-exports pipeline components
|   |-- config.py                    # Thresholds (promotion=3x, deployment=80%, quarantine=0.3)
|   |-- pattern_tracker.py           # Track repeated task patterns for skill extraction
|   |-- skill_generator.py           # Template-based Python code generation (no LLM required)
|   |-- skill_runner.py              # Sandboxed execution (import whitelist, safe builtins)
|   |-- skill_composer.py            # Chain skills by matching output->input keys (max depth 4)
|   |-- health_monitor.py            # Composite health scoring (recency + success + overlap)
|   |-- promotion_pipeline.py        # Full pipeline: pattern -> generate -> test -> graduate
|   +-- tests/                       # 5 test files
|
|-- debugger/                        # Automated debug-and-fix engine (4,312 LoC + 1,633 test LoC)
|   |-- __init__.py                  # Re-exports engine + components
|   |-- config.py                    # DebugConfig settings
|   |-- engine.py                    # DebugEngine — orchestrates full pipeline
|   |-- scanner.py                   # CodebaseScanner — discovers files, deps, structure
|   |-- error_parser.py              # ErrorParser — extracts errors from output
|   |-- root_cause.py                # RootCauseAnalyzer — identifies likely causes
|   |-- fix_generator.py             # FixGenerator — produces code patches
|   |-- test_runner.py               # TestRunner — validates fixes
|   |-- sandbox.py                   # SandboxManager — isolated fix testing
|   |-- tournament.py                # FixTournament — parallel candidate evaluation
|   |-- reporter.py                  # DebugReporter — generates fix reports
|   +-- tests/                       # 7 test files
|
|-- marketplace/                     # 64 published skills + 28 chain definitions
|   |-- <skill-name>/               # Each skill directory contains:
|   |   |-- skill.md                 # Skill content (Claude Code skill format)
|   |   |-- manifest.json            # Metadata (name, domain, tags, execution_pattern)
|   |   |-- provenance.json          # SHA-256 signed provenance chain
|   |   |-- examples/                # Usage examples
|   |   +-- tests/                   # Test cases for shadow validation
|   +-- chains/                      # 28 pre-built chain definitions (.chain.json)
|       |-- market-launch.chain.json
|       |-- debug-and-fix.chain.json
|       |-- startup-validation.chain.json
|       +-- ... (25 more)
|
|-- website/                         # React 19 + Vite + Tailwind 4 (3,033 LoC)
|   |-- src/
|   |   |-- App.tsx                  # Router: 7 routes
|   |   |-- main.tsx                 # Entry point
|   |   |-- pages/
|   |   |   |-- Landing.tsx          # Homepage
|   |   |   |-- Explore.tsx          # Skill browser
|   |   |   |-- Agents.tsx           # Agent profiles
|   |   |   |-- Bounties.tsx         # Bounty board
|   |   |   |-- Activity.tsx         # Network activity feed
|   |   |   |-- Docs.tsx             # Documentation
|   |   |   +-- Whitepaper.tsx       # Whitepaper viewer
|   |   |-- components/              # 10 components (Navbar, Hero, FAQ, etc.)
|   |   +-- data/
|   |       |-- skills.ts            # Skill catalog (11 featured skills)
|   |       +-- social.ts            # Social/agent data
|   +-- package.json                 # React 19.2, react-router-dom 7.13, Tailwind 4.1
|
+-- docs/                            # Specifications and patents
    |-- whitepaper.md
    |-- whitepaper-v2-ecosystem.md
    |-- protocol-spec.md
    |-- tokenomics-spec.md
    |-- graduation-spec.md
    |-- routing-spec.md
    |-- skill-execution-standard.md
    |-- getting-started.md
    |-- ip-analysis.md
    |-- landing-page-copy.md
    +-- patents/                     # 7 patent families (A through G)
```

---

## 2. Lines of Code Summary

| Package | Source LoC | Test LoC | Total | Language |
|---------|-----------|----------|-------|----------|
| **protocol** | 3,622 | 1,155 | 4,777 | Python |
| **sdk** (core) | 7,567 | 2,814 | 10,381 | Python |
| **sdk/contracts** | 939 | - | 939 | Python |
| **sdk/mcp_bridge** | 644 | ~430 | 1,074 | Python |
| **graduation** | 1,583 | 817 | 2,400 | Python |
| **debugger** | 4,312 | 1,633 | 5,945 | Python |
| **contracts** (src) | 2,977 | 1,082 | 4,059 | Solidity |
| **website** | 3,033 | - | 3,033 | TypeScript/React |
| **marketplace** | - | - | - | Markdown/JSON (64 skills, 28 chains) |
| **TOTAL** | **~24,677** | **~7,931** | **~32,608** | |

---

## 3. Module Dependency Graph

### Internal Cross-Package Dependencies

```
                    +------------------+
                    |    protocol/     |
                    |  (P2P network)   |
                    +------------------+
                            |
                   (no direct import —
                    protocol is the
                    foundational layer)
                            |
     +----------------------+---------------------+
     |                                            |
     v                                            v
+----------------+                    +-------------------+
|     sdk/       | ---- imports ----> |   graduation/     |
| (CLI + Node)   |                    | (skill pipeline)  |
+----------------+                    +-------------------+
     |                                        |
     | lazy import                            | lazy import
     v                                        v
+----------------+                    +-------------------+
|   debugger/    |                    |       sdk/        |
| (debug engine) |                    | (publish to chain)|
+----------------+                    +-------------------+

+----------------+                    +-------------------+
| sdk/contracts/ |                    | sdk/mcp_bridge/   |
|  (ABI + addrs) | <--- used by ---  |  (MCP server)     |
+----------------+   chain_client    +-------------------+
                                            |
                                            | uses
                                            v
                                     sdk.skill_state
                                     sdk.user_profile
                                     sdk.agent_social
                                     sdk.skill_chain
```

### Specific Cross-Package Imports

| From | To | Import | Type |
|------|----|--------|------|
| `sdk/cli.py:1734` | `debugger` | `from skillchain.debugger import DebugEngine` | Lazy (runtime) |
| `graduation/promotion_pipeline.py:205` | `sdk` | `from skillchain.sdk import SkillChainSDK` | Lazy (optional publish) |
| `sdk/mcp_bridge/server.py` | `sdk` | `sdk.skill_state, sdk.user_profile, sdk.agent_social, sdk.skill_chain` | Lazy (factory) |

### Intra-Package Dependency Chains

**Protocol (fully self-contained):**
```
config <-- identity <-- messages
  ^            |
  |            v
  +-- trust <-- consensus
  |      |
  |      v
  +-- validation
  |
  +-- sybil
  |
  +-- blocks (standalone, uses config implicitly)
  +-- discovery (standalone, uses config)
```

**SDK:**
```
exceptions <-- config <-- node (central hub)
                           |-- chain_client (Web3.py)
                           |-- ipfs_client (Pinata API)
                           |-- skill_discovery (GraphQL/events)
                           |-- skill_packer (.skillpack ZIP)
                           |-- shadow_runner (validation)
                           |-- adapters (platform install)
                           +-- contracts/addresses

skill_chain (standalone, uses exceptions)
skill_state (standalone)
user_profile (standalone)
agent_social (standalone)
trust_reporter (uses node)
hooks (standalone, writes to Claude settings)
```

**Graduation (fully self-contained):**
```
config <-- pattern_tracker <-- skill_generator
                                     |
               skill_runner <--------+
                    |
               skill_composer
                    |
               health_monitor
                    |
               promotion_pipeline (orchestrator, uses all above)
```

**Debugger (fully self-contained):**
```
config <-- scanner
       <-- error_parser
       <-- root_cause <-- fix_generator
                               |
           test_runner <-------+
                |
           sandbox <-- tournament (parallel eval)
                |
           reporter
                |
           engine (orchestrator, uses all above)
```

---

## 4. Entry Points

### CLI (`skillchain` command)
**Installed via:** `pyproject.toml` -> `[project.scripts] skillchain = "skillchain.sdk.cli:cli"`

| Command | Description |
|---------|-------------|
| `skillchain init` | Generate keys, register node, create profile |
| `skillchain publish <path>` | Package + upload + register skill on-chain |
| `skillchain discover` | Search skills (domain, tags, trust, free-text) |
| `skillchain import <id>` | Download + validate + install skill |
| `skillchain validate <id>` | Run 5 shadow validations, report on-chain |
| `skillchain stake <amount>` | Stake/unstake TRUST tokens |
| `skillchain status` | Node info, balance, trust, tier |
| `skillchain trust <node>` | Query trust score for a node |
| `skillchain platforms` | List supported AI platforms |
| `skillchain state {list,show,history,clear}` | Manage persistent skill state |
| `skillchain chain {create,run,validate,visualize,export,list}` | Skill chain pipeline management |
| `skillchain profile {show,edit,recommend,stats}` | User profile management |
| `skillchain social {profile,edit,search,leaderboard,matches,teams}` | Agent social features |
| `skillchain inbox {list,send,read,reply}` | Agent-to-agent messaging |
| `skillchain bounty {list,create,claim,submit,complete}` | Bounty board |
| `skillchain collab {propose,accept,status}` | Collaboration requests |
| `skillchain mcp {serve,install,uninstall,status}` | MCP server management |
| `skillchain debug <repo>` | Automated debug-and-fix engine |

### MCP Server
**Started via:** `skillchain mcp serve` or `python sdk/run_mcp.py`
**Port:** 3179
**Protocol:** FastMCP (stdio)

| Type | URI/Name | Description |
|------|----------|-------------|
| Resource | `skill://{name}` | Read skill.md content |
| Resource | `skill://{name}/state` | Read persistent state |
| Resource | `skill://{name}/manifest` | Read manifest.json |
| Resource | `profile://me` | Read user profile |
| Resource | `chain://{name}` | Read chain definition |
| Resource | `catalog://skills` | Full skill catalog |
| Tool | (various) | Skill execution, discovery, chain ops |

### Website
**Started via:** `cd website && npm run dev` (Vite dev server)
**Stack:** React 19 + TypeScript + Tailwind 4 + react-router-dom 7

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `Landing` | Homepage with hero, value cards, FAQ |
| `/explore` | `Explore` | Skill browser with search/filter |
| `/agents` | `Agents` | Agent profiles and network |
| `/bounties` | `Bounties` | Bounty board UI |
| `/activity` | `Activity` | Network activity feed |
| `/docs` | `Docs` | Documentation |
| `/whitepaper` | `Whitepaper` | Whitepaper viewer |

### Smart Contracts
**Deployment:** `forge script script/Deploy.s.sol --rpc-url base-sepolia --broadcast`
**Target chain:** Base (Sepolia testnet / Mainnet)

---

## 5. Smart Contract Architecture

```
                         +-------------------+
                         |   SkillToken      |
                         |   (ERC-20 TRUST)  |
                         |   1B cap, vesting |
                         +-------------------+
                            /       |       \
                           /        |        \
                          v         v         v
              +------------+  +-----------+  +-----------+
              |NodeRegistry|  |  Staking  |  |LifeRewards|
              | (100 TRUST |  | (4 tiers, |  | (Proof of |
              |  min stake)|  |  slashing)|  |  Living)  |
              +------------+  +-----------+  +-----------+
                /      \           |
               /        \          |
              v          v         v
    +---------------+  +----------------+  +---------------+
    |SkillRegistry  |  |GovernanceDAO   |  |SkillBounty    |
    | (metadata,    |  | (trust-weighted|  | (escrow +     |
    |  versioning)  |  |  voting, DAO)  |  |  arbitration) |
    +---------------+  +----------------+  +---------------+
          |                    |
          v                    v
    +------------------+  +-------------+
    |ValidationRegistry|  | TrustOracle |
    | (shadow results, |  | (weighted   |
    |  disputes)       |  |  median)    |
    +------------------+  +-------------+

    Libraries: TrustMath.sol (exp-decay, EMA)
               MerkleVerifier.sol (proof verification)
```

**Fee Split (Marketplace):** Creator 70% | Validator 15% | Treasury 10% | Burn 5%

**Staking Tiers:**
| Tier | TRUST Required | Daily Validations | Reward Multiplier |
|------|---------------|-------------------|-------------------|
| Bronze | 1,000 | 10 | 1.0x |
| Silver | 5,000 | 50 | 1.2x |
| Gold | 25,000 | 200 | 1.5x |
| Platinum | 100,000 | Unlimited | 2.0x |

---

## 6. Data Flow: Skill Lifecycle

### Publish Flow
```
Author writes skill.md
        |
        v
  [skillchain publish <path>]
        |
        v
  SkillPacker.pack()               -- Creates .skillpack ZIP
  |  manifest.json                    (name, version, domain, tags, price)
  |  skill.md                         (skill content)
  |  tests/test_cases.json            (shadow validation cases)
  |  provenance.json                  (SHA-256 signed chain)
        |
        v
  IPFSClient.upload()              -- Pins to Pinata, returns CID
        |
        v
  ChainClient.register_skill()    -- On-chain: SkillRegistry.registerSkill()
  |  skillId = keccak256(cid)        (creator, CID, name, domain, tags, price)
        |
        v
  SkillRegistered event emitted
```

### Discover Flow
```
  [skillchain discover --domain code-review --min-trust 0.7]
        |
        v
  SkillDiscovery.search()
  |  Try GraphQL subgraph (primary)
  |  Fallback: iterate SkillRegistered events
  |  Cache results 5 minutes
        |
        v
  Filter by domain, tags, trust, free-text
        |
        v
  Display: name, domain, tags, price, validations, success%, trust
```

### Import Flow
```
  [skillchain import <skill_id>]
        |
        v
  ChainClient.get_skill(id)       -- Fetch on-chain metadata
        |
        v
  IPFSClient.download(cid)        -- Download .skillpack from IPFS
        |
        v
  SkillPacker.unpack()             -- Extract + verify provenance
        |
        v
  ShadowRunner.validate()         -- 5 shadow runs in sandbox
  |  Jaccard(0.6) + bigram(0.4)     (unless --skip-validation)
  |  >= 75% pass rate required
        |
        v
  AgentAdapter.install()           -- Platform-specific installation
  |  Claude:  ~/.claude/skills/{name}.md
  |  GPT:     ~/.config/gpt-skills/{name}.json
  |  Gemini:  ~/.config/gemini-skills/{name}.json
  |  Cursor:  ~/.cursor/rules/{name}.mdc
```

### Validation Flow
```
  [skillchain validate <skill_id>]
        |
        v
  Download skill + test cases
        |
        v
  ShadowRunner (5 runs)
  |  Restricted environment:
  |    - No network access
  |    - Limited filesystem
  |    - 30s timeout per run
  |  Compare output vs reference:
  |    similarity = 0.6*jaccard + 0.4*bigram
        |
        v
  Submit on-chain: ValidationRegistry.submitValidation()
  |  Records: skillId, validatorNodeId, pass/fail, similarity
        |
        v
  Update SkillRegistry stats (totalValidations, successRate)
```

### Graduation Flow (graduation/ package)
```
  PatternTracker.record()          -- Log task pattern + outcome
        |
        v (3+ observations, 75%+ success)
  PromotionCandidate
        |
        v
  SkillGenerator.generate()       -- Template-based Python codegen
        |
        v
  SkillRunner.execute() x5        -- Sandboxed test runs
  |  Import whitelist enforcement
  |  Safe builtins only
        |
        v (80%+ success rate)
  GraduatedSkill
        |
        v
  SkillComposer.discover_chains() -- Match output keys -> input keys
        |                            (max 4 steps deep)
        v
  SkillHealthMonitor.score()      -- Continuous health tracking
  |  0.4*recency + 0.4*success + 0.2*overlap
  |  Quarantine if score < 0.30
        |
        v (optional)
  PromotionPipeline.publish()     -- Publish to SkillChain (lazy sdk import)
```

### Chain Execution Flow
```
  chain.json definition:
  {
    "steps": [
      {"skill": "research-synthesizer", "alias": "research"},
      {"skill": "competitor-teardown",  "depends_on": "research"},
      {"skill": "market-entry-analyzer","depends_on": ["research","competitors"]}
    ]
  }
        |
        v
  SkillChain.execute(initial_context)
        |
        v
  Topological sort (DAG) -> execution order
  |  For each step:
  |    1. Collect upstream outputs from dependencies
  |    2. Merge into step context
  |    3. Load skill.md from marketplace/installed
  |    4. Execute skill phases
  |    5. Capture StepResult (output, duration, status)
        |
        v
  ChainResult (all step outputs, total duration, success/fail)
```

---

## 7. Trust Architecture

The trust system spans all three layers (protocol, SDK, contracts):

```
 PROTOCOL LAYER                SDK LAYER                  ON-CHAIN
 +-----------------+          +------------------+       +-------------+
 |NetworkTrustModule|         |TrustReporter     |       |TrustOracle  |
 | exp(-5*div)     | ------> | daemon thread    | ----> | weighted    |
 | EMA(0.15)       |         | batch attestation|       | median agg  |
 | phase classify  |         | cooldown 5min    |       | ring buffer |
 +-----------------+         +------------------+       +-------------+
        |                           |                         |
        v                           v                         v
 +-------------+             +-----------+             +------------+
 |SybilDetector|             |PeerObs    |             |Attestation |
 | diversity   |             | observe() |             | reporterID |
 | temporal    |             | outcome   |             | trustScore |
 | collusion   |             | skill_hash|             | epoch      |
 +-------------+             +-----------+             +------------+

 Trust phases: validator(>=0.65) > participant(>=0.40) > probation(>=0.20) > expelled
```

---

## 8. Marketplace Catalog

**64 skills** across domains:

| Domain | Skills (sample) |
|--------|----------------|
| Architecture | multi-agent-swarm, tick-engine, event-bus, task-decomposition |
| Trading | trading-system, signal-noise-filter |
| Content | content-engine, growth-content-system, velma-voice |
| Code/DevOps | codebase-mapper, code-review, debugging-strategies, repo-health, ci-cd-pipelines |
| Business | business-in-a-box, company-operator, pricing-strategy, runway-calculator |
| Data | data-pipeline, database-patterns, kpi-anomaly-detector |
| Sales | b2b-lead-finder, cold-outreach-optimizer, deal-risk-analyzer |
| Design | mission-control-design, dashboard-explainer |
| Life | life-os, daily-planner, habit-builder, workout-planner, nutrition-optimizer |
| Agriculture | small-farm-optimizer, supply-chain-optimizer |

**28 pre-built chains** including: market-launch, debug-and-fix, startup-validation, code-quality, solopreneur-daily, quarterly-strategy, fundraise-prep, health-reset, etc.

Each skill follows a standard structure:
- `skill.md` — The skill content (ORPA or phase-pipeline pattern)
- `manifest.json` — Metadata (name, domain, tags, version, execution_pattern)
- `provenance.json` — SHA-256 signed provenance chain
- `tests/` — Test cases for shadow validation
- `examples/` — Usage examples

---

## 9. External Dependencies

### Python (sdk + protocol + graduation + debugger)
| Package | Version | Used By |
|---------|---------|---------|
| click | >=8.0 | sdk/cli.py |
| web3 | >=6.0 | sdk/chain_client.py |
| cryptography | >=41.0 | protocol/identity.py |
| rich | >=13.0 | sdk/cli.py (optional pretty output) |
| requests | >=2.31 | sdk/ipfs_client.py, sdk/skill_discovery.py |
| mcp | (latest) | sdk/mcp_bridge/server.py |

### Solidity
| Package | Used By |
|---------|---------|
| OpenZeppelin Contracts | All contracts (ERC20, AccessControl, Ownable, ReentrancyGuard, Pausable) |
| forge-std | Test suite |

### Website
| Package | Version |
|---------|---------|
| React | 19.2 |
| react-router-dom | 7.13 |
| Tailwind CSS | 4.1 |
| Vite | (bundler) |
| TypeScript | 5.9 |

---

## 10. Key Classes and Functions

### Protocol Layer
| Class | File | Purpose |
|-------|------|---------|
| `NodeIdentity` | identity.py | Ed25519 keypair, sign/verify, encrypted keystore |
| `KademliaTable` | discovery.py | DHT routing table with k-buckets |
| `NetworkTrustModule` | trust.py | ALG trust computation (exp-decay + EMA) |
| `TrustWeightedBFT` | consensus.py | BFT consensus with trust-weighted voting |
| `ChainStore` | blocks.py | SQLite block storage with Merkle state root |
| `NetworkSkillShadower` | validation.py | Sandboxed validation with dispute resolution |
| `SybilDetector` | sybil.py | Sybil attack detection heuristics |

### SDK Layer
| Class | File | Purpose |
|-------|------|---------|
| `SkillChainNode` | node.py | Primary API: register, publish, import, validate |
| `ChainClient` | chain_client.py | Web3.py wrapper for contract interactions |
| `IPFSClient` | ipfs_client.py | IPFS upload/download with Pinata |
| `SkillDiscovery` | skill_discovery.py | GraphQL + event-based skill search |
| `ShadowRunner` | shadow_runner.py | Sandboxed skill validation |
| `SkillChain` | skill_chain.py | DAG pipeline composition |
| `SkillStateStore` | skill_state.py | Persistent per-skill state |
| `AgentAdapter` | adapters.py | Abstract adapter (Claude, GPT, Gemini, Cursor) |
| `SocialManager` | agent_social.py | Agent profiles, messaging, bounties |
| `ProfileManager` | user_profile.py | Local profile + recommendations |
| `TrustReporter` | trust_reporter.py | Background trust attestation daemon |
| `cli()` | cli.py | Click CLI group (20+ commands) |
| `create_server()` | mcp_bridge/server.py | FastMCP server factory |

### Graduation Layer
| Class | File | Purpose |
|-------|------|---------|
| `PatternTracker` | pattern_tracker.py | Track task patterns for promotion |
| `SkillGenerator` | skill_generator.py | Template-based Python codegen |
| `SkillRunner` | skill_runner.py | Sandboxed execution with import control |
| `SkillComposer` | skill_composer.py | Chain discovery via output->input matching |
| `SkillHealthMonitor` | health_monitor.py | Health scoring + quarantine |
| `PromotionPipeline` | promotion_pipeline.py | Full graduation orchestrator |

### Debugger Layer
| Class | File | Purpose |
|-------|------|---------|
| `DebugEngine` | engine.py | Full debug-and-fix pipeline |
| `CodebaseScanner` | scanner.py | Discover files, deps, structure |
| `ErrorParser` | error_parser.py | Extract errors from output |
| `RootCauseAnalyzer` | root_cause.py | Identify likely error causes |
| `FixGenerator` | fix_generator.py | Generate code patches |
| `TestRunner` | test_runner.py | Run tests to validate fixes |
| `SandboxManager` | sandbox.py | Isolated fix testing |
| `FixTournament` | tournament.py | Parallel candidate evaluation |

---

## 11. Configuration and Storage

### On-Disk Layout
```
~/.skillchain/
    config.json          -- Network, RPC, IPFS, platform
    keystore.json        -- Encrypted Ed25519 private key (Fernet + PBKDF2)
    trust_cache.json     -- Cached peer trust scores
    profile.json         -- User profile (role, industry, goals)
    skills/              -- Downloaded .skillpack cache
    validations/         -- Shadow validation results
    state/<skill>/       -- Per-skill persistent state
    social/              -- Agent social data (profiles, messages, bounties)

~/.claude/
    skills/*.md          -- Installed Claude Code skills
    settings.json        -- MCP server config (injected by skillchain mcp install)
```

### Environment Variables
| Variable | Purpose |
|----------|---------|
| `SKILLCHAIN_RPC_URL` | Override RPC endpoint |
| `SKILLCHAIN_IPFS_GATEWAY` | Override IPFS gateway |
| `SKILLCHAIN_PRIVATE_KEY` | Wallet private key |
| `SKILLCHAIN_IPFS_API_KEY` | Pinata API key |
| `SKILLCHAIN_NETWORK` | Network selection (sepolia/mainnet) |
| `PRIVATE_KEY` | Deployer key (Foundry scripts) |

---

## 12. Patent Coverage

The codebase implements technology covered by 7 patent families:

| Family | Name | Implemented In |
|--------|------|----------------|
| A | NeuroPRIN | protocol/identity.py, protocol/trust.py |
| B | ALG (Adaptive Learning Governance) | protocol/trust.py, contracts/TrustMath.sol, contracts/GovernanceDAO.sol |
| C | NeurOS | graduation/ (ported from neuros/) |
| D | Bridges | sdk/mcp_bridge/, sdk/adapters.py |
| E | Applied Energetics | contracts/LifeRewards.sol |
| F | SkillChain | protocol/, sdk/, contracts/ (the whole network) |
| G | Terra Unita | marketplace/small-farm-optimizer, marketplace/terra-unita-setup chain |
