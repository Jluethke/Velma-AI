# Auth Password Reset Flow

**One-line description:** Builds or audits a password reset flow per the OWASP Forgot Password Cheat Sheet: identical response whether or not the account exists, CSPRNG tokens stored hashed, single use and time limited, links built from a configured base URL (not the `Host` header), `Referrer-Policy: no-referrer` on the reset page, all sessions and refresh tokens revoked after reset, no automatic login, with Django's built-in views covered as a separate path and an attack test per rule.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `login_handler_findings` (object, required): Output of `auth-login-enumeration-timing-defense`; gives the reset request handler location.
- `reset_token_lifetime` (string, required): Token lifetime from the user's policy (for example "30 minutes"). Not chosen by this flow.

---

## Outputs

- `password_reset_report` (object): Each of the eight rules below with pass or fail, file and line, fix applied, and test results.

---

## Phase 1: Audit Against the Rules

### Entry Criteria
- Reset request and reset confirm handlers are located.

### Actions
1. Check each rule and record pass or fail with evidence:

| # | Rule | How to check |
|---|---|---|
| 1 | Same response and timing for existing and unknown emails | `diff` the two responses (as in `auth-login-enumeration-timing-defense`); send the email in a background job so timing does not differ |
| 2 | Token from a CSPRNG with at least 128 bits | Read the generator: `secrets.token_urlsafe(32)`, `crypto.randomBytes(32)`, Go `crypto/rand`. `random`, `Math.random`, `uuid.v1`, timestamps or user IDs fail |
| 3 | Token stored hashed (SHA-256) or HMAC-derived, never plaintext | Inspect the table: `SELECT token FROM password_resets LIMIT 1` must not equal any emailed token |
| 4 | Single use | Use one token twice; second must fail |
| 5 | Expires after `reset_token_lifetime` | Compare `expires_at - created_at` with the input |
| 6 | Link built from configured base URL | Commands 6a and 6b below |
| 7 | Reset page sends `Referrer-Policy: no-referrer` and loads no third-party scripts | Command 7 below, then read the page's `<script src>` hosts |
| 8 | After reset: all sessions and refresh tokens revoked, user notified by email, no automatic login | Read the confirm handler; test with a second logged-in client |

   Commands (copy exactly; `|` inside the quotes is regex alternation):
   - 6a: `rg -n "request\.(host|get_host|build_absolute_uri)|req\.(hostname|headers\.host)|r\.Host" .` and read the hits near the email code.
   - 6b: `curl -s -X POST "$APP/forgot" -H 'Host: evil.example' -d 'email=you@example.com'`, then read the link in the delivered email.
   - 7: `curl -s -D - -o /dev/null "$APP/reset/<token>" | grep -i referrer-policy`

2. Also check: the reset request endpoint is rate limited (link to the rate-limiting flow output); requesting a new token invalidates earlier unused tokens for that user; the new password goes through the same password policy and hashing module as signup.

### Output
Rule table with pass or fail.

### Quality Gate
- All eight rules have a result and evidence (command output or file and line).

---

## Phase 2: Fix

### Entry Criteria
- At least one rule failed.

### Actions
1. Django path (built-in `PasswordResetView`/`PasswordResetConfirmView`):
   - Rules 2 to 4 are covered by `PasswordResetTokenGenerator`: the token is an HMAC over the user's password hash and `last_login`, so it stops working once the password changes or the user logs in.
   - Rule 5: set `PASSWORD_RESET_TIMEOUT` (seconds) from `reset_token_lifetime`; the default is 259200 (3 days).
   - Rule 6: with `django.contrib.sites` installed, the link domain comes from the `Site` record; without it, from `request.get_host()`, which is only safe when `ALLOWED_HOSTS` lists exact hosts and contains no `"*"`. Fix whichever applies.
   - Rule 7: add `Referrer-Policy` via `SECURE_REFERRER_POLICY = "no-referrer"` (global) or a decorator on the confirm view.
   - Rule 8: `PasswordResetConfirmView.post_reset_login` must stay `False` (default); revoke refresh tokens in a `post_save`/custom view hook.
2. Custom path (any stack), schema:
   ```sql
   CREATE TABLE password_resets (
     id bigserial PRIMARY KEY, user_id bigint NOT NULL REFERENCES users(id),
     token_hash char(64) NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(),
     expires_at timestamptz NOT NULL, used_at timestamptz);
   ```
   Consume with one statement: `UPDATE password_resets SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING user_id;`. On issue, `UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL` first.
3. Build links from configuration: `f"{settings.PUBLIC_BASE_URL}/reset/{token}"`, never from request headers.
4. Confirm handler order: consume token; validate new password; hash and save; increment `session_version` or delete sessions; revoke refresh token families; send "your password was changed" email; redirect to the login page.
5. Fix one rule at a time and rerun its check.

### Output
Patched reset flow.

### Quality Gate
- Every failed rule from Phase 1 now passes its check command.

---

## Phase 3: Attack Tests

### Entry Criteria
- All rules pass manually.

### Actions
1. Write tests:
   - `test_reset_unknown_email_same_response`
   - `test_reset_token_single_use`
   - `test_reset_token_expired` (freeze time past `reset_token_lifetime`)
   - `test_reset_link_ignores_host_header` (send `Host: evil.example`; captured email link starts with the configured base URL)
   - `test_reset_revokes_other_sessions`
   - `test_reset_does_not_log_in`
   - `test_new_token_invalidates_old`
2. Capture emails with the framework's test outbox (Django `mail.outbox`, Flask-Mail `record_messages`, Node a stub transport such as nodemailer `jsonTransport`, Go an interface fake).
3. Run the stack test command.

### Output
`password_reset_report`.

### Quality Gate
- Seven tests pass.
- Mutation check: remove `AND used_at IS NULL` (custom) or set `post_reset_login = True` (Django); the matching test fails; revert.

---

## Worked Example

Illustrative only. Express app, `reset_token_lifetime` = 30 minutes from the user's policy.

Phase 1 failures: rule 3 (token stored plaintext), rule 6:
```
$ curl -s -X POST http://localhost:3000/forgot -H 'Host: evil.example' -d 'email=alice@example.com'
(email body) Reset your password: http://evil.example/reset/9f8c...
```
Rule 8: other sessions survive.

Phase 2: SHA-256 hashes stored, `PUBLIC_BASE_URL` used, sessions revoked by deleting `sess:*` keys for the user via a per-user index set.

Phase 3:
```
$ npx jest tests/password-reset.test.ts
Tests: 7 passed, 7 total
```

---

## Exit Criteria

DONE when all eight OWASP-based rules pass with evidence, the reset lifetime equals the user's policy, and the seven attack tests pass with a mutation check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `reset_token_lifetime` missing | **Return**: ask the user; do not choose one. |
| Phase 1 | Emails cannot be captured locally | **Adjust**: run a local SMTP catcher such as MailHog or Mailpit and read the link there. |
| Phase 2 | Sessions are signed cookies that cannot be revoked | **Adjust**: add `session_version` check; record the store limitation from `auth-session-fixation-logout`. |
| Phase 3 | Host header test passes only because the test client ignores `Host` | **Adjust**: assert on the generated link string from the outbox, not the HTTP response. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
