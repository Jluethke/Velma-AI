# TypeScript Dead Code Removal with knip

**One-line description:** Finds unused files, unused exports, unused exported types and unused dependencies in a TypeScript or JavaScript project with knip, confirms each finding against dynamic imports, string references and coverage, and removes them one category and one item per commit with typecheck and tests green after each.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Project root with `package.json`.
- `test_command` (string, required): Full suite command.
- `characterization_tests` (object, required): From `srf-node-characterization-tests`.
- `dead_code_scope` (string, required): Directory to act on, for example `src`. Findings outside it are recorded but not removed.

---

## Outputs

- `step_commits` (string[]): One SHA per removal.
- `step_log` (object[]): Per item: knip category, evidence, decision, SHA.

---

## Phase 1: Configure and Run knip

### Entry Criteria
- `git status --porcelain` empty; `npx tsc --noEmit` exits 0.

### Actions
1. Run `npx knip --version`; install with `npm install --save-dev knip` if missing (ask first).
2. Check entry configuration. knip finds entries from `package.json` (`main`, `exports`, `bin`, scripts) and from enabled plugins (Jest, Vitest, Next.js, Storybook, ESLint and others). If the project has a custom entry (a CLI file, a worker loaded by path), create `knip.json` with `{"entry": ["src/cli.ts"], "project": ["src/**/*.ts"]}`. Read the knip docs for the plugin list before adding entries by hand.
3. Run `npx knip --reporter compact` and also `npx knip --production` (production mode ignores test and dev files, so code used only by tests shows up). Record both outputs. Sections are `Unused files`, `Unused dependencies`, `Unused devDependencies`, `Unused exports`, `Unused exported types`, `Unlisted dependencies`.
4. Do NOT run `npx knip --fix` across the repo in one go. It edits many files at once and removes exports you have not checked.

### Output
Two knip reports.

### Quality Gate
- knip exits and prints its sections; any configuration hint lines (for example unused entry patterns) are resolved or recorded.
- Both default and `--production` outputs are saved.

---

## Phase 2: Confirm Each Finding

### Entry Criteria
- Phase 1 outputs exist.

### Actions
1. For each item inside `dead_code_scope`, run the checks:

| Check | Command |
|---|---|
| Dynamic import or `require` by computed path | `git grep -n "import(\|require(" -- "src/*"` then read paths built from variables |
| String reference (router config, DI container keys, `jest.mock` paths) | `git grep -n "<basename or export name>"` across all file types |
| Public package export | Is it reachable from `package.json` `exports`/`main`? If an API Extractor report exists, `grep -n "<name>" etc/*.api.md` |
| Runtime execution | Coverage run of the suite: `npx jest --coverage` or `npx vitest run --coverage`; the file or function shows 0% or `Uncovered Line #s` spanning it |

2. Decide:

| Category | Evidence | Decision |
|---|---|---|
| Unused file | No dynamic or string reference, 0% coverage | Delete the file. |
| Unused export | No string reference; not in the public API report | Remove the `export` keyword first (one commit); if knip or `tsc --noUnusedLocals` then reports the symbol unused locally, delete it (second commit). |
| Unused exported type | Not in the public API report | Same two-step as exports. |
| Unused dependency | No `require`/`import` in source, config files or scripts (`git grep -n "<pkg>"`) | Remove with `npm uninstall <pkg>` in its own commit. |
| Anything listed in the public API report | Any | Keep. |
| Used only by tests (`--production` finding) | Tests only | Keep unless the user confirms the feature is retired. |

### Output
Decision table per item.

### Quality Gate
- Each Delete or Remove decision cites the four checks.
- No item in the public API report is marked for removal.

---

## Phase 3: Remove One Item per Commit

### Entry Criteria
- At least one removal decision.

### Actions
1. Apply one removal. For a single export you may use `npx knip --fix --fix-type exports` only after confirming in the knip docs that the flag set exists in your version, and only if `git diff --stat` afterwards shows exactly the file you intended; otherwise edit by hand.
2. Run `npx tsc --noEmit`, the characterization command (no snapshot update), `test_command`, and the API Extractor check if configured.
3. Green: commit with the evidence in the message, for example `refactor: remove unused export formatLegacy (knip, 0 refs, 0% coverage)`. Red: `git checkout -- .` (and `git checkout -- package.json package-lock.json` for dependencies), mark Keep.
4. Rerun `npx knip --reporter compact` after each removal: removing one export can expose another as unused. Add new findings to Phase 2.

### Output
`step_commits`, `step_log`.

### Quality Gate
- After each commit, `tsc` and tests exit 0 with no snapshot written or updated.
- The removed item no longer appears in the next knip run.
- `git status --porcelain` empty.

---

## Worked Example

Illustrative only.
```
$ npx knip --reporter compact
Unused files (1)
src/legacy/csvExport.ts
Unused exports (2)
src/pricing/format.ts: formatLegacy, padCents
Unused dependencies (1)
package.json: left-pad
$ git grep -n "csvExport"
$ git grep -n "padCents"
etc/pricing.api.md:41:export function padCents(n: number): string;
```
`csvExport.ts` deleted (one commit), `formatLegacy` un-exported then deleted (two commits), `left-pad` uninstalled (one commit), `padCents` kept (public API).

---

## Exit Criteria

DONE when every removal is backed by knip plus the four checks, each is one green commit, and kept items have recorded reasons.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | knip reports most files unused | **Adjust**: entries are misconfigured; fix `entry`/`project` in `knip.json` and rerun. |
| Phase 2 | Export used through a barrel `export *` by external consumers | **Adjust**: treat as public API; keep. |
| Phase 3 | `tsc` fails after removal | **Retry**: revert; a type-only import used it. Mark Keep. |
| Phase 3 | Dependency removal breaks a build script | **Retry**: revert; record the script as a user of the dependency. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
