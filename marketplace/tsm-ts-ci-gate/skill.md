# TypeScript CI Gate on Zero Errors

**One-line description:** Adds a required CI job that pins the exact TypeScript version, fails on any tsc error, fails on any typed-lint warning, and fails when type coverage drops below the committed baseline, with an interim error ratchet for repos that are not yet at zero.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `migration_profile` (object, required): Supplies `package_manager`, `install_command`, `ci_provider`, `check_command`.
- `ts_type_coverage` (object, optional): Baseline from `tsm-ts-type-coverage`; supplies the exact command and the percent for the ratchet.
- `ts_boundary_validators` (object[], optional): From `tsm-ts-zod-boundaries`; when present its tests are part of the required test run.
- `ci_platform` (string, optional): Overrides `migration_profile.ci_provider` (`github-actions` or `gitlab-ci` are written out here; others follow the same steps in their own syntax).

---

## Outputs

- `ts_ci_gate` (object): Path of the CI file, the job name, the pinned versions, the coverage floor value and where it is stored, the gate mode (zero-error or ratchet), and links or logs of one failing and one passing run proving the gate works.

---

## Phase 1: Pin and Choose the Gate Mode

### Entry Criteria
- `typescript` is in `devDependencies`.

### Actions
1. Pin exactly: in `package.json` change `"typescript": "^5.6.2"` to `"typescript": "5.6.2"` (the version `npm ls typescript` prints). Do the same for `typescript-eslint`, `eslint`, `type-coverage`. Reinstall to update the lock file. A minor TypeScript release can add errors; the upgrade must be a deliberate commit.
2. Pin the Node version CI uses: create or confirm `.nvmrc` with the major the project runs on.
3. Run `npx tsc --noEmit -p tsconfig.json --pretty false | grep -c "error TS"`. Choose the mode:

   | Error count | Mode |
   |---|---|
   | 0 | zero-error: tsc must exit 0. |
   | Greater than 0 | ratchet: new errors fail the build while existing ones are fixed (Phase 2 step 4). |

4. Write the coverage floor into the repo so CI reads it from a file, not from the workflow: `package.json` script `"typecov": "type-coverage -p tsconfig.json --strict --at-least <percent>"` using `ts_type_coverage.percent` rounded down to two decimals, with the same `--ignore-files` patterns. If `ts_type_coverage` is absent, run `tsm-ts-type-coverage` first; never invent a floor.

### Output
Pinned versions, mode, coverage floor script.

### Quality Gate
- `grep '"typescript": "[0-9]' package.json` matches (no `^` or `~`).
- `npm run typecov` exits 0 on the current commit.

---

## Phase 2: Write the CI Job

### Entry Criteria
- Phase 1 complete.

### Actions
1. GitHub Actions: create `.github/workflows/typecheck.yml`:
   ```yaml
   name: typecheck
   on:
     pull_request:
     push:
       branches: [main]
   jobs:
     typecheck:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version-file: .nvmrc
             cache: npm
         - run: npm ci
         - run: npx tsc --noEmit -p tsconfig.json
         - run: npx eslint "src/**/*.{ts,tsx}" --max-warnings 0
         - run: npm run typecov
   ```
   Use `cache: pnpm` or `cache: yarn` and the matching install command from `migration_profile` for other package managers (pnpm also needs `pnpm/action-setup` before setup-node).
2. GitLab CI: add a job to `.gitlab-ci.yml` with `image: node:<major from .nvmrc>`, `script:` lines identical to the four `run` commands, and `rules: - if: $CI_PIPELINE_SOURCE == "merge_request_event"`.
3. With project references, replace the tsc line with `npx tsc -b --pretty false`.
4. Ratchet mode only: install `@betterer/cli` and `@betterer/typescript` pinned, create `.betterer.ts`:
   ```ts
   import { typescript } from "@betterer/typescript";
   export default {
     "strict typescript": () => typescript("./tsconfig.json", { strict: true }).include("./src/**/*.{ts,tsx}"),
   };
   ```
   Run `npx betterer` once to write `.betterer.results` and commit it. In CI replace the tsc line with `npx betterer ci`, which fails if the results file would change (new errors, or fixed errors not recorded). Check the betterer docs for the installed version's CLI names before use.
5. Commit `ci: add typecheck gate`.

### Output
CI file committed.

### Quality Gate
- The CI file parses: for GitHub run `actionlint` (github.com/rhysd/actionlint) if it is installed, otherwise push the branch and read the Actions tab for a syntax error.
- The job ran on the branch and passed.

---

## Phase 3: Prove the Gate Fails and Make It Required

### Entry Criteria
- The job passes on the branch.

### Actions
1. On a throwaway branch, add one line that is a type error, for example `const n: number = "x";` in any source file. Push and confirm the job fails at the tsc step with `error TS2322`. Delete the branch.
2. On another throwaway branch, add `const v: any = 1;` and confirm the job fails at the eslint step (`no-explicit-any`) or the coverage step. Delete the branch.
3. Ask the user to add the job (`typecheck / typecheck` on GitHub) as a required status check in branch protection or a ruleset. You cannot verify a setting you cannot see; record that the user confirmed it.
4. Record the run URLs or logs in `ts_ci_gate`.

### Output
`ts_ci_gate`.

### Quality Gate
- One recorded failing run per throwaway branch, each failing at the expected step with the expected error code or rule.
- One recorded passing run on the migration branch.
- User confirmation that the check is required is recorded, or the item is listed as open.

---

## Worked Example

Illustrative only. GitHub Actions, npm, zero-error mode, coverage 97.10.

Phase 1: `"typescript": "5.6.2"` pinned; `.nvmrc` = `20`; `"typecov": "type-coverage -p tsconfig.json --strict --at-least 97.10 --ignore-files \"src/generated/**\""`; `npm run typecov` prints `19391 / 19970 97.10%` and exits 0.

Phase 2: workflow committed; the run on `types/strict-migration` passes in 2m14s.

Phase 3: branch `gate-probe-1` fails:
```
src/index.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.
```
Branch `gate-probe-2` fails at eslint with `Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any`. User confirms the required check.

---

## Exit Criteria

DONE when CI pins the compiler, fails on any tsc error, lint warning or coverage drop, has been shown to fail on a deliberate error, and the user confirmed it is a required check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Local and CI error counts differ | **Adjust**: compare `npx tsc --version` in both; a different Node or package manager resolved another TypeScript. Fix the pin. |
| Phase 2 | tsc runs out of memory in CI | **Adjust**: set `NODE_OPTIONS: --max-old-space-size=<value the local run needed>` in the job env. |
| Phase 3 | The deliberate error does not fail the job | **Stop**: the gate is not running the check; fix before declaring done. |
| Phase 3 | Someone proposes `continue-on-error: true` | **Stop**: that makes the gate advisory; refuse. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
