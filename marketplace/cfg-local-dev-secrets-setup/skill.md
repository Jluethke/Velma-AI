# Local Development Secrets Setup

**One-line description:** Sets up how developers get secrets on their machines without committing them: a generated `.env.example` listing every key with placeholders, gitignore and dockerignore rules verified with `git check-ignore`, a loader chosen by decision table (plain `.env`, direnv, `op run` with 1Password references, `sops exec-env`, or a Vault or AWS fetch script), and dev-only credentials that never grant production access.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `config_keys` (object[], required): Classified keys from `cfg-twelve-factor-audit`.
- `secret_store` (string, required): Output of `cfg-choose-secret-store`.
- `repo_path` (string, required): Absolute path to the repository root.

---

## Outputs

- `env_example_file` (string): Path of the committed `.env.example` and its key count.
- `local_dev_procedure` (string): Path of the README section or `docs/dev-secrets.md` describing setup, plus the verification commands and their outputs.

---

## Phase 1: Generate .env.example

### Entry Criteria
- `config_keys` has at least one row with class `secret` or `deploy-config`.

### Actions
1. Create `.env.example` at the repo root with one line per key, in `config_keys` order, grouped by class with a comment header:
```
# --- deploy-config (safe defaults for local dev) ---
LOG_LEVEL=DEBUG
PORT=8080
# --- secrets (get from the dev store, never use prod values) ---
DATABASE_URL=
STRIPE_KEY=
```
2. Placeholder rules: secrets are empty after `=`. Never put a real value, a "fake but working" value, or a shared team password in `.env.example`. Deploy-config keys may carry a local default (localhost URLs are fine here because this file is for local dev only).
3. Use the exact variable names the schema reads (with prefix, for example `APP_DATABASE_URL` for pydantic `env_prefix="APP_"`, `APP_DBPASSWORD` for Spring relaxed binding).
4. Add a check that keeps the example in sync with the schema. Simple form, run in CI: extract key names from `.env.example` (`rg -o '^[A-Z0-9_]+' .env.example | sort`) and compare with the names the schema module declares (list them with a one-line script in the project's language, for example `python -c "from app.settings import Settings; print('\n'.join(sorted('APP_'+k.upper() for k in Settings.model_fields)))"`). Fail on any difference.

### Output
`.env.example` committed.

### Quality Gate
- The sync check prints no difference.
- `rg -n '=\S' .env.example` lists only deploy-config keys (every secret line ends at `=`).

---

## Phase 2: Ignore Rules

### Entry Criteria
- `.env.example` exists.

### Actions
1. Ensure `.gitignore` contains, in this order:
```
.env
.env.*
!.env.example
.envrc.local
*.pem
*.key
```
   Add only the lines missing. Order matters: the `!` negation must come after the pattern it re-includes.
2. Verify:
   - `git check-ignore -v .env` prints the `.gitignore` line that matches.
   - `git check-ignore -v .env.local` prints a match.
   - `git check-ignore -v .env.example` prints nothing and exits 1 (it is not ignored).
3. Check nothing is already tracked: `git ls-files | rg '(^|/)\.env' | rg -v '\.env\.example$'` must print nothing. If it prints a file, `git rm --cached <file>` and send the file's history to the leak response chain.
4. Add `.env*` and `!.env.example` to `.dockerignore` so `COPY . .` never puts a developer's `.env` into an image. Check `rg -n '^\.env' .dockerignore`.

### Output
Ignore rules verified.

### Quality Gate
- The three `git check-ignore` results match the expectations above.
- The `git ls-files` check prints nothing.

---

## Phase 3: Choose And Document The Loader

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Choose the loader; the first matching row wins:

| Condition | Loader | Developer command |
|---|---|---|
| `secret_store == sops` | sops with a dev or staging recipient | `sops exec-env secrets/dev/app.enc.env '<run command>'` |
| Team uses 1Password | `op run` with secret references | `.env.tpl` committed containing `STRIPE_KEY=op://Dev/billing-stripe/credential`; run `op run --env-file=.env.tpl -- <run command>` (values resolve at runtime and are masked in output) |
| `secret_store == vault` | Vault fetch into the process env at start | `vault login -method=oidc` then a `scripts/dev-env.sh` that runs `vault kv get -mount=secret -format=json dev/billing/stripe` and exports keys for the child process only |
| `secret_store == aws-secrets-manager` | AWS SSO session plus fetch | `aws sso login --profile dev` then a script calling `aws secretsmanager get-secret-value --secret-id dev/billing/stripe --profile dev` and exporting for the child only |
| Per-directory automatic loading wanted | direnv | `.envrc` committed with `dotenv_if_exists .env` (or a `sops`/`op` call), each developer runs `direnv allow` once |
| None of the above | Plain `.env` copied from `.env.example`, values from the dev store by hand | `cp .env.example .env` then fill |

2. Dev credentials rules, written into `local_dev_procedure`:
   - Developers use dev or sandbox credentials (Stripe test-mode keys `sk_test_`, a dev database, a sandbox AWS account). They never hold production secrets locally.
   - Each developer gets their own credential where the provider allows it, so one can be revoked without affecting others.
   - The dev store path is separate from prod (`dev/billing/...`), with access policies that do not reach `prod/`.
3. Write the procedure in `docs/dev-secrets.md` (or the README's setup section): prerequisites, the one command to load secrets, the one command to run the app, and how to request access.
4. Walk through the procedure on a clean clone: `git clone <repo> /tmp/devcheck && cd /tmp/devcheck`, follow the doc exactly, run the app, and confirm startup validation passes. Delete `/tmp/devcheck` after.

### Output
`env_example_file`, `local_dev_procedure`.

### Quality Gate
- The clean-clone walkthrough started the app without `config error` lines (record the start log line).
- `local_dev_procedure` names no production path, profile or credential (`rg -n -i 'prod' docs/dev-secrets.md` returns only statements that prod is excluded).

---

## Common Mistakes To Avoid

- Do not commit `.env` "just for the template"; commit `.env.example`.
- Do not paste `docker compose config` output anywhere; it prints interpolated secret values.
- Do not share one developer's `.env` file over chat.
- Do not use `override=True` in python-dotenv or `override: true` in dotenv; real environment variables must win.

---

## Worked Example

Illustrative. Node service, `secret_store=aws-secrets-manager`, team uses 1Password.

Phase 1: `.env.example` with 6 keys; sync check prints nothing.

Phase 2:
```
$ git check-ignore -v .env
.gitignore:1:.env	.env
$ git check-ignore -v .env.example; echo "exit=$?"
exit=1
```
Phase 3: 1Password row matches. `.env.tpl`:
```
DATABASE_URL=op://Dev/billing-db/connection_string
STRIPE_KEY=op://Dev/billing-stripe-test/credential
```
```
$ op run --env-file=.env.tpl -- npm run dev
Server listening on :3000
```

---

## Exit Criteria

DONE when `.env.example` matches the schema keys with empty secret placeholders, ignore rules are verified for git and Docker, a loader is chosen by the table, and a clean-clone walkthrough of the documented procedure starts the app with dev-only credentials.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Schema module does not exist yet | **Return**: run the stack schema flow first; the example must mirror it. |
| Phase 2 | A real `.env` is tracked | **Return**: untrack it and send it to `cfg-gitleaks-scan-history`; treat its values as leaked. |
| Phase 3 | No dev credential exists for a provider | **Adjust**: request a sandbox account or test-mode key; record the gap; never use prod. |
| Phase 3 | Walkthrough fails on a missing step | **Retry**: fix the doc, not the developer's machine, and repeat on a clean clone. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
