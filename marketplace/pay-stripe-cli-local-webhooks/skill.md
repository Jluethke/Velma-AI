# Stripe CLI Local Webhook Forwarding

**One-line description:** Forwards Stripe test-mode events to a local webhook endpoint with `stripe listen`, captures the per-session signing secret, fires events with `stripe trigger`, and reads the CLI output to tell a signature failure from an app error.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `test_env` (object, required): Output of `pay-test-mode-setup`.
- `webhook_path` (string, required): Route of the webhook handler, for example `/webhook` or `/api/stripe/webhook`.
- `local_port` (integer, required): Port the app listens on locally, for example `4242` or `3000`.

---

## Outputs

- `webhook_secret_local` (string): The `whsec_` secret printed by `stripe listen`, stored only in local `.env` as `STRIPE_WEBHOOK_SECRET`. The value itself is not written into any report; the output records only that it was set and its prefix.
- `cli_trigger_log` (object[]): For each triggered event: event type, event id, HTTP status your endpoint returned, and pass or fail.

---

## Phase 1: Install and Log In

### Entry Criteria
- `test_env` present. The app runs locally.

### Actions
1. Install the CLI from Stripe's docs for your OS (Homebrew `brew install stripe/stripe-cli/stripe`, Scoop on Windows, or the release binary). Run `stripe version` and record it.
2. Run `stripe login` and complete the browser pairing. The CLI keys created this way are test-mode restricted keys that expire; rerun `stripe login` when commands report an expired key.
3. Run `stripe config --list` to confirm the account and project the CLI is using.

### Output
Logged-in CLI.

### Quality Gate
- `stripe version` prints a version.
- `stripe config --list` shows a `test_mode_api_key` entry (value redacted when recorded).

---

## Phase 2: Start Forwarding and Capture the Secret

### Entry Criteria
- Phase 1 passed.

### Actions
1. In a separate terminal run: `stripe listen --forward-to localhost:<local_port><webhook_path>`. To limit noise add `--events payment_intent.succeeded,payment_intent.payment_failed,charge.refunded,charge.dispute.created`.
2. The CLI prints `Ready! ... Your webhook signing secret is whsec_...`. Copy that value into `.env` as `STRIPE_WEBHOOK_SECRET` and restart the app so it rereads the variable.
3. Know the difference: this `whsec_` secret belongs to the CLI session; a Dashboard webhook endpoint has its own different secret. A handler running with the Dashboard secret rejects CLI-forwarded events, and the reverse.
4. Leave `stripe listen` running for Phase 3. If you need the secret without starting a listener, check `stripe listen --help` for a print-secret option on your CLI version.

### Output
`webhook_secret_local` set in `.env`.

### Quality Gate
- The `stripe listen` terminal shows the `Ready!` line.
- `.env` contains `STRIPE_WEBHOOK_SECRET=whsec_` (check with `rg -c "^STRIPE_WEBHOOK_SECRET=whsec_" .env` which prints `1`).

---

## Phase 3: Trigger Events and Read the Output

### Entry Criteria
- Listener running; app restarted.

### Actions
1. In a third terminal run each: `stripe trigger payment_intent.succeeded`, `stripe trigger payment_intent.payment_failed`, `stripe trigger charge.refunded`. Run `stripe trigger --help` to list other supported fixtures.
2. Read the `stripe listen` terminal. Each line has the form `<timestamp>  --> payment_intent.succeeded [evt_...]` then `<timestamp>  <--  [200] POST http://localhost:<port><path> [evt_...]`.
3. Diagnose by status code:
   | Status in listen output | Meaning | Next step |
   |---|---|---|
   | `[200]` | Handler verified and accepted the event | Record pass |
   | `[400]` with app log "No signatures found matching the expected signature" | Secret mismatch, or body was parsed before verification | Recheck Phase 2 step 3; then run the framework webhook flow for raw-body handling |
   | `[404]` | Wrong `webhook_path` | Fix the `--forward-to` URL |
   | `[500]` | Handler crashed after verification | Read the app stack trace; fix the business logic |
   | `connect: connection refused` | App not running on `local_port` | Start the app |
4. To resend one event: `stripe events resend evt_...`. To watch API requests: `stripe logs tail`.
5. Record every trigger in `cli_trigger_log`.

### Output
`cli_trigger_log`.

### Quality Gate
- Every triggered event has a `[200]` line in the listen output, or a recorded failure with its diagnosis row.
- Never record a pass from the `stripe trigger` output alone; it only shows the API calls it made, not your endpoint's response.

---

## Worked Example

Illustrative. `local_port` = `4242`, `webhook_path` = `/webhook`.

```
$ stripe listen --forward-to localhost:4242/webhook
> Ready! You are using Stripe API Version [...]. Your webhook signing secret is whsec_abc... (^C to quit)
$ stripe trigger payment_intent.succeeded
Setting up fixture for: payment_intent
Running fixture for: payment_intent
Trigger succeeded! Check dashboard for event details.
# listen terminal:
2026-10-21 10:02:11   --> payment_intent.succeeded [evt_3Q...]
2026-10-21 10:02:11  <--  [200] POST http://localhost:4242/webhook [evt_3Q...]
```
`cli_trigger_log`: `[{"type":"payment_intent.succeeded","id":"evt_3Q...","status":200,"result":"pass"}]`.

---

## Exit Criteria

DONE when the local handler returns 200 for every triggered event type in the plan's webhook list, verified in the `stripe listen` output.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `stripe login` cannot open a browser | **Adjust**: use the pairing URL the CLI prints, or `stripe login --interactive` if your version lists it in `--help`. |
| Phase 2 | Handler keeps returning 400 | **Return**: run the stack webhook flow (`pay-py-webhook-verify`, `pay-node-webhook-verify` or `pay-go-webhook-verify`). |
| Phase 3 | Fixture fails with an API error | **Retry**: once; then read the error text; some fixtures need account features enabled in test mode. |
| Phase 3 | Events not appearing in listen | **Adjust**: remove the `--events` filter and retry. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
