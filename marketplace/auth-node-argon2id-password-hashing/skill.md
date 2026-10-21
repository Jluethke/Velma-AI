# Auth Node Argon2id Password Hashing

**One-line description:** Configures Argon2id password hashing in a Node.js or TypeScript service with the `argon2` npm package (node-argon2), using OWASP Password Storage Cheat Sheet parameters, with `needsRehash` upgrade on login and Jest or Vitest tests that prove the stored format.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `auth_inventory` (object, required): Output of `auth-session-vs-token-decision`; its `password_hash` hits locate the current hashing code.

---

## Outputs

- `password_hashing_change` (object): Files changed, `argon2` package version, Argon2id parameters with their source, rehash-on-login location, and test command with pass output.

---

## Phase 1: Locate Current Hashing

### Entry Criteria
- `package.json` exists at `repo_path`.
- `auth_inventory` lists `password_hash` hits, or the user confirms hashing is missing.

### Actions
1. List hashing libraries in use: `npm ls bcrypt bcryptjs argon2 @node-rs/argon2 @node-rs/bcrypt 2>/dev/null` and `rg -n "createHash\(['\"](md5|sha1|sha256)['\"]\)|pbkdf2|scrypt" --glob "*.{js,ts}" src`.
2. Classify stored formats with the same prefix table as the Python flow: `$argon2id$` keep and check params; `$2a$`/`$2b$`/`$2y$` bcrypt (hand to `auth-bcrypt-to-argon2id-migration`); bare hex digest is a critical finding.
3. Choose the package:
   - If the deploy target can build or download native addons (normal Linux, macOS, Windows Node): use `argon2`.
   - If native addons are not allowed (some serverless bundles): use `@node-rs/argon2`, which ships prebuilt binaries. Read its README for the option names; do not assume they match `argon2`.

### Output
List of current hashing call sites and the chosen package.

### Quality Gate
- Every call site from step 1 is listed with file and line.
- The chosen package is named with the rule that selected it.

---

## Phase 2: Implement the Hashing Module

### Entry Criteria
- Package chosen.

### Actions
1. Install and pin: `npm install argon2` then confirm `npm ls argon2` prints one version.
2. Create one module (for example `src/security/passwords.ts`):
   ```ts
   import argon2 from "argon2";
   // OWASP Password Storage Cheat Sheet minimum: m=19456 KiB, t=2, p=1
   const OPTS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

   export async function hashPassword(plain: string): Promise<string> {
     return argon2.hash(plain, OPTS);
   }

   export async function verifyPassword(stored: string, plain: string): Promise<{ ok: boolean; newHash?: string }> {
     let ok = false;
     try { ok = await argon2.verify(stored, plain); } catch { return { ok: false }; }
     if (!ok) return { ok: false };
     return argon2.needsRehash(stored, OPTS) ? { ok: true, newHash: await hashPassword(plain) } : { ok: true };
   }
   ```
3. The package's own defaults may differ between major versions. Print them instead of assuming: read `node_modules/argon2/README.md` or the type definitions in `node_modules/argon2/argon2.d.ts` (`defaults`). Use the OWASP row or stronger user-supplied values.
4. Replace each call site from Phase 1, one file at a time, running `npx tsc --noEmit` (TypeScript) after each file.
5. Do NOT call `argon2.hash` with `type` omitted in one place and set in another; all hashing goes through the module.
6. Do NOT use the synchronous `crypto.createHash` for passwords anywhere.

### Output
Hashing module and updated call sites.

### Quality Gate
- `node -e "require('argon2').hash('x',{type:2,memoryCost:19456,timeCost:2,parallelism:1}).then(h=>console.log(h.slice(0,31)))"` prints `$argon2id$v=19$m=19456,t=2,p=1$` (`type: 2` is `argon2id` in this package).
- `rg -n "createHash\(['\"](md5|sha1|sha256)" src` has no hits on password code.

---

## Phase 3: Rehash on Login and Test

### Entry Criteria
- Module in place.

### Actions
1. In the login route, when `verifyPassword` returns `newHash`, update the user row before issuing the session or token. Use the existing ORM update call (Prisma `prisma.user.update`, TypeORM `repository.update`, Knex `knex('users').update`); do not invent a repository method.
2. Write tests (Jest or Vitest, whichever `package.json` already uses):
   - new hash starts with `$argon2id$`;
   - wrong password returns `{ ok: false }` without throwing;
   - a hash made with `{ memoryCost: 8192, timeCost: 1, parallelism: 1 }` returns `newHash`;
   - a malformed stored string returns `{ ok: false }`.
3. Run `npm test -- --runInBand` (Jest) or `npx vitest run` and read the summary.
4. Do NOT mark tests `.skip` or delete failing tests to pass.

### Output
`password_hashing_change`.

### Quality Gate
- Test summary shows the four new tests passing and 0 failed.
- Mutation check: change `memoryCost` in `OPTS` to 8192, rerun, confirm the rehash test fails, revert, rerun green. Record both runs.

---

## Worked Example

Illustrative only. Express API with `bcryptjs` at cost 8.

Phase 1:
```
$ npm ls bcryptjs argon2
api@1.4.0
└── bcryptjs@2.4.3
```
Package chosen: `argon2` (plain Linux container).

Phase 2:
```
$ npm install argon2 && npm ls argon2
└── argon2@0.41.1
$ node -e "require('argon2').hash('x',{type:2,memoryCost:19456,timeCost:2,parallelism:1}).then(h=>console.log(h.slice(0,31)))"
$argon2id$v=19$m=19456,t=2,p=1$
```

Phase 3:
```
$ npx vitest run tests/passwords.test.ts
 ✓ tests/passwords.test.ts (4 tests) 412ms
 Test Files  1 passed (1)
```
Existing bcrypt rows go to `auth-bcrypt-to-argon2id-migration`.

---

## Exit Criteria

DONE when all hashing goes through one module producing Argon2id at or above OWASP parameters, logins upgrade weaker hashes, and the four tests plus the mutation check are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `package.json` | **Stop**: this flow is for Node; return to the chain and select the matching stack flow. |
| Phase 2 | `npm install argon2` fails compiling (node-gyp error) | **Adjust**: install build tools per the package README, or switch to `@node-rs/argon2` per the Phase 1 rule. |
| Phase 2 | `tsc --noEmit` errors after a call-site edit | **Retry**: fix that one file before editing another. |
| Phase 3 | Tests fail | **Retry**: fix code, not assertions. |
| Phase 3 | Mutation check still passes | **Stop**: the test does not cover rehash; rewrite it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
