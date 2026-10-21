# Node Deprecation Warning Sweep

**One-line description:** Finds Node.js runtime deprecations (DEP0xxx codes) with `--trace-deprecation`, `npm warn deprecated` install-time notices, and library console deprecations (React, Jest, ESLint), traces each to project code or a dependency, and fixes the project-owned ones before any major bump.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `upgrade_scope` (object, required): From `dup-scope-intake`. Uses `test_command`, `install_command`, `work_dir`.
- `baseline_report` (object, required): From `dup-baseline-snapshot`. Uses `deprecation_warning_count`.
- `upgrade_plan` (object[], required): From `dup-upgrade-order-plan`.

---

## Outputs

- `deprecation_report` (object): `before_count`, `after_count`, `runtime_deps` (DEP code, origin file, owner package or `project`), `install_deprecated` (package@version and message), `library_warnings`, `fixed` (with commits). Also written to `<work_dir>/deprecations-node.json`.

---

## Phase 1: Capture All Three Kinds

### Entry Criteria
- `upgrade_scope.stack == "node"`.

### Actions
1. Runtime deprecations with stack traces: `NODE_OPTIONS=--trace-deprecation <test_command> > .dep-upgrade/node-dep.log 2>&1`. Each warning looks like `(node:4121) [DEP0040] DeprecationWarning: The \`punycode\` module is deprecated.` followed by a stack. Look up each code at `https://nodejs.org/api/deprecations.html` to read its type (Documentation-only, Runtime, End-of-Life) and replacement.
2. Install-time notices: `<install_command> 2>&1 | grep -i 'deprecated' > .dep-upgrade/npm-deprecated.log`. Lines read `npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory...`. Find who pulls each in: `npm explain inflight`.
3. Library console warnings in tests: `grep -nE 'Warning: .*(deprecated|will be removed)|is deprecated|DeprecationWarning' .dep-upgrade/node-dep.log` (React prints `Warning: ReactDOM.render is no longer supported...`; React 18.3 adds warnings for APIs removed in 19).
4. For each runtime warning, read the first stack frame outside `node:internal`: a path under `node_modules/<pkg>/` means the owner is `<pkg>`; otherwise `project`.

### Output
Three warning lists with owners.

### Quality Gate
- Every DEP code in the log has a row with an owner.
- Every install-time deprecated package has an `npm explain` path recorded.

---

## Phase 2: Fix Project-Owned Deprecations

### Entry Criteria
- Lists exist.

### Actions
1. For each `project` runtime deprecation, apply the replacement documented on the deprecations page. Common ones:

| Code | Deprecated | Replacement |
|---|---|---|
| DEP0005 | `new Buffer()` | `Buffer.from()`, `Buffer.alloc()` |
| DEP0040 | `punycode` core module | userland `punycode` package (`require('punycode/')`), or `url.domainToASCII` |
| DEP0116 | `url.parse()` legacy API | `new URL()` (WHATWG URL); check behavior on relative URLs |
| DEP0128 | modules with invalid `main` entry | fix the `main` field |

2. One deprecation code per commit; run the full test suite after each.
3. For dependency-owned runtime warnings and `npm warn deprecated` packages: check whether a newer version of the owning direct dependency removes it (`npm view <direct>@latest dependencies --json`). Add a note to the matching plan item; do not edit files inside `node_modules` and do not add `patch-package` patches unless the user asks.
4. Never silence warnings with `--no-deprecation` or `process.noDeprecation = true`.

### Output
Fix commits and notes on plan items.

### Quality Gate
- Rerun Phase 1 step 1: every fixed DEP code is gone from the log; the test results equal the baseline.

---

## Phase 3: Guard Against Regressions

### Entry Criteria
- Fixes committed.

### Actions
1. If the user agrees, make project-owned runtime deprecations fatal in tests: add `--throw-deprecation` to the test script's `NODE_OPTIONS` (for example in `package.json` `"test": "NODE_OPTIONS=--throw-deprecation jest"` on POSIX shells, or via `cross-env` if the project already uses it). Only do this when no dependency-owned runtime deprecation remains, or the suite will fail on third-party code.
2. Write `<work_dir>/deprecations-node.json` with `after_count` from a fresh run.

### Output
`deprecation_report`.

### Quality Gate
- `after_count` comes from a fresh run of Phase 1 step 1.
- If `--throw-deprecation` was added, the suite passes with it.

---

## Worked Example

Illustrative only. Node 20 Express app.

- Phase 1: `NODE_OPTIONS=--trace-deprecation npm test` logs `[DEP0040]` with first non-internal frame `node_modules/tr46/index.js` (owner `tr46` via `whatwg-url` via `node-fetch@2`), and `[DEP0005] Buffer() is deprecated` at `src/crypto/sign.js:12` (owner `project`). Install prints `npm warn deprecated rimraf@3.0.2` (via `jest` 29).
- Phase 2: replace `new Buffer(payload)` with `Buffer.from(payload)` in `src/crypto/sign.js`; tests pass. Note on plan item `node-fetch 2 -> 3` that it removes the punycode chain.
- Phase 3: user declines `--throw-deprecation` because DEP0040 still comes from a dependency. `before_count=3`, `after_count=2`.

---

## Exit Criteria

DONE when every deprecation is attributed to an owner, project-owned runtime deprecations are fixed, and dependency-owned ones are attached to plan items.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Test runner spawns workers that drop `NODE_OPTIONS` | **Adjust**: jest passes env to workers by default; for others run one worker (`--runInBand` for jest, `--pool=forks --poolOptions.forks.singleFork` for vitest; check `--help`). |
| Phase 2 | Replacement behaves differently (`url.parse` vs `URL` on relative input) | **Return**: revert, add a test that pins current behavior, then retry with the test in place. |
| Phase 3 | `--throw-deprecation` fails on third-party code | **Adjust**: remove it and record the owning package. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
