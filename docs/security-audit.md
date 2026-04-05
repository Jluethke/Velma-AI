# SkillChain SDK Security Audit

**Date:** 2026-03-31
**Scope:** `skillchain/sdk/` -- all 38 Python files (~4,600 LoC)
**Auditor:** Automated security-hardening pipeline (Phase Pipeline)
**Baseline tests:** 239 passed before audit; 239 passed after all fixes

---

## Executive Summary

The SkillChain SDK handles wallet private keys, blockchain transactions, IPFS content, and file-based persistence for a decentralized AI skill marketplace. This audit identified **10 findings** across 7 files, ranging from CRITICAL (secret leakage) to INFORMATIONAL (design notes). **7 findings were remediated in-place**; 3 require architectural changes documented below.

| Severity | Found | Fixed | Deferred |
|----------|-------|-------|----------|
| CRITICAL | 1     | 1     | 0        |
| HIGH     | 2     | 2     | 0        |
| MEDIUM   | 4     | 4     | 0        |
| LOW      | 2     | 0     | 2        |
| INFO     | 1     | 0     | 1        |

---

## PHASE 1: Attack Surface Inventory

### Files Reviewed

| File | Purpose | Key Risk Areas |
|------|---------|---------------|
| `config.py` | Config management, keystore, trust cache | Private key handling, file permissions |
| `chain_client.py` | Web3 contract interaction | Private key in memory, transaction signing |
| `ipfs_client.py` | IPFS upload/download via Pinata | API key handling, CID-based SSRF |
| `node.py` | Main node entry point | Orchestrates chain + IPFS + identity |
| `cli.py` | Click CLI (~800 LoC) | User input handling, passphrase |
| `skill_packer.py` | ZIP archive create/extract | Zip slip, file traversal |
| `skill_discovery.py` | GraphQL + chain search | Query injection |
| `skill_state.py` | Persistent state storage | Path traversal via skill names |
| `agent_social.py` | Messaging, bounties, profiles | Path traversal via node/message IDs |
| `adapters.py` | Platform skill installation | File writes with user-supplied names |
| `shadow_runner.py` | Sandboxed skill execution | Sandbox escape potential |
| `trust_reporter.py` | Background trust daemon | Thread safety |
| `hooks.py` | Claude Code hook installation | Settings.json modification |
| `mcp_bridge/server.py` | MCP server for Claude | Path traversal in import_skill |
| `mcp_bridge/claude_settings.py` | Settings installer | Settings.json modification |
| `contracts/addresses.py` | Contract addresses | Hardcoded localhost addresses (safe) |
| `contracts/abis.py` | Contract ABIs | Static data (no risk) |
| `user_profile.py` | User profile management | Personal data storage |
| `skill_chain.py` | Chain composition engine | Cycle detection, deserialization |
| `exceptions.py` | Exception hierarchy | No risk |
| `run_mcp.py` | MCP launcher | sys.path manipulation (low risk) |

### Technology Stack Risk Profile

- **Blockchain:** Web3.py on Base (L2). Private keys in memory during signing.
- **Storage:** IPFS via Pinata HTTP API. Bearer token auth.
- **Persistence:** JSON files under `~/.skillchain/`. No encryption at rest.
- **Transport:** HTTPS to RPC/IPFS endpoints. No custom TLS config.
- **CLI:** Click library. Passphrase prompted with `hide_input=True`.
- **Serialization:** JSON only (no pickle/yaml/eval). Safe.

---

## PHASE 2: OWASP Assessment

### A01:2021 - Broken Access Control
- **N/A for most code.** On-chain access control is in Solidity contracts (out of scope).
- **Finding:** MCP `import_skill()` accepted unsanitized skill names that could traverse paths. **FIXED.**

### A02:2021 - Cryptographic Failures
- **CRITICAL FINDING [F-01]:** `config.py:save()` wrote `ipfs_api_key` to `~/.skillchain/config.json` in plaintext. Any process reading this file gets the Pinata API key. **FIXED** -- API key excluded from serialized config; must be supplied via `SKILLCHAIN_IPFS_API_KEY` env var.
- **INFO [F-10]:** Provenance uses SHA-256 hash chains, not cryptographic signatures (ECDSA/Ed25519). A node can forge provenance for any identity. This is a design limitation documented below.

### A03:2021 - Injection
- **HIGH FINDING [F-02]:** `skill_discovery.py` interpolated user-supplied `domain` strings directly into GraphQL queries via f-strings. An attacker could inject arbitrary GraphQL. **FIXED** -- domain sanitized to alphanumeric + hyphens/underscores; success_rate clamped to safe integer range.
- **MEDIUM FINDING [F-06]:** `node.py` used `__import__()` for dynamic module loading where static imports suffice. While not exploitable here, `__import__` is a code smell flagged by security scanners. **FIXED** -- replaced with standard `from .exceptions import`.

