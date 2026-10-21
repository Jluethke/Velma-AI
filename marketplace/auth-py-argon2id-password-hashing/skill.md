# Auth Python Argon2id Password Hashing

**One-line description:** Replaces or configures password hashing in a Python service with Argon2id through argon2-cffi (plain Python, Flask, FastAPI) or Django's Argon2PasswordHasher, using parameters taken from the OWASP Password Storage Cheat Sheet, with rehash-on-login and tests that prove the stored hash is Argon2id.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `auth_inventory` (object, required): Output of `auth-session-vs-token-decision`; its `password_hash` hits locate the current hashing code.

---

## Outputs

- `password_hashing_change` (object): Files changed, the library and version installed, the exact Argon2id parameters with their source, the rehash-on-login location, and the test command with its pass output.

---

## Phase 1: Locate and Classify Current Hashing

### Entry Criteria
- `auth_inventory` has at least one `password_hash` hit, or the user confirms the service stores passwords and the hit list is empty only because hashing is missing.

### Actions
1. Open every `password_hash` file from `auth_inventory`. Classify each stored-hash format by its prefix using this table:

| Stored value starts with | Algorithm | Action |
|---|---|---|
| `$argon2id$` | Argon2id | Check parameters only (Phase 2 step 4) |
| `$argon2i$` or `$argon2d$` | Argon2i or Argon2d | Rehash to Argon2id on next login |
| `$2a$`, `$2b$`, `$2y$` | bcrypt | Hand to `auth-bcrypt-to-argon2id-migration`; keep verifying bcrypt |
| `pbkdf2_sha256$` | Django PBKDF2 | Django upgrades it automatically once Argon2 is first in `PASSWORD_HASHERS` |
| 32 or 40 or 64 hex characters, no prefix | Unsalted MD5, SHA-1 or SHA-256 | Critical finding; needs the wrapping migration in `auth-bcrypt-to-argon2id-migration` |

2. Decide the target path:
   - If `INSTALLED_APPS` exists in a `settings.py`, the project is Django: use Phase 2 Path A.
   - Else: use Phase 2 Path B (argon2-cffi directly).

### Output
Classification table of current formats and the chosen path.

### Quality Gate
- Every `password_hash` hit has an algorithm from the table.
- Exactly one path (A or B) is chosen and the file that proves it is named.

---

## Phase 2: Configure Argon2id

### Entry Criteria
- A path is chosen.

### Actions
1. Path A (Django):
   1. Install: `pip install "django[argon2]"` (pulls in argon2-cffi). Add it to the project's dependency file.
   2. In `settings.py`, set `PASSWORD_HASHERS` with `"django.contrib.auth.hashers.Argon2PasswordHasher"` first and keep every existing hasher after it, so old hashes still verify and are upgraded on login.
   3. Do not lower Django's Argon2 defaults. Read them with: `python -c "from django.contrib.auth.hashers import Argon2PasswordHasher as H; print(H.time_cost, H.memory_cost, H.parallelism)"`. They must meet or exceed the OWASP minimum below.
2. Path B (argon2-cffi):
   1. Install: `pip install argon2-cffi` and pin the installed version in the dependency file.
   2. Create one module (for example `app/security/passwords.py`) and route every hash and verify call through it:
      ```python
      from argon2 import PasswordHasher
      from argon2.exceptions import VerifyMismatchError, InvalidHashError, VerificationError
      # OWASP Password Storage Cheat Sheet minimum: m=19456 KiB (19 MiB), t=2, p=1
      _ph = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)

      def hash_password(plain: str) -> str:
          return _ph.hash(plain)

      def verify_password(stored: str, plain: str) -> tuple[bool, str | None]:
          try:
              _ph.verify(stored, plain)
          except (VerifyMismatchError, VerificationError, InvalidHashError):
              return False, None
          return True, (_ph.hash(plain) if _ph.check_needs_rehash(stored) else None)
      ```
   3. If the user supplies stronger parameters from their own benchmark, use those; otherwise use the OWASP minimum. argon2-cffi's library defaults (RFC 9106 low-memory profile) are also above the OWASP minimum; print them with `python -c "from argon2 import PasswordHasher as P; p=P(); print(p.time_cost, p.memory_cost, p.parallelism)"`.
