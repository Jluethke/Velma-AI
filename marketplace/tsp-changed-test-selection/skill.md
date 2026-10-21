# Changed-Test Selection for Pull Requests

**One-line description:** Runs only the tests affected by a change on pull requests (Jest `--changedSince`, Vitest `--changed`, pytest-testmon `--testmon`, Go reverse-dependency packages from `go list -deps`) while the full suite still runs on the main branch, and proves on real past commits that the selection catches the failures the full suite would catch.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root with full git history available.
- `stack` (string, required): `python`, `node` or `go`.
- `base_ref` (string, optional): Branch to compare against; default is the repository's default branch from `git symbolic-ref refs/remotes/origin/HEAD`.

---

## Outputs

- `selection_config` (object): Selection tool and command, the base ref, the rule for when the full suite runs, the CI changes, and a replay table of past commits showing selected tests, full-suite failures, and whether the selection caught each failure.

---

## Phase 1: Choose the Selector

### Entry Criteria
- `git -C <repo_path> log --oneline | head` shows history (not a shallow clone with depth 1).

### Actions
1. Resolve `base_ref` if not given: `git symbolic-ref refs/remotes/origin/HEAD` prints `refs/remotes/origin/main`.
2. Choose:

| `stack` | Selector | How it selects | Known blind spots |
|---|---|---|---|
| node (Jest) | `npx jest --changedSince=origin/<base>` | Tests that import changed files through the module graph | Non-imported inputs (JSON read with `fs`, env, snapshots of other files), config changes |
| node (Vitest) | `npx vitest run --changed origin/<base>` | Same, through Vite's module graph | Same; check `forceRerunTriggers` in config, which re-runs all when matched files change |
| python | `pytest --testmon` (pytest-testmon) | Tests whose executed lines changed, from `.testmondata` recorded by a previous run | Needs `.testmondata` from the base commit; data files and env not tracked |
| go | Packages that depend on changed packages | `git diff --name-only origin/<base>...HEAD -- '*.go'` to packages, then reverse deps via `go list -f '{{.ImportPath}} {{join .Deps " "}}' ./...` | `go:embed` files and testdata changes need their package added explicitly |

3. Define the full-suite triggers (always run everything): any change to lockfiles, `go.mod`/`go.sum`, test config (`jest.config.*`, `vitest.config.*`, `pytest.ini`, `pyproject.toml`, `conftest.py`), CI workflow files, and test helper or fixture directories. Write them as a path list.

### Output
Selector and trigger list.

### Quality Gate
- The selector command runs locally against `base_ref` and prints a non-empty test list or `No tests found` with exit 0 (Jest needs `--passWithNoTests` for that case).

---

## Phase 2: Replay Past Commits

### Entry Criteria
- Selector chosen.

### Actions
1. Pick past commits where CI failed on the full suite: `gh run list --branch <branch> --status failure --limit <n chosen by the user> --json headSha,displayTitle`. Also pick the same number of passing commits.
2. For each commit, check out a worktree (`git worktree add ../replay <sha>`), run the selector against its parent, and run the full suite. Record: selected test count, full-suite failures, selected failures.
3. A miss is a full-suite failure absent from the selected run. For each miss, record why (blind spot from the table) and add the triggering path to the full-suite trigger list if a path rule would have caught it.
4. Remove each worktree after use: `git worktree remove ../replay`.

### Output
Replay table.

### Quality Gate
- The replay table has one row per commit with all three numbers copied from runs.
- Every miss has a reason and either a new trigger rule or an accepted-risk note from the user.

---

## Phase 3: Wire CI

### Entry Criteria
- Replay table reviewed by the user.

### Actions
1. On `pull_request` events, run the selector; on `push` to the default branch and on a schedule, run the full suite. In GitHub Actions use `if: github.event_name == 'pull_request'` on the selective step and the opposite on the full step.
2. Use `actions/checkout` with `fetch-depth: 0` so `origin/<base>` exists; otherwise `--changedSince` and `git diff` fail or select nothing.
3. Apply the full-suite trigger list with `dorny/paths-filter` or a `git diff --name-only` check in a shell step that sets an output; check the action's README for its current input names.
4. python: persist `.testmondata` from main-branch runs (see `tsp-ci-test-tool-cache`) so pull requests start from the base commit's data.
5. Do NOT make a selective run the only gate before merge without the main-branch full run; the full run catches the blind spots.

### Output
`selection_config`.

### Quality Gate
- The workflow contains both a selective step for pull requests and a full step for the default branch.
- `fetch-depth: 0` is present on the checkout used by the selector.

---

## Worked Example

Illustrative. `stack=node`, Jest 29, `base_ref=main`.

- Phase 1: `npx jest --changedSince=origin/main` on a branch touching `src/cart/total.ts` selects 14 of 188 files. Triggers: `package-lock.json`, `jest.config.ts`, `src/test/**`, `.github/workflows/**`.
- Phase 2: 10 failing and 10 passing commits replayed; 9 of 10 failures caught. Miss: commit `4e1a...` changed `src/i18n/en.json`, read with `fs.readFileSync`; added `src/i18n/**` to triggers.
- Phase 3: PR runs take 1m05s median versus 4m12s full; main still runs full.

---

## Exit Criteria

DONE when the selector runs on pull requests with full-depth checkout, the full suite runs on the default branch, and a replay of past commits records every miss with a reason or a new trigger.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Shallow clone, `origin/main` unknown | **Adjust**: `git fetch --unshallow` locally; `fetch-depth: 0` in CI. |
| Phase 2 | Old commits do not build | **Adjust**: skip them and record the skip; replay at least the commits that build. |
| Phase 2 | Many misses with no path rule | **Stop**: report that selection is unsafe for this repo; keep full runs on pull requests. |
| Phase 3 | `.testmondata` missing on PR runs | **Adjust**: testmon then runs everything, which is safe; fix the cache restore. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
