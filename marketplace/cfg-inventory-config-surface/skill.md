# Config Surface Inventory

**One-line description:** Finds every place a codebase reads configuration (environment variables, config files, CLI flags, framework property lookups, CI and deploy manifests) with exact ripgrep patterns per stack, and emits one row per config key with its source, location, default and a secret flag.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root (a git working tree).
- `stack` (string, required): One of `python`, `node`, `go`, `java`. Selects the search patterns in Phase 1.

---

## Outputs

- `config_inventory` (object[]): One row per config key: `key`, `read_sites` (list of `file:line`), `source_kind` (env | file | flag | framework-property | manifest), `default_in_code` (literal or null), `secret_suspect` (true | false) with the rule that set it.

---

## Phase 1: Search Code Read Sites

### Entry Criteria
- `repo_path` exists and `git -C <repo_path> rev-parse --is-inside-work-tree` prints `true`.
- `stack` is one of the four allowed values.
- `rg --version` prints a version (ripgrep installed). If not, install ripgrep; do not fall back to a hand-written recursive search.

### Actions
1. Change into `repo_path`. All commands below run from the repository root.
2. Run the patterns for the selected `stack`. Copy them exactly. `-n` prints line numbers, `--no-heading` prints `file:line:text` on one line, `-g '!<dir>'` excludes vendored code.

| `stack` | Command |
|---|---|
| python | `rg -n --no-heading -e 'os\.environ\[' -e 'os\.environ\.get\(' -e 'os\.getenv\(' -e 'environ\.get\(' -e 'BaseSettings' -e 'config\.get\(' -g '*.py' -g '!.venv' -g '!venv' -g '!site-packages'` |
| node | `rg -n --no-heading -e 'process\.env\.' -e 'process\.env\[' -e 'import\.meta\.env' -e 'dotenv' -g '*.{js,ts,mjs,cjs,jsx,tsx}' -g '!node_modules' -g '!dist' -g '!build'` |
| go | `rg -n --no-heading -e 'os\.Getenv\(' -e 'os\.LookupEnv\(' -e 'os\.Environ\(' -e 'viper\.' -e 'env:"' -e 'flag\.(String|Int|Bool|Duration)\(' -g '*.go' -g '!vendor'` |
| java | `rg -n --no-heading -e 'System\.getenv\(' -e 'System\.getProperty\(' -e '@Value\("\$\{' -e 'getProperty\(' -e '@ConfigurationProperties' -g '*.{java,kt}' -g '!build' -g '!target'` |

3. Save the raw output to a file outside the repository, for example `rg ... > /tmp/cfg_reads.txt`. Do not write scratch files inside `repo_path`.
4. For each hit, extract the key name. Rules:
   - `os.getenv("DB_URL", "sqlite://")` gives key `DB_URL`, default `sqlite://`.
   - `process.env.PORT ?? 3000` or `process.env.PORT || 3000` gives key `PORT`, default `3000`.
   - `os.LookupEnv("X")` gives key `X`, default null (the caller decides).
   - `@Value("${app.timeout:30s}")` gives key `app.timeout`, default `30s`.
   - Dynamic keys such as `process.env[name]` or `os.getenv(f"{prefix}_URL")`: record the site with key `DYNAMIC` and the expression text. Do not guess the key.

### Output
Raw list of code read sites with extracted keys and in-code defaults.

### Quality Gate
- The row count of `/tmp/cfg_reads.txt` (`wc -l`) equals the number of read sites recorded (each line is either assigned a key or marked `DYNAMIC`).
- Zero hits come from `node_modules`, `vendor`, `.venv`, `target` or `build` (check with `rg -c 'node_modules|vendor/|\.venv|target/' /tmp/cfg_reads.txt` returning nothing).

---

## Phase 2: Search Files and Manifests

### Entry Criteria
- Phase 1 list exists.

### Actions
1. List config and env files tracked by git: `git ls-files | rg -i '(\.env|\.ini|\.toml|\.ya?ml|\.json|\.properties|\.conf|\.cfg)$|(^|/)\.env'`.
2. List env keys declared in container and deploy manifests:
   - Docker: `rg -n --no-heading -e '^\s*ENV ' -e '^\s*ARG ' -g 'Dockerfile*'`.
   - Compose: `rg -n --no-heading -A30 '^\s*environment:' -g '*compose*.y*ml'` and `rg -n 'env_file:' -g '*compose*.y*ml'`.
   - Kubernetes: `rg -n --no-heading -e 'secretKeyRef' -e 'configMapKeyRef' -e 'envFrom' -e '- name: [A-Z_]+' -g '*.y*ml'`.
   - CI: `rg -n --no-heading -e '\$\{\{\s*secrets\.' -e '\$\{\{\s*vars\.' -g '.github/workflows/*.y*ml'` and for GitLab `rg -n '\$[A-Z_]{3,}' .gitlab-ci.yml`.
