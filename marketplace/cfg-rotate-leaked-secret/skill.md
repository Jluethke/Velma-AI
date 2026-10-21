# Rotate A Leaked Secret

**One-line description:** Rotates each confirmed leaked credential with a zero-downtime order (issue new, store, deploy, confirm the new one is in use, revoke the old, review the provider's audit log for the exposure window), using per-credential-type procedures for database passwords, API keys, OAuth client secrets, SSH and TLS private keys, and JWT signing keys.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `confirmed_leaks` (object[], required): Output of `cfg-triage-secret-findings`.
- `secret_store` (string, optional): Where new values are stored: `vault`, `aws-secrets-manager`, `sops`, or another named store. If absent, ask the user before Phase 2; never store the new value in git or a `.env` committed file.

---

## Outputs

- `rotation_log` (object[]): Per leak: consumers found, new credential identifier (never the value), store path, deploy reference, time new credential first used, time old credential revoked, audit log query and its result.
- `revoked_credentials` (string[]): Identifiers of revoked credentials (key IDs, key fingerprints, `kid` values, role names), never values.

---

## Phase 1: Find Every Consumer

### Entry Criteria
- `confirmed_leaks` is non-empty. If empty, return empty outputs.

### Actions
1. Work one leak at a time, in the order given. Do not rotate several credentials in parallel; a failed deploy then has several causes.
2. List every consumer of the credential before changing anything:
   - Code and manifests: search the inventory key name (for example `STRIPE_KEY`) across all repositories you control: `rg -n STRIPE_KEY` per repo, or GitHub code search `org:<org> STRIPE_KEY`.
   - CI secrets: `gh secret list --repo <org>/<repo>`, `gh secret list --org <org>`, `gh secret list --env <env> --repo <org>/<repo>`.
   - Secret stores: `vault kv list -mount=secret <path>`, `aws secretsmanager list-secrets --filters Key=name,Values=<prefix>`.
   - Humans: shared password managers, runbooks, laptops.
3. Record each consumer and how it receives the value (env var at deploy, file mount, fetched at runtime). Consumers that fetch at runtime from a store pick up a new value without redeploy only if they do not cache it forever; record the cache behavior.

### Output
Consumer list per leak.

### Quality Gate
- Each leak has at least one consumer listed, or a recorded "no consumer found" with the searches run (an unused credential is revoked immediately in Phase 3).

---

## Phase 2: Issue And Deploy The New Credential

### Entry Criteria
- Consumer list complete for the current leak.

### Actions
1. Use the procedure for the credential type. Where the provider allows two valid credentials at once, use it; that gives zero downtime.

| Type | Issue new | Notes |
|---|---|---|
| AWS IAM user access key | Use `cfg-aws-access-key-rotation` | IAM allows two keys per user |
| PostgreSQL password | `CREATE ROLE app_v2 LOGIN IN ROLE app_rw` and set its password with psql `\password app_v2`; or for a single user, `\password app_user` | `\password` sends a hashed value, so the plaintext does not land in server logs the way `ALTER ROLE ... PASSWORD 'x'` can with `log_statement=all`. Two login roles sharing one group role allow switch-over without downtime |
| MySQL password | `ALTER USER 'app'@'%' IDENTIFIED BY '<new>' RETAIN CURRENT PASSWORD;` (MySQL 8.0.14+) then later `ALTER USER 'app'@'%' DISCARD OLD PASSWORD;` | Dual password support; check your server version |
| SaaS API key (Stripe, SendGrid, Twilio, Slack, Datadog) | Create a new key in the provider dashboard or API | Stripe supports rolling a key with an expiry for the old one; check each provider's docs for "roll" or "rotate". Give the new key the narrowest scopes the consumer uses |
| GitHub personal access token | Create a fine-grained token scoped to named repositories, then delete the old one in Settings > Developer settings | Prefer a GitHub App or `GITHUB_TOKEN` in Actions over a personal token |
| OAuth client secret | Add a second client secret in the identity provider (Entra ID, Okta, Google) | Most providers allow two secrets per client |
| SSH private key | `ssh-keygen -t ed25519 -f ./deploy_key_v2 -C deploy-v2`; add the `.pub` to `authorized_keys` or the deploy keys list | Remove the old public key in Phase 3 |
| TLS private key | Generate a new key and CSR; reissue the certificate; deploy; then ask the CA to revoke the old certificate | Revoking the certificate is the revocation step |
| JWT or session signing key | Add the new key with a new `kid` to the JWKS or key list; start signing with it; keep verifying the old `kid` until all tokens signed with it expire (the token lifetime is your configured `exp`) | Then remove the old `kid`. If the leaked key signed tokens an attacker could forge, revoke immediately and accept forced logouts |

2. Store the new value in `secret_store` (commands in the Vault, AWS Secrets Manager or SOPS flows). Pass values from a file or stdin, never as a command-line argument that lands in shell history.
3. Deploy every consumer from Phase 1. For env-var consumers, redeploy or restart; changing the store alone does nothing.
4. Confirm the new credential is in use with provider evidence: AWS `get-access-key-last-used`, PostgreSQL `SELECT usename, client_addr, backend_start FROM pg_stat_activity WHERE usename = 'app_v2';`, the provider dashboard's "last used" field, or application logs showing successful calls after the deploy time.

### Output
New credential live in all consumers, with evidence.

### Quality Gate
- Each consumer has a deploy or restart reference (pipeline run URL, `kubectl rollout status` output) recorded after the new value was stored.
- Provider evidence shows the new credential used after that time.

---

## Phase 3: Revoke The Old Credential And Review Its Use

### Entry Criteria
- Phase 2 gate passed for this leak.

### Actions
1. Revoke the old credential with the provider's delete or disable action (delete the key, `DROP ROLE` after reassigning, remove the public key, revoke the certificate, remove the `kid`). Disable first where the provider supports it, watch for errors, then delete.
2. Confirm revocation: an API call with the old credential must fail. Use the provider's own check where one exists (TruffleHog re-run on the one file with verification shows `Verified: false`), rather than logging in by hand.
3. Review the provider's audit log for the old credential from `exposure_start` to the revocation time: AWS CloudTrail (`aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=<key id>`), GitHub organization audit log, Stripe dashboard logs, PostgreSQL logs filtered by user and client address. List every source IP and action not explained by your own consumers.
4. If unexplained use exists, stop the rotation work and open a security incident with that evidence; the leak was exploited.
5. Record the leak as rotated in `rotation_log` and add the old identifier to `revoked_credentials`. Then move to the next leak and repeat from Phase 1.

### Output
`rotation_log`, `revoked_credentials`.

### Quality Gate
- For every leak, the old credential's failure was observed (recorded output) after revocation.
- For every leak, the audit log query and its result count are recorded, including zero results.

---

## Common Mistakes To Avoid

- Do not rewrite git history first and rotate later. Anyone who cloned, forked, or scraped the repository already has the value; removing it from history does not revoke it.
- Do not revoke before the new credential is deployed everywhere; that causes an outage.
- Do not paste new values into chat, tickets or commit messages.
- Do not skip the audit log review because the key "was only in a private repo"; private repositories have many readers, CI logs, and backups.

---

## Worked Example

Illustrative. `confirmed_leaks` contains L01 Stripe live key. `secret_store=aws-secrets-manager`.

Phase 1: consumers are `billing-api` (env var from Secrets Manager via External Secrets) and the `nightly-reconcile` CronJob. `gh secret list --repo acme/billing` shows `STRIPE_KEY` used by a deploy workflow.

Phase 2: new restricted key `rk_live_...` created with only the Charges and Refunds permissions the code calls. Stored with `aws secretsmanager put-secret-value --secret-id prod/billing/stripe --secret-string file://new.json` (file shredded after). `kubectl rollout status deploy/billing-api -n prod` printed `successfully rolled out` at 14:02. Stripe dashboard shows the new key last used 14:03.

Phase 3: old key rolled with immediate expiry at 14:20. TruffleHog rerun on `src/stripe.ts` history: `Verified: false`. Stripe request logs from 2024-02-02 to now filtered by old key: 2 requests from an IP outside our ranges on 2024-03-09. Rotation paused; incident opened with those 2 log entries.

---

## Exit Criteria

DONE when every confirmed leak has a deployed replacement, the old credential is revoked and observed failing, and the audit log for its exposure window is reviewed with the result recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `secret_store` unknown | **Return**: ask the user; run `cfg-choose-secret-store` if no store exists. |
| Phase 2 | Provider allows only one active credential | **Adjust**: schedule a short window; issue new, deploy all consumers in one release, revoke immediately after; record the downtime. |
| Phase 2 | A consumer fails with the new credential | **Retry**: compare scopes or grants of old and new; do not revoke the old one until fixed. |
| Phase 3 | Old credential still works after revocation | **Stop**: you revoked a different identifier; check the key ID or fingerprint and repeat. |
| Phase 3 | Audit log retention is shorter than the exposure window | **Adjust**: record the gap (for example CloudTrail event history covers 90 days unless a trail exports to S3) and review what exists. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
