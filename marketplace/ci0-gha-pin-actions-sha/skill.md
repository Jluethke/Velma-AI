# Pin GitHub Actions to Full Commit SHAs

**One-line description:** Replaces every third-party `uses:` tag reference in workflows with the full 40-character commit SHA the tag points to (dereferencing annotated tags), keeps the version as a trailing comment, and adds a Dependabot `github-actions` config so pins stay current.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `gha_workflow_path` (string, required): A workflow file; this flow also scans every other file under `.github/workflows/` and every local composite action under `.github/actions/`.

---

## Outputs

- `pinned_actions_table` (object[]): One row per reference: `{file, line, action, old_ref, sha, version_comment, verified}`.

---

## Phase 1: Inventory Unpinned References

### Entry Criteria
- `.github/workflows/` exists.

### Actions
1. List every `uses:` line: `grep -rnE '^\s*-?\s*uses:' .github/workflows .github/actions 2>/dev/null`.
2. Classify each reference:

| Reference form | Action |
|---|---|
| `./path` (local action) | Skip; it is versioned with the repo |
| `docker://image:tag` | Pin to digest: `docker://image@sha256:<digest>` from `docker buildx imagetools inspect image:tag` |
| `owner/repo@<40 hex chars>` | Already pinned; verify in Phase 2 |
| `owner/repo@v4`, `@v4.2.2`, `@main`, `@master` | Pin in Phase 2 |
| `owner/repo/.github/workflows/x.yml@ref` (reusable workflow) | Pin in Phase 2, same method |

3. Find unpinned lines in one command: `grep -rnP 'uses:\s*(?!\./|docker://)[^@\s]+@(?![0-9a-f]{40}\b)' .github/`.
4. Why this matters: a tag is mutable. In March 2025 the `tj-actions/changed-files` tags were moved to a malicious commit (CVE-2025-30066) and every workflow referencing a tag ran it. A SHA cannot be moved.

### Output
List of references to pin.

### Quality Gate
- The grep from step 3 output is saved as the "before" list.
- Every `uses:` line from step 1 is classified in one table row.

---

## Phase 2: Resolve Tags to Commit SHAs

### Entry Criteria
- Unpinned list exists.

### Actions
1. For each `owner/repo@tag`, resolve the commit SHA. Use one of:
   - `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha` (returns the commit SHA, already dereferenced).
   - `git ls-remote https://github.com/<owner>/<repo> 'refs/tags/<tag>' 'refs/tags/<tag>^{}'`. If two lines print, the tag is annotated and the line ending in `^{}` is the commit SHA; the other is the tag object SHA. Use the `^{}` one.
2. For a major-only tag such as `v4`, also find the exact release it currently equals, so the comment is precise: `gh api repos/<owner>/<repo>/releases/latest --jq .tag_name`, then confirm that release tag resolves to the same SHA. If not equal, keep the comment as the major tag.
3. Rewrite the line as `uses: owner/repo@<sha> # v4.2.2`. Edit one file at a time; run `actionlint` on it before the next file.
4. Do not pin `@main` or `@master` to the current branch head without telling the user: there is no release behind it. Report it and ask whether to move to a released tag first.
5. Do not shorten SHAs. GitHub requires the full 40 characters for a SHA reference.
6. An automated alternative is `pinact run` (suzuki-shunsuke/pinact); if used, still perform Phase 3 verification.

### Output
Rewritten workflow files.

### Quality Gate
- The grep from Phase 1 step 3 prints nothing.
- Each new SHA is 40 lowercase hex characters: `grep -rhoP 'uses:\s*[^@\s]+@\K[0-9a-f]+' .github | awk 'length($0)!=40'` prints nothing.

---

## Phase 3: Verify and Keep Current

### Entry Criteria
- All references pinned.

### Actions
1. Verify each SHA exists in the claimed repository (a SHA from a fork can be referenced through the parent repo name): `gh api repos/<owner>/<repo>/commits/<sha> --jq .sha` must print the same SHA, and `gh api "repos/<owner>/<repo>/compare/<version_tag>...<sha>" --jq .status` must print `identical`.
2. Add or extend `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```
   Dependabot updates SHA pins and their version comments together. The schedule interval is the user's choice; `weekly` is shown only as an example value from the Dependabot docs.
3. Push to a PR branch and confirm the workflow still runs: `gh run watch --exit-status`.
4. If the repository or organization Actions settings offer a policy requiring SHA-pinned actions, tell the user where it is (Settings, Actions, General) and let them decide.

### Output
`pinned_actions_table`.

### Quality Gate
- Every row has `verified: true` from the compare check printing `identical`.
- `.github/dependabot.yml` contains `package-ecosystem: "github-actions"`.
- The CI run on the PR branch succeeded.

---

## Worked Example

Illustrative only. `ci.yml` uses `actions/checkout@v4` and `actions/setup-python@v5`.

Phase 2:
```
$ git ls-remote https://github.com/actions/checkout 'refs/tags/v4.2.2' 'refs/tags/v4.2.2^{}'
11bd71901bbe5b1630ceea73d27597364c9af683	refs/tags/v4.2.2
```
One line printed, so it is a lightweight tag and the SHA is the commit. Line becomes:
`uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2`.
Phase 3: `gh api repos/actions/checkout/compare/v4.2.2...11bd7190...` prints `identical`. The SHA shown is an example; always resolve it yourself, never copy a SHA from documentation or a model's memory.

---

## Exit Criteria

DONE when no non-local `uses:` reference lacks a full SHA, every SHA is verified against its tag, Dependabot tracks the `github-actions` ecosystem, and CI still passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `grep -P` unsupported (BSD grep on macOS) | **Adjust**: use `ggrep -P` from GNU grep, or `rg -nP` with the same pattern. |
| Phase 2 | Tag does not exist upstream | **Return**: report the reference; it may be a deleted or typo tag. |
| Phase 2 | Reference is a branch with no release | **Return**: ask the user which release to adopt. |
| Phase 3 | Compare status is not `identical` | **Stop**: the SHA does not match the tag; re-resolve and never keep an unverified SHA. |
| Phase 3 | CI breaks after pinning | **Adjust**: the major tag pointed to a different minor than the SHA; read the action's changelog and pin the matching release. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
