# Conventional Commits Gate with commitlint

**One-line description:** Installs commitlint with the config-conventional preset, a commit-msg hook for local commits, and a CI job that lints the pull request commit range or, for squash-merge repositories, the pull request title, so every commit that reaches the main branch can drive an automated version bump.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository root.
- `ci_platform` (string, required): `github` or `gitlab`.

---

## Outputs

- `commitlint_config` (object): Config file path and contents, hook mechanism used (`husky` or `pre-commit`), and the merge strategy it was matched to.
- `commit_gate_check` (object): CI job name, the command it runs, and the recorded pass and fail runs that prove it works.

---

## Phase 1: Detect Merge Strategy and Tooling

### Entry Criteria
- `repo_path` is a git repository with a remote.

### Actions
1. Read the merge strategy. GitHub: `gh api repos/OWNER/REPO --jq '{squash: .allow_squash_merge, merge: .allow_merge_commit, rebase: .allow_rebase_merge, title: .squash_merge_commit_title}'`. GitLab: Settings, Merge requests, "Squash commits when merging".
2. Apply this table:

   | Merge strategy | What lands on main | What to lint in CI |
   |---|---|---|
   | Squash only | One commit whose subject is the PR title (when `squash_merge_commit_title` is `PR_TITLE`) | The PR title |
   | Merge commits or rebase | Every PR commit | Every commit in the PR range |
   | Mixed | Either | Both the PR title and the commit range |

3. Detect the hook mechanism: if `package.json` exists, use husky. If `.pre-commit-config.yaml` exists, use the pre-commit framework. If neither, use pre-commit for non-Node repos and husky for Node repos.

### Output
Merge strategy and hook mechanism recorded in `commitlint_config`.

### Quality Gate
- The `gh api` (or GitLab setting) output is quoted in `commitlint_config`.
- Exactly one hook mechanism is chosen.

---

## Phase 2: Install Config and Hook

### Entry Criteria
- Strategy recorded.

### Actions
1. Node repos: `npm install --save-dev @commitlint/cli @commitlint/config-conventional husky`.
2. Create `commitlint.config.mjs` containing exactly: `export default { extends: ['@commitlint/config-conventional'] };`. Use the `.mjs` extension so it loads as ESM regardless of the package `type` field. Do not add custom rules in this step; the preset already enforces the type list (`build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`) and its documented header length limit.
3. husky v9: run `npx husky init` (creates `.husky/` and a `prepare` script), then create `.husky/commit-msg` containing the single line `npx --no -- commitlint --edit "$1"`. Delete the sample `.husky/pre-commit` only if it contains just `npm test` and the user did not ask for it.
4. pre-commit framework instead: add to `.pre-commit-config.yaml` a repo `https://github.com/compilerla/conventional-pre-commit` with hook id `conventional-pre-commit` and `stages: [commit-msg]`; pin `rev` to the newest tag shown on its releases page. Then run `pre-commit install --hook-type commit-msg`.
5. Test locally:
   - `echo "added stuff" | npx commitlint` must exit non-zero and print `subject may not be empty` and `type may not be empty`.
   - `echo "feat(parser): accept trailing commas" | npx commitlint` must exit 0.

### Output
Config file and hook committed.

### Quality Gate
- Both local test commands produce the stated exit codes (`echo $?` after each).
- `git commit --allow-empty -m "bad"` is rejected by the hook; `git commit --allow-empty -m "chore: hook probe"` succeeds and is then removed with `git reset --soft HEAD~1`.

---

## Phase 3: Add the CI Gate

### Entry Criteria
- Local hook works.

### Actions
1. GitHub, commit-range lint. Create `.github/workflows/commitlint.yml`:
   ```yaml
   name: commitlint
   on: [pull_request]
   permissions: {contents: read}
   jobs:
     commitlint:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with: {fetch-depth: 0}
         - uses: actions/setup-node@v4
           with: {node-version: lts/*}
         - run: npm ci
         - run: npx commitlint --from ${{ github.event.pull_request.base.sha }} --to ${{ github.event.pull_request.head.sha }} --verbose
   ```
   `fetch-depth: 0` is required; with the default shallow clone the base SHA is missing and commitlint fails with an unknown revision error.
2. GitHub, squash-merge title lint: add a job using `amannn/action-semantic-pull-request@v5` with `env: GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` and `on: pull_request_target: types: [opened, edited, synchronize]`. That action only reads the title; do not check out PR code in a `pull_request_target` job.
3. GitLab: a job in `.gitlab-ci.yml` with `rules: - if: $CI_PIPELINE_SOURCE == "merge_request_event"`, `variables: GIT_DEPTH: 0`, and script `npx commitlint --from "$CI_MERGE_REQUEST_DIFF_BASE_SHA" --to "$CI_COMMIT_SHA" --verbose`.
4. Mark the job as a required status check using the exact job name shown by `gh pr checks <PR>`.
5. Prove it: open a test PR with a commit "wip" and confirm the job fails; amend to "chore: probe commitlint gate" and confirm it passes. Close the test PR.

### Output
`commit_gate_check`.

### Quality Gate
- The failing run URL and the passing run URL are recorded in `commit_gate_check`.
- The job name appears in the required checks for `main` (`gh api repos/OWNER/REPO/rules/branches/main`).

---

## Worked Example

Illustrative. Node library on GitHub, squash merges only with `squash_merge_commit_title` = `PR_TITLE`.

- Phase 1: table row "Squash only": lint PR titles (and commit range too, since it is cheap).
- Phase 2: `echo "added stuff" | npx commitlint` prints:
  ```
  ✖   subject may not be empty [subject-empty]
  ✖   type may not be empty [type-empty]
  ✖   found 2 problems, 0 warnings
  ```
  and exits 1.
- Phase 3: PR titled "update readme" fails `action-semantic-pull-request` with `No release type found in pull request title`. Renamed to "docs: explain config file lookup", it passes.

---

## Exit Criteria

DONE when commitlint rejects a bad message locally and in CI, accepts a good one, the CI job is required on the main branch, and the lint target matches the merge strategy.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `Cannot find module "@commitlint/config-conventional"` | **Adjust**: the package is missing from devDependencies; install it, rerun the local test. |
| Phase 2 | Hook does not run on commit | **Adjust**: check `git config core.hooksPath` equals `.husky/_` (husky v9) or rerun `pre-commit install --hook-type commit-msg`. |
| Phase 3 | `fatal: Invalid revision range` in CI | **Adjust**: set `fetch-depth: 0` (GitHub) or `GIT_DEPTH: 0` (GitLab). |
| Phase 3 | Existing history fails the gate | **Adjust**: lint only the PR range; never rewrite published history to satisfy the linter. |
| Any | Tempted to loosen rules to make a PR pass | **Stop**: fix the commit message or PR title instead. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