3. For each key found in a manifest, add a row with `source_kind` `manifest`, or append the manifest location to an existing row with the same key.
4. Record keys that appear in a manifest but in no code read site as `unused_suspect: true`. Record keys read in code but set in no manifest and no file as `unset_suspect: true`. Do not delete either; a later flow decides.

### Output
Inventory merged across code and manifests.

### Quality Gate
- Every key from the Phase 2 manifest commands appears as a row or is appended to an existing row.
- Each row has a non-empty `read_sites` list or `unused_suspect: true`.

---

## Phase 3: Flag Secret Suspects

### Entry Criteria
- Merged inventory exists.

### Actions
1. Mark `secret_suspect: true` when the key name matches, case-insensitively, any of: `PASSWORD`, `PASSWD`, `SECRET`, `TOKEN`, `API_KEY`, `APIKEY`, `PRIVATE_KEY`, `CREDENTIAL`, `AUTH`, `DSN`, `DATABASE_URL`, `CONN`, `SIGNING`, `WEBHOOK`, `SESSION_KEY`, `ACCESS_KEY`. Record the matching word as the rule.
2. Also mark `secret_suspect: true` when the in-code default is a non-placeholder literal that looks like a credential: a URL containing `user:pass@`, a string starting with `AKIA`, `ghp_`, `xoxb-`, `sk_live_`, `-----BEGIN`. Record that default as a finding but print only the first 4 characters followed by `...` in any output.
3. Mark every other row `secret_suspect: false`. Do not leave a row unclassified.
4. Emit `config_inventory` sorted by key.

### Output
`config_inventory`.

### Quality Gate
- Every row has `secret_suspect` set to true or false.
- No secret value longer than 4 characters appears anywhere in `config_inventory` (search the output for the defaults you redacted).

---

## Common Mistakes To Avoid

- Do not open and "fix" config reads while inventorying. This flow only reads.
- Do not invent keys for dynamic lookups. Record `DYNAMIC` with the expression.
- Do not paste real secret values into the inventory, a ticket or a chat. Redact to 4 characters.
- Do not skip manifests. Many secrets enter only through CI or Kubernetes, never in code.

---

## Worked Example

Illustrative. `repo_path=/srv/billing`, `stack=node`.

Phase 1:
```
$ rg -n --no-heading -e 'process\.env\.' -g '*.{js,ts}' -g '!node_modules'
src/db.ts:4:const url = process.env.DATABASE_URL;
src/server.ts:9:const port = Number(process.env.PORT ?? 3000);
src/stripe.ts:2:const key = process.env.STRIPE_KEY || "sk_live_51Hx...";
```
Phase 2: `.github/workflows/deploy.yml:22: STRIPE_KEY: ${{ secrets.STRIPE_KEY }}`; `k8s/deploy.yaml` has `secretKeyRef` for `DATABASE_URL`.

Phase 3 output (excerpt):
```
[{"key":"DATABASE_URL","read_sites":["src/db.ts:4"],"source_kind":"env","default_in_code":null,"secret_suspect":true,"rule":"DATABASE_URL"},
 {"key":"PORT","read_sites":["src/server.ts:9"],"source_kind":"env","default_in_code":"3000","secret_suspect":false},
 {"key":"STRIPE_KEY","read_sites":["src/stripe.ts:2"],"source_kind":"env","default_in_code":"sk_l...","secret_suspect":true,"rule":"literal sk_live_ default"}]
```
The `sk_live_` default is a hard-coded live key and goes to the secret scanning flows.

---

## Exit Criteria

DONE when every config read site and every manifest-declared key is in `config_inventory`, each row carries a secret flag, and no secret value appears unredacted.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `rg` not installed | **Stop**: install ripgrep (package `ripgrep`) and rerun; do not substitute an unbounded `find -exec grep`. |
| Phase 1 | `stack` not in the table | **Return**: ask the user for one of python, node, go, java. |
| Phase 1 | Thousands of hits from generated code | **Adjust**: add `-g '!<generated_dir>'` for the generated directory and record the exclusion. |
| Phase 2 | Monorepo with several stacks | **Adjust**: run Phase 1 once per stack and merge rows by key. |
| Phase 3 | A hard-coded live credential is found | **Return**: mark it and continue; the leak response chain handles rotation. Do not delete it from code in this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