3. Call sites: replace each direct hashing call found in Phase 1 with the module function. Edit one file, run the tests, then move to the next file.
4. If existing Argon2id hashes have parameters below the chosen ones, `check_needs_rehash` returns True for them; no separate migration is needed.

### Output
Configured hasher and changed call sites.

### Quality Gate
- `rg -n "hashlib\.(md5|sha1|sha256)\(.*pass" .` returns no hits on password code paths.
- Path A: `python manage.py shell -c "from django.contrib.auth.hashers import make_password; print(make_password('x')[:9])"` prints `argon2$ar`.
- Path B: `python -c "from app.security.passwords import hash_password; print(hash_password('x')[:31])"` prints `$argon2id$v=19$m=19456,t=2,p=1$` (or the user's stronger values).

---

## Phase 3: Rehash on Login and Test

### Entry Criteria
- Hasher configured.

### Actions
1. In the login handler, after a successful verify, if a new hash was returned (Path B) save it to the user row in the same transaction. Django's `check_password` on the user model does this automatically through `setter`; do not add a second save.
2. Add tests (pytest shown):
   - `test_new_hash_is_argon2id`: hash a password, assert it starts with `$argon2id$` (Path B) or `argon2$argon2id$` (Path A).
   - `test_verify_wrong_password_false`: verify returns False and does not raise.
   - `test_legacy_hash_upgraded_on_login`: store a legacy-format hash, log in, reload the row, assert the stored value now starts with the Argon2id prefix.
   - `test_rehash_when_params_weaker`: store a hash made with `PasswordHasher(time_cost=1, memory_cost=8192, parallelism=1)`, verify, assert a new hash was produced.
3. Run `pytest -q` (or `python manage.py test`) and read the summary line.
4. Do NOT delete or skip existing failing tests to get a green run. If an old test asserts a PBKDF2 or bcrypt prefix on new hashes, update only that assertion and say so in `password_hashing_change`.

### Output
`password_hashing_change`.

### Quality Gate
- The test run summary shows 0 failed and includes the four new test names.
- Mutation check: temporarily change `memory_cost` back to the weaker value, rerun `test_rehash_when_params_weaker`, confirm it fails, then revert. Record both outputs.

---

## Worked Example

Illustrative only. A FastAPI service uses `hashlib.sha256(salt + pw)`.

Phase 1: `rg -n "sha256" app/` returns `app/users/service.py:41: digest = hashlib.sha256(salt + pw.encode()).hexdigest()`. Classified as unsalted-style SHA-256 (salted but fast): critical; Path B chosen because no `settings.py` with `INSTALLED_APPS` exists.

Phase 2:
```
$ pip install argon2-cffi && pip freeze | grep argon2
argon2-cffi==23.1.0
argon2-cffi-bindings==21.2.0
$ python -c "from app.security.passwords import hash_password; print(hash_password('x')[:31])"
$argon2id$v=19$m=19456,t=2,p=1$
```

Phase 3:
```
$ pytest -q tests/test_passwords.py
....                                                     [100%]
4 passed in 0.61s
```
Old SHA-256 rows are handed to `auth-bcrypt-to-argon2id-migration` for wrapping.

---

## Exit Criteria

DONE when every new password hash is Argon2id with parameters at or above the OWASP minimum, legacy hashes still verify and are upgraded on login, and the four tests pass with the mutation check recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Hash format matches no table row | **Return**: show three sample prefixes (never full hashes) to the user and ask the algorithm. |
| Phase 2 | `pip install argon2-cffi` fails building wheels | **Adjust**: upgrade pip (`python -m pip install -U pip`) and retry; argon2-cffi-bindings ships wheels for common platforms. |
| Phase 2 | Server runs out of memory under load with chosen `memory_cost` | **Adjust**: pick another OWASP-listed equivalent row (for example m=12288, t=3, p=1); never go below the cheat sheet table. |
| Phase 3 | New tests fail | **Retry**: fix the code, not the test assertion; rerun. |
| Phase 3 | Mutation check does not fail the test | **Stop**: the test is not exercising rehash; rewrite it before claiming success. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
