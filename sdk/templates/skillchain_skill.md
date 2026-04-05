# SkillChain CLI

Use the `skillchain` command-line tool to interact with the decentralized AI skill-sharing network.

## Commands

### Initialise
```bash
skillchain init --passphrase <passphrase>
```
Set up your SkillChain identity, generate keys, and register on-chain.

### Publish a Skill
```bash
skillchain publish path/to/skill.md --domain code-review --tags "python,testing" --price 0 --license MIT
```
Package the skill into a .skillpack, upload to IPFS, and register on the blockchain.

### Discover Skills
```bash
skillchain discover --domain code-review --min-trust 0.7 --max-results 10
```
Search the network for skills matching your criteria.

### Import a Skill
```bash
skillchain import <skill_id> --target-dir ~/.claude/skills/
```
Download, validate (5 shadow runs), and install a skill from the network.

### Validate a Skill
```bash
skillchain validate <skill_id>
```
Run 5 shadow validation runs and submit results on-chain.

### Stake ETH
```bash
skillchain stake 0.1
skillchain stake 0.05 --unstake
```
Increase or decrease your node's staking tier.

### Check Status
```bash
skillchain status
```
View your node ID, wallet balance, trust score, and staking tier.

### Check Trust
```bash
skillchain trust <node_id>
```
View trust details for any node on the network.

## Network Selection
All commands accept `--network sepolia` (testnet, default) or `--network mainnet`.

## Configuration
Config is stored in `~/.skillchain/`. Set environment variables to override:
- `SKILLCHAIN_RPC_URL` -- Custom RPC endpoint
- `SKILLCHAIN_IPFS_GATEWAY` -- Custom IPFS gateway
- `SKILLCHAIN_PRIVATE_KEY` -- Wallet private key
