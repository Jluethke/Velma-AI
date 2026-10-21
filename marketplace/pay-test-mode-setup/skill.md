# Payments Test Mode Setup

**One-line description:** Configures test-mode API keys as environment variables with a startup guard that refuses live keys outside production, installs the provider SDK for the stack, and records the standard test cards each later flow uses.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.

---

## Outputs

- `test_env` (object): Fields `env_var_names` (list), `key_prefix_check` (description of the guard and its file), `sdk` (package name and installed version), `test_cards` (table), `env_file_gitignored` (bool).

---

## Phase 1: Keys in the Environment, Never in Git

### Entry Criteria
- A provider account exists and the user can open its dashboard in test mode (Stripe: Developers, API keys, with test mode or a sandbox selected).

### Actions
1. Use these variable names exactly: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. For PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`. For Adyen: `ADYEN_API_KEY`, `ADYEN_MERCHANT_ACCOUNT`, `ADYEN_CLIENT_KEY`, `ADYEN_HMAC_KEY`.
2. Put values in `.env` at `project_dir`. Run `git check-ignore -v .env`. If it prints nothing, add `.env` to `.gitignore` and rerun until it prints the matching rule.
3. Run `git log --all -p -S "sk_live_" | head -n 5` and `git log --all -p -S "sk_test_" | head -n 5`. Any output means a key was committed: roll that key in the dashboard now, then continue.
4. Do not paste keys into chat transcripts, issue trackers or test fixtures.

### Output
`.env` populated and ignored.

### Quality Gate
- `git check-ignore -v .env` prints a rule.
- Both `git log -S` searches print nothing, or the leaked key has been rolled and the roll is recorded.

---

## Phase 2: Install SDK and Add the Live-Key Guard

### Entry Criteria
- Phase 1 passed.

### Actions
1. Install the official SDK for `stack`:
   | Stack | Command | Version check |
   |---|---|---|
   | python | `pip install stripe` (add to `requirements.txt` or `pyproject.toml`) | `pip show stripe` |
   | node | `npm install stripe` (browser: `npm install @stripe/stripe-js`, React: `@stripe/react-stripe-js`) | `npm ls stripe` |
   | go | `go get github.com/stripe/stripe-go/v<N>` with the major version from the stripe-go README | `go list -m all \| grep stripe-go` |
2. Add a startup guard in the app's config module. Logic: read `STRIPE_SECRET_KEY`; if it starts with `sk_live_` or `rk_live_` and the app's environment name is not `production`, exit with an error. If it is empty, exit with an error. Stripe secret keys start with `sk_test_` or `sk_live_`; restricted keys with `rk_test_` or `rk_live_`; publishable keys with `pk_test_` or `pk_live_`.
3. Add one unit test for the guard that sets a fake `sk_live_x` with environment `development` and asserts startup fails.
4. Run the test suite.

### Output
SDK installed, guard and its test in place.

### Quality Gate
- The version check command prints a version; record it in `test_env.sdk`.
- The guard test passes and the runner summary line is recorded.

---

## Phase 3: Record Test Cards

### Entry Criteria
- Phase 2 passed.

### Actions
1. Copy this table into `test_env.test_cards`. These Stripe test numbers are from Stripe's testing documentation; use any future expiry and any 3-digit CVC (4 for Amex):
   | Number | Behavior |
   |---|---|
   | 4242 4242 4242 4242 | Succeeds, no authentication |
   | 4000 0025 0000 3155 | Requires 3D Secure authentication unless set up for off-session use |
   | 4000 0027 6000 3184 | Always requires authentication, including off-session |
   | 4000 0000 0000 3220 | 3D Secure 2 authentication required |
   | 4000 0000 0000 0002 | Declined, `card_declined` with `decline_code` `generic_decline` |
   | 4000 0000 0000 9995 | Declined, `decline_code` `insufficient_funds` |
   | 4000 0000 0000 0259 | Succeeds, then a dispute (fraudulent) is opened |
   | 4000 0000 0000 0077 | Succeeds, funds go straight to available balance |
2. Read the current Stripe testing page once and confirm each row; if a number's behavior differs, use the doc's version and note it.
3. PayPal: create sandbox buyer and seller accounts in the PayPal developer dashboard. Adyen: use the test card list in the Adyen docs for your test merchant account.
4. Never use a real card in test mode and never use test numbers in live mode.

### Output
`test_env`.

### Quality Gate
- `test_env.test_cards` has every row above with a "confirmed against docs on <date>" note.
- `test_env.env_var_names` lists every variable the app reads.

---

## Worked Example

Illustrative. `stack` = `python`.

- Phase 1: `git check-ignore -v .env` prints `.gitignore:4:.env	.env`.
- Phase 2: `pip show stripe` prints `Version: <installed>`. Guard test output: `tests/test_config.py::test_live_key_rejected_outside_prod PASSED`.
- Phase 3: `test_env.test_cards` holds the eight rows, confirmed against the docs.

---

## Exit Criteria

DONE when keys live only in an ignored `.env`, a tested guard blocks live keys outside production, the SDK version is recorded and the test card table is confirmed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Key found in git history | **Stop**: roll the key in the provider dashboard first; history rewriting is a separate decision for the owner. |
| Phase 2 | SDK install fails behind a proxy | **Adjust**: configure the package manager proxy; do not vendor a copied SDK. |
| Phase 2 | No environment name variable exists | **Return**: ask the user which variable marks production; do not invent one silently. |
| Phase 3 | Test card behaves differently from the table | **Adjust**: trust the current provider docs; update the table. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
