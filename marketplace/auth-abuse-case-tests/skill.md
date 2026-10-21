# Auth Abuse-Case Test Suite

**One-line description:** Turns the findings from the earlier auth flows into a permanent abuse-case regression suite (OWASP ASVS-style negative tests) run in CI with pytest, Jest/Vitest with supertest, or Go `httptest`: cross-tenant reads, forged and expired JWTs, CSRF forgeries, enumeration diffs, MFA step skipping, reset token reuse, session replay and privilege escalation by mass assignment, each mutation-checked so the test is proven live.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `login_handler_findings` (object, required): Output of `auth-login-enumeration-timing-defense`.
- `jwt_findings` (object, required): Output of `auth-jwt-verification-audit`.
- `csrf_defense_report` (object, required): Output of `auth-csrf-defense-verification`.
- `object_access_findings` (object, required): Output of `auth-idor-object-access-checks`.
- `password_reset_report` (object, required): Output of `auth-password-reset-flow`.

---

## Outputs

- `abuse_case_tests` (object): Test file paths, the abuse case each test covers, its source finding, the CI command, the run output, and the mutation-check record per test.

---

## Phase 1: Build the Abuse-Case Catalog

### Entry Criteria
- At least one of the finding inputs is non-empty.

### Actions
1. Create one catalog row per abuse case. Start from this list and keep a row only if the app has the feature:

| ID | Abuse case | Expected result | Source input |
|---|---|---|---|
| AC1 | User B reads, updates, deletes user A's object by ID | 404 (or matrix status), object unchanged | `object_access_findings` |
| AC2 | User B creates an object under A's parent ID | 403 or 404 | `object_access_findings` |
| AC3 | Token with `alg: none` | 401 | `jwt_findings` |
| AC4 | HS256 token signed with the RSA public key | 401 | `jwt_findings` |
| AC5 | Expired token, wrong `aud`, wrong `iss` | 401 each | `jwt_findings` |
| AC6 | State-changing request with session cookie but no CSRF token, foreign `Origin`, or `Sec-Fetch-Site: cross-site` | 403 (or the framework's rejection status), state unchanged | `csrf_defense_report` |
| AC7 | Login with unknown user vs wrong password | identical status and body | `login_handler_findings` |
| AC8 | Password step done, MFA skipped, call a protected route | 401 or 403 | MFA flow output, if MFA exists |
| AC9 | Reset token used twice; reset link with forged `Host` | second use fails; link uses configured base URL | `password_reset_report` |
| AC10 | Session cookie replayed after logout | 401, 403 or redirect to login | session lifecycle |
| AC11 | Mass assignment: user sends `role=admin` or `is_staff=true` in profile update | field ignored or 400; role unchanged | permission matrix |
| AC12 | Vertical escalation: non-admin calls each admin route | 403 | permission matrix |
| AC13 | Refresh token reused after rotation | 401 and family revoked | refresh rotation design |

2. For AC11, find writable models: Django `ModelSerializer` with `fields = "__all__"`, Express handlers doing `Object.assign(user, req.body)` or `prisma.user.update({ data: req.body })`, Go `json.Decode` into the full model struct. `rg -n "fields\s*=\s*['\"]__all__|Object\.assign\([a-z]+,\s*req\.body|data:\s*req\.body" .`

### Output
Catalog of abuse cases for this app.

### Quality Gate
- Every catalog row cites its source input or file.
- Rows dropped are listed with the reason (feature absent).

---

## Phase 2: Write the Tests

### Entry Criteria
- Catalog exists.

### Actions
1. Put the suite in one directory: `tests/security/` (Python), `test/security/` or `src/**/__tests__/security/` (Node, follow the repo's convention), `internal/security_test/` or alongside handlers (Go).
2. Shared fixtures: two tenants, two users per tenant (one admin, one member), one object per user, helpers to log in and to mint tokens with a test key.
3. Name each test after its ID: `test_ac1_cross_tenant_read_returns_404`, `it("AC3 rejects alg none")`, `func TestAC4_HSWithPublicKeyRejected(t *testing.T)`.
4. Every state-changing abuse test asserts both the status and that the data is unchanged (read it back as the owner).
5. Use the real app wiring (Django `Client`, FastAPI `TestClient`, supertest `request(app)`, Go `httptest.NewServer(router)`), not handler functions called directly, so middleware (CSRF, auth) runs.
6. Do NOT write tests that assert the current insecure behavior. If a test fails because the app is vulnerable, keep the test failing, record it as an open finding, and fix the app in the matching flow.
7. Do NOT mock the authorization layer in these tests.

### Output
Test files.

### Quality Gate
- One test per catalog row exists: `rg -n -i "ac(1|2|3|4|5|6|7|8|9|10|11|12|13)[_ ]" tests test internal` lists each kept ID.

---

## Phase 3: Run, Mutation-Check, and Wire into CI

### Entry Criteria
- Tests written.

### Actions
1. Run the suite alone: `pytest -q tests/security`, `npx jest test/security` or `npx vitest run test/security`, `go test ./... -run 'TestAC' -count=1`.
2. Mutation check every test, one at a time: disable the defense it covers (remove the scope term, add `none` to allowed algorithms, add `csrf_exempt`, remove the regenerate call), run that one test, confirm it fails, revert, confirm it passes. Record each pair of results. A test that still passes with its defense removed is not live; rewrite it.
3. Add the suite to CI as a required job. GitHub Actions example step: `- run: pytest -q tests/security` (or the stack command). Do not mark it `continue-on-error`.
4. Run the full test suite to confirm nothing else broke.

### Output
`abuse_case_tests`.

### Quality Gate
- Suite output shows every kept test passing (or failing only where an open finding is recorded).
- Each test has a recorded mutation pair (fail with defense removed, pass with defense restored).
- The CI file contains the suite command: `rg -n "tests/security|test/security|TestAC" .github/workflows`.

---

## Worked Example

Illustrative only. Django REST API, `stack` = python; no MFA, no refresh tokens, so AC8 and AC13 are dropped.

Phase 1 adds AC11 from `rg` hit `users/serializers.py:12: fields = "__all__"`.

Phase 3:
```
$ pytest -q tests/security
..........F                                              [100%]
FAILED tests/security/test_ac11.py::test_ac11_profile_update_cannot_set_is_staff
10 passed, 1 failed in 3.02s
```
AC11 recorded as an open finding; after setting `read_only_fields = ("is_staff", "is_superuser", "groups")`, all 11 pass. Mutation pair for AC1: removing the `get_queryset` filter fails `test_ac1_cross_tenant_read_returns_404`; restoring it passes.

---

## Exit Criteria

DONE when each applicable abuse case has a named test through the real app wiring, every test is mutation-checked, open failures are recorded as findings rather than weakened, and the suite runs as a required CI job.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Upstream flow outputs missing | **Adjust**: build catalog rows from the code directly and mark the source as "code read". |
| Phase 2 | Test client bypasses middleware | **Adjust**: switch to a full-app client (`httptest.NewServer`, supertest on the exported app). |
| Phase 3 | Mutation check does not fail a test | **Retry**: rewrite the test to hit the defended path; never record it as live. |
| Phase 3 | CI lacks a database for tests | **Adjust**: add a service container (for example `services: postgres:` in GitHub Actions) instead of mocking authorization. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