### A04:2021 - Insecure Design
- **LOW [F-09]:** Provenance signing uses SHA-256 chains with no private-key cryptography. Anyone who knows a node_id can forge provenance records. **DEFERRED** -- requires ECDSA signing with the node's wallet key. Recommendation below.

### A05:2021 - Security Misconfiguration
- **LOW [F-08]:** Keystore file permissions set to `0o600` only on Unix; silently skipped on Windows. On Windows, the keystore JSON is world-readable to all user-level processes. **DEFERRED** -- requires Windows ACL manipulation via `pywin32` or `icacls`.

### A06:2021 - Vulnerable and Outdated Components
- No pinned vulnerable versions detected. Dependencies (`web3`, `requests`, `click`) are standard.

### A07:2021 - Identification and Authentication Failures
- Passphrase handling in CLI uses `click.prompt(hide_input=True)` -- correct.
- Private key loaded from env var, never logged. `to_dict()` correctly excludes it.

### A08:2021 - Software and Data Integrity Failures
- **MEDIUM FINDING [F-03]:** `skill_packer.py:unpack()` had an incomplete Zip Slip check -- used `".." in name` string matching which can be bypassed with encoded sequences on some platforms. **FIXED** -- now resolves canonical paths and verifies each target stays within `extract_dir`.

### A09:2021 - Security Logging and Monitoring Failures
- Logging is present throughout. No sensitive data (keys, passphrases) in log output. Adequate.

### A10:2021 - Server-Side Request Forgery (SSRF)
- **HIGH FINDING [F-04]:** `ipfs_client.py:download()` constructed URLs from user-supplied CID strings with no validation. A malicious CID like `../../etc/passwd` or `?redirect=evil.com` could manipulate the HTTP request. **FIXED** -- added `_validate_cid()` that rejects slashes, query chars, `..`, and length > 128.

---

## PHASE 3: Findings by Severity

### CRITICAL

#### F-01: IPFS API Key Written to Plaintext Config File
- **File:** `config.py:142-156` (method `save()`)
- **Risk:** The Pinata API key was serialized into `~/.skillchain/config.json`. Any local process or backup system reading this file gains IPFS upload/delete access.
- **CVSS estimate:** 8.4 (High confidentiality impact, local attack vector)
- **Status:** FIXED

### HIGH

#### F-02: GraphQL Injection via Domain Parameter
- **File:** `skill_discovery.py:204-208`
- **Risk:** User-supplied `domain` string was interpolated into a GraphQL query with f-strings. An attacker could inject `"}){ malicious { ` to alter query structure, potentially exfiltrating data from the subgraph indexer.
- **CVSS estimate:** 7.5
- **Status:** FIXED -- domain sanitized to `[a-zA-Z0-9_-]` only; success_rate clamped to `[0, 10000]`.

#### F-04: IPFS CID SSRF / Path Injection
- **File:** `ipfs_client.py:164-192`
- **Risk:** CID strings were appended directly to gateway URLs. A malicious CID containing path separators, query strings, or `..` could redirect HTTP requests.
- **CVSS estimate:** 7.3
- **Status:** FIXED -- added `_validate_cid()` with forbidden character set, `..` check, and 128-char length limit.

### MEDIUM

#### F-03: Incomplete Zip Slip Protection
- **File:** `skill_packer.py:224-229`
- **Risk:** The unpack function checked for `".."` as a substring but didn't verify resolved canonical paths. On some platforms, encoded sequences could bypass the string check.
- **CVSS estimate:** 6.5
- **Status:** FIXED -- now resolves `extract_dir` and each member path, verifying containment with `str.startswith()` on resolved paths.

#### F-05: Path Traversal via Skill Names (skill_state.py)
- **File:** `skill_state.py:92-106`
- **Risk:** `skill_name` and `key` parameters were used directly as directory/file names. A name like `../../etc/cron.d/evil` could write files outside `~/.skillchain/state/`.
- **CVSS estimate:** 6.3
- **Status:** FIXED -- added `_sanitize_name()` that strips separators, `..`, null bytes, and leading dots. Added canonical path containment check.

#### F-07: Path Traversal via Node/Message IDs (agent_social.py)
- **File:** `agent_social.py` (multiple methods)
- **Risk:** `node_id`, `msg_id`, `bounty_id`, and `collab_id` were used directly as filesystem paths for JSON files. Malicious IDs could write/read arbitrary files.
- **CVSS estimate:** 6.3
- **Status:** FIXED -- added `_sanitize_id()` function; applied to all 15+ filesystem path constructions.

#### F-06: Dynamic `__import__()` Usage
- **File:** `node.py:139, 294`
- **Risk:** Used `__import__("time").time()` and `__import__("skillchain.sdk.exceptions", ...)` where normal imports would suffice. While not directly exploitable, `__import__` is flagged by security scanners and can mask import-time side effects.
- **CVSS estimate:** 3.5 (Low)
- **Status:** FIXED -- replaced with standard import statements.

