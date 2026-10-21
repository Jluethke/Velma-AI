# Auth Login Enumeration and Timing Defense

**One-line description:** Hardens the login, signup and "forgot password" handlers against account enumeration by making the response body, status code, headers and timing identical for unknown users and wrong passwords (dummy-hash verify per the OWASP Authentication Cheat Sheet), and measures the timing gap with curl before and after.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `auth_inventory` (object, required): Output of `auth-session-vs-token-decision`.
- `app_base_url` (string, required): Base URL of a local or staging instance, for example `http://localhost:8000`.

---

## Outputs

- `login_handler_findings` (object): Login, signup and reset handler locations; each enumeration channel found (body, status, header, timing) with before and after evidence; the measured median timing for known and unknown users.

---

## Phase 1: Find the Handlers and Enumeration Channels

### Entry Criteria
- The app runs locally at `app_base_url`.
- A test account exists whose username and password you know.

### Actions
1. Locate handlers: `rg -n -i "def (login|signin|authenticate)|router\.(post|put)\(['\"]/(login|signin|session)|func .*Login" .`, and the same for `signup|register` and `forgot|reset`.
2. Read each handler and list every early return before the password hash is checked. Typical leaks:
   - `if user is None: return 404 / "User not found"`;
   - different messages: "Unknown email" vs "Wrong password";
   - returning before running the hash verify (fast path, which is the timing leak);
   - signup returning "email already registered".
3. Send two requests and save headers and body:
   ```
   curl -s -D known.h -o known.b -X POST "$APP/login" -H 'Content-Type: application/json' -d '{"username":"realuser@example.com","password":"wrong-pass"}'
   curl -s -D unknown.h -o unknown.b -X POST "$APP/login" -H 'Content-Type: application/json' -d '{"username":"nobody-7f3a@example.com","password":"wrong-pass"}'
   diff known.b unknown.b; diff <(grep -v -i '^date:\|^content-length:' known.h) <(grep -v -i '^date:\|^content-length:' unknown.h)
   ```
   Adapt the field names to the real request schema you read in step 1.
4. Measure timing, 30 requests each, and take the median:
   ```
   for i in $(seq 30); do curl -s -o /dev/null -w '%{time_total}\n' -X POST "$APP/login" -H 'Content-Type: application/json' -d '{"username":"realuser@example.com","password":"wrong-pass"}'; done | sort -n | awk '{a[NR]=$1} END{print a[int((NR+1)/2)]}'
   ```
   Repeat for the unknown user. Record both medians.
   If a rate limiter blocks the run, run against a local instance with the limiter disabled by its config flag; never disable it in shared environments.

### Output
List of channels with evidence.

### Quality Gate
- Both `diff` commands were run and their output (or "no output") is recorded.
- Two medians are recorded with the request count.

---

## Phase 2: Fix the Handlers

### Entry Criteria
- At least one channel found, or Phase 1 shows none (then skip to Phase 3 and report clean).

### Actions
1. Make the response identical. Use one message for both cases, for example "Invalid username or password", one status code (401 for API, 200 with the form re-rendered for HTML), and the same headers.
2. Equalize work: when the user does not exist, still run one verify against a fixed dummy hash created at startup with the same parameters as real hashes.
   - Python (argon2-cffi): `DUMMY = _ph.hash("dummy-password-not-used")` at module load; on unknown user call `_ph.verify(DUMMY, password)` inside `try/except VerifyMismatchError` and then return the generic failure. Django: `django.contrib.auth.authenticate` already runs the default hasher once for unknown users (`ModelBackend` calls `UserModel().set_password(password)`); confirm in your Django version's `ModelBackend.authenticate` source.
   - Node (`argon2`): `const DUMMY = await argon2.hash("dummy-password-not-used", OPTS)` at startup; on unknown user `await argon2.verify(DUMMY, password)`.
   - Go: `dummy, _ := password.Hash("dummy-password-not-used", password.Default)` at init; on unknown user call `password.Verify(dummy, plain)`.
3. Accounts that are locked or disabled must return the same generic response; tell the owner by email instead of in the response.
4. Signup: respond "Check your email to continue" for both new and existing emails, and send the "you already have an account" notice by email.
5. Edit one handler, rerun Phase 1 steps 3 and 4 for it, then edit the next.
6. Do NOT add a random `sleep`; random delays average out over many requests. Equalizing the work is the fix.

### Output
Patched handlers.

### Quality Gate
- Phase 1 step 3 `diff` commands now print nothing for login, signup and reset.
- `rg -n -i "user not found|no such user|unknown (user|email)|already registered" .` has no hits in response strings.

---

## Phase 3: Re-measure and Record

### Entry Criteria
- Handlers patched.

### Actions
1. Rerun the 30-request median for known and unknown users.
2. Compare: if the unknown-user median is still clearly lower than the known-user median across three repeated runs (the lower median in all three), the dummy verify is not on the path; return to Phase 2. Report the raw numbers; do not declare a pass threshold that no standard defines.
3. Add a regression test that posts both cases and asserts equal status code and equal body.

### Output
`login_handler_findings`.

### Quality Gate
- Three runs of medians are recorded per case.
- The regression test passes and fails when the old early return is restored (mutation check).

---

## Worked Example

Illustrative only. Express app, `$APP=http://localhost:3000`.

Phase 1:
```
$ diff known.b unknown.b
< {"error":"Incorrect password"}
---
> {"error":"No account for that email"}
known median: 0.0712   unknown median: 0.0034
```
Two channels: body and timing.

Phase 2: single message `{"error":"Invalid username or password"}`; `DUMMY` verify added on unknown user.

Phase 3:
```
run1 known 0.0709 unknown 0.0701
run2 known 0.0715 unknown 0.0718
run3 known 0.0702 unknown 0.0711
$ npx jest tests/login-enumeration.test.ts
PASS tests/login-enumeration.test.ts
```

---

## Exit Criteria

DONE when login, signup and reset return byte-identical bodies and status for existing and nonexistent accounts, the unknown-user path runs one real hash verify, and the timing evidence and regression test are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | App cannot be started locally | **Return**: ask for a staging URL and a test account. |
| Phase 1 | Rate limiter returns 429 during measurement | **Adjust**: run against a local instance with the limiter disabled by config; never in a shared environment. |
| Phase 2 | Product requires "email already registered" on signup | **Return**: present the enumeration risk and the email-notice alternative; record the user's decision. |
| Phase 3 | Timing gap persists | **Retry**: confirm the dummy verify uses the same parameters as real hashes; check for a database lookup that only runs for existing users. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
