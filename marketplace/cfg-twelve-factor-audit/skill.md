# Twelve-Factor Config Audit

**One-line description:** Classifies every inventoried config key against Twelve-Factor App factor III (Config) as deploy config, secret, or code constant, flags each violation (hard-coded credentials, per-environment branches in code, committed per-environment config files, config baked into images), and emits the classified key list later flows build schemas from.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_inventory` (object[], required): Output of `cfg-inventory-config-surface`.
- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `twelve_factor_findings` (object[]): One row per violation: `rule_id`, `key` or `file`, `location`, `evidence` (redacted), `fix`.
- `config_keys` (object[]): One row per key: `key`, `class` (deploy-config | secret | code-constant), `required` (true | false), `type` (string | int | bool | url | duration | enum | list), `default` (non-secret keys only, else null), `allowed_values` (enum only).

---

## Phase 1: Classify Each Key

### Entry Criteria
- `config_inventory` is non-empty and every row has `secret_suspect` set.

### Actions
1. Apply the factor III test from 12factor.net/config to each key: "Does this value change between deploys (staging, production, a developer laptop)?" Use this table; do not improvise.

| Condition | `class` |
|---|---|
| `secret_suspect` is true | secret |
| Value differs between deploys (hostnames, ports, URLs, feature toggles per deploy, log level, region, bucket names) | deploy-config |
| Value is the same in every deploy and changing it requires a code review (retry policy shape, page size constant, internal enum mapping) | code-constant |
| Cannot tell from code and manifests | deploy-config, and add an open question to `twelve_factor_findings` with `rule_id` `TF-UNKNOWN` |

2. Set `required`:
   - `secret` keys: `required: true`, `default: null`. A secret never has a default in code.
   - `deploy-config` keys with an in-code default that is safe in production (for example `PORT=8080`): `required: false`, keep the default.
   - `deploy-config` keys whose in-code default points at a developer resource (`localhost`, `127.0.0.1`, `sqlite://`, `http://` to an internal host): `required: true`, `default: null`, and record finding `TF-DEV-DEFAULT`.
3. Set `type` from usage in code: `Number(...)`, `int(...)`, `strconv.Atoi` give `int`; comparisons with `"true"`/`"1"` give `bool`; values parsed as URLs give `url`; values like `30s` give `duration`; a value compared against a fixed set gives `enum` with `allowed_values` copied from the comparisons.
4. Move `code-constant` rows out of the config surface: they stay in code as named constants and do not appear in the startup schema. Keep them in `config_keys` with `class: code-constant` so the decision is visible.

### Output
Draft `config_keys`.

### Quality Gate
- Every key in `config_inventory` (except `DYNAMIC` rows) appears exactly once in `config_keys`.
- Zero rows have `class: secret` and a non-null `default`.

---

## Phase 2: Detect Factor III Violations

### Entry Criteria
- Draft `config_keys` exists.

### Actions
1. Run each check and record every hit as a finding with the given `rule_id`.

| `rule_id` | Check command (from `repo_path`) | Violation when |
|---|---|---|
| TF-HARDCODED-SECRET | Inventory rows with `secret_suspect: true` and a non-null `default_in_code` | Any row matches |
| TF-ENV-BRANCH | `rg -n -e "(NODE_ENV|APP_ENV|ENV|ENVIRONMENT|SPRING_PROFILES_ACTIVE)\s*(===?|==)\s*['\"](prod|production|staging|dev)" -e "if .*(is_production|isProd)"` | Code takes different config values based on the environment name instead of reading the value itself |
| TF-COMMITTED-ENV-FILE | `git ls-files \| rg '(^\|/)\.env($\|\.)' \| rg -v '\.example$\|\.sample$\|\.template$'` | A real `.env` file is tracked |
| TF-PER-ENV-SECRET-FILE | `git ls-files \| rg -i '(prod\|production\|staging).*\.(ya?ml\|json\|properties\|toml)$'` then open each | The file contains a secret-class key with a plaintext value (encrypted SOPS files with an `sops:` block are not a violation) |
| TF-BAKED-IMAGE | `rg -n -e '^\s*ENV .*(PASSWORD\|SECRET\|TOKEN\|KEY)' -e '^\s*ARG .*(PASSWORD\|SECRET\|TOKEN)' -g 'Dockerfile*'` | A secret is passed through `ENV` or `ARG` (both persist in image metadata; `docker history` shows them) |
| TF-DEV-DEFAULT | From Phase 1 step 2 | Any row recorded |