### LOW (Deferred)

#### F-08: Keystore Permissions Not Set on Windows
- **File:** `config.py:165-168`
- **Risk:** `chmod(0o600)` is a no-op on Windows. The keystore file (containing encrypted private key + node identity) is readable by all user-level processes.
- **Recommendation:** Use `icacls` or `pywin32` to restrict Windows ACLs. Example:
  ```python
  import subprocess
  subprocess.run(
      ["icacls", str(self.keystore_file), "/inheritance:r",
       "/grant:r", f"{os.getlogin()}:F"],
      capture_output=True
  )
  ```

#### F-09: MCP import_skill Path Traversal
- **File:** `mcp_bridge/server.py:329-345`
- **Risk:** `skill_name` was used to construct a filesystem path without sanitization.
- **Status:** FIXED -- added sanitization stripping `/`, `\`, `..`, null bytes, and leading dots.

### INFORMATIONAL

#### F-10: Provenance Signing Is Hash-Based, Not Cryptographic
- **File:** `skill_packer.py:275-327`
- **Current state:** `sign_provenance()` creates a SHA-256 chain hash from `node_id:name:version:content_hash:timestamp`. Anyone who knows the node_id can compute a valid provenance record for any skill.
- **Recommendation for production:** Sign provenance with the node's ECDSA private key (the wallet key). Verification would use `eth_account.Account.recover_message()` to confirm the wallet address matches the on-chain registered node owner.

---

## PHASE 4: Remediation Summary

### Applied Fixes (7 findings)

| ID | File | Change |
|----|------|--------|
| F-01 | `config.py` | Removed `ipfs_api_key` from `save()` serialization |
| F-02 | `skill_discovery.py` | Sanitized `domain` to `[a-zA-Z0-9_-]`; clamped `success_rate` |
| F-03 | `skill_packer.py` | Added canonical path resolution + containment check in `unpack()` |
| F-04 | `ipfs_client.py` | Added `_validate_cid()` with forbidden chars, `..`, length limit |
| F-05 | `skill_state.py` | Added `_sanitize_name()` + canonical path containment check |
| F-06 | `node.py` | Replaced `__import__()` with standard imports |
| F-07 | `agent_social.py` | Added `_sanitize_id()`, applied to all 15+ path constructions |
| F-09 | `mcp_bridge/server.py` | Sanitized `skill_name` in `import_skill()` |

### Deferred Recommendations

1. **Windows keystore ACLs (F-08):** Implement Windows-specific file permission restriction using `icacls` subprocess call or `pywin32` `SetFileSecurity`.

2. **Cryptographic provenance signing (F-10):** Replace hash-based provenance with ECDSA signatures using the node's wallet private key. This is the highest-impact security improvement for production.

3. **Private key memory protection:** Consider zeroing the private key string in memory after use (Python's string immutability makes this difficult -- `ctypes` or `mmap`-based secure memory would be needed for true protection).

4. **Rate limiting on MCP tools:** The MCP server tools (e.g., `save_skill_data`, `import_skill`) have no rate limiting. In production, add request throttling.

5. **HTTPS certificate pinning:** IPFS gateway and RPC connections use default `requests`/`web3` TLS settings. For production, consider certificate pinning for the Pinata API and Base RPC endpoints.

---

## PHASE 5: Verification

```
$ python -m pytest tests/ -x --tb=short
============================= 239 passed in 3.54s =============================
```

All 239 tests pass after remediation. No functional regressions detected.

### What Was Not In Scope

- Solidity smart contracts (separate audit needed)
- Frontend (Mission Control React app)
- Velma NeurOS kernel
- Network-level security (P2P protocol, DNS)
- Dependency supply chain (e.g., compromised PyPI packages)

---

## Appendix: Positive Security Observations

The codebase has several strong security practices already in place:

1. **No `pickle`, `eval`, `exec`, or `yaml.load`** -- all deserialization uses `json.loads()`.
2. **No `subprocess` calls** -- no shell command injection surface.
3. **No SQL** -- filesystem-based persistence avoids SQL injection entirely.
4. **Private key excluded from `to_dict()`** -- the serialization helper intentionally omits the private key.
5. **Keystore `chmod(0o600)`** -- correct Unix permissions (with Windows gap noted).
6. **`click.prompt(hide_input=True)`** -- passphrase not echoed to terminal.
7. **Error messages don't leak secrets** -- exception strings contain operation context, not key material.
8. **Exponential backoff on chain retries** -- prevents nonce-related race conditions.
9. **Content hash verification** -- `verify_content_hash()` exists for IPFS download integrity.
10. **ZIP traversal check existed** -- just needed strengthening with canonical path resolution.