2. For each finding write `fix` from this table:

| `rule_id` | `fix` |
|---|---|
| TF-HARDCODED-SECRET | Remove the literal, make the key required, then run the leak response chain (the value is already in git history). |
| TF-ENV-BRANCH | Replace the branch with a dedicated config key holding the value; the environment name may still select logging format but never a credential or endpoint. |
| TF-COMMITTED-ENV-FILE | `git rm --cached <file>`, add it to `.gitignore`, commit a `.env.example`; then run secret scanning on history. |
| TF-PER-ENV-SECRET-FILE | Move secret values to a secret store; keep only non-secret values in the per-environment file. |
| TF-BAKED-IMAGE | Use BuildKit secret mounts (`RUN --mount=type=secret,id=<id>`) for build-time secrets and runtime injection for runtime secrets. |
| TF-DEV-DEFAULT | Remove the default; require the value at startup. |

### Output
`twelve_factor_findings`.

### Quality Gate
- Each of the six checks was run; the command and its hit count are listed (zero is a valid count).
- Every finding has a `fix` from the table.

---

## Phase 3: Apply The Open-Source Litmus Test

### Entry Criteria
- Findings recorded.

### Actions
1. Apply the 12factor.net litmus test: "could the codebase be made open source at any moment, without compromising any credentials?" Answer it with evidence, not opinion: the answer is NO if any `TF-HARDCODED-SECRET`, `TF-COMMITTED-ENV-FILE`, `TF-PER-ENV-SECRET-FILE` or `TF-BAKED-IMAGE` finding exists.
2. Record the answer and the finding IDs that cause it as the first row of `twelve_factor_findings` with `rule_id` `TF-LITMUS`.
3. Emit `config_keys` and `twelve_factor_findings`.

### Output
`config_keys`, `twelve_factor_findings`.

### Quality Gate
- The `TF-LITMUS` row lists the blocking finding IDs, or states YES with zero blocking findings.

---

## Common Mistakes To Avoid

- Do not fix the code in this flow. It classifies and reports; the schema flows change code.
- Do not classify a value as `code-constant` just because it has a default. Ask whether it differs between deploys.
- Do not give a secret a default "for local dev". Local dev secrets come from `.env` or a secret manager, see `cfg-local-dev-secrets-setup`.
- Do not mark `TF-ENV-BRANCH` for code that only chooses a log format; mark it when the branch selects a credential, URL or limit.

---

## Worked Example

Illustrative. Inventory from a Python service with keys `DATABASE_URL` (default `postgresql://localhost/app`), `PAGE_SIZE` (default `50`, same in all deploys), `SENTRY_DSN`, `LOG_LEVEL` (default `INFO`).

Phase 1:
```
DATABASE_URL  secret         required=true  type=url  default=null   (TF-DEV-DEFAULT: localhost default removed)
SENTRY_DSN    secret         required=true  type=url  default=null
LOG_LEVEL     deploy-config  required=false type=enum default=INFO allowed=[DEBUG,INFO,WARNING,ERROR]
PAGE_SIZE     code-constant  (stays a constant in code)
```
Phase 2:
```
$ git ls-files | rg '(^|/)\.env($|\.)' | rg -v '\.example$'
.env.staging
```
Finding `TF-COMMITTED-ENV-FILE .env.staging`. `rg` for `ENV .*PASSWORD` in Dockerfile: 0 hits.

Phase 3: `TF-LITMUS: NO (blocked by TF-COMMITTED-ENV-FILE)`.

---

## Exit Criteria

DONE when every non-dynamic key is classified, every factor III check has a recorded hit count, and the litmus answer is backed by finding IDs.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `config_inventory` empty | **Return**: rerun `cfg-inventory-config-surface`; an empty inventory means the patterns did not match the stack. |
| Phase 1 | A key's type cannot be inferred | **Adjust**: set `type: string` and add a `TF-UNKNOWN` open question. |
| Phase 2 | A per-environment file is SOPS-encrypted | **Adjust**: confirm the `sops:` metadata block exists and values start with `ENC[`; do not record a violation. |
| Phase 2 | Hard-coded secret found | **Return**: record it and hand it to the leak response flows; rotation is mandatory even after the code is fixed. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
