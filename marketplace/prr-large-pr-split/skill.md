# Large PR Split into Review Units

**One-line description:** Measures the reviewable size of a PR after excluding generated files, lockfiles and pure renames, and when it exceeds the team's limit splits it into ordered review units by commit, by layer, or by separating mechanical from behavioral change, each unit small enough to review in one sitting.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_dir` (string, required): Local clone path.
- `base_branch` (string, required): PR target branch.
- `head_sha` (string, required): PR head commit.
- `diff_stat` (string, required): `git diff --shortstat` line for the PR.
- `intent_statement` (object, required): Output of `prr-intent-scope-check`.
- `max_review_lines` (integer, required): The team's limit on changed lines per review unit. This is a team policy input, not a constant this flow supplies. Reference point: the SmartBear and Cisco code review study reported reviewer defect-finding dropping beyond roughly 200 to 400 lines per session; teams set their own number.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `review_units` (object[]): Ordered units: `{ "unit": 1, "title": "...", "paths": [...], "commits": [...], "changed_lines": N, "kind": "mechanical|behavioral" }`.
- `split_findings` (object[]): Findings asking for a split, written to `<findings_dir>/prr-large-pr-split.json`.

---

## Phase 1: Measure Reviewable Size

### Entry Criteria
- `max_review_lines` is a positive integer supplied by the user. If missing, stop and ask; do not pick one.

### Actions
1. List files git or the forge already marks as generated: `git -C <repo_dir> check-attr linguist-generated -- $(git diff --name-only origin/<base_branch>...<head_sha>)`. Lines ending `: set` or `: true` are generated.
2. Build the exclude pathspec. Always exclude these when present: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `poetry.lock`, `uv.lock`, `Pipfile.lock`, `go.sum`, `Cargo.lock`, `composer.lock`, `Gemfile.lock`, `vendor/`, `node_modules/`, `__snapshots__/`, `*.snap`, plus every generated file from step 1.
3. Count reviewable lines (insertions plus deletions):
   `git diff --numstat -M origin/<base_branch>...<head_sha> -- . ':(exclude)package-lock.json' ':(exclude)go.sum' ...`
   Sum columns 1 and 2. Binary files print `-` and count as 0.
4. Pure renames (`R100` in `--name-status`) contribute 0 lines with `-M`; confirm no rename row has a large count.
5. Compare the sum with `max_review_lines`.

### Output
Reviewable line count, excluded file list.

### Quality Gate
- The sum is reproducible: rerunning the same `--numstat` command gives the same number.
- Every excluded path is listed with its reason (lockfile, generated, vendored, snapshot).

---

## Phase 2: Choose a Split Strategy

### Entry Criteria
- Reviewable line count is known.

### Actions
1. If the count is less than or equal to `max_review_lines`, create one unit containing all paths and go to Phase 3.
2. Otherwise inspect commits: `git log --reverse --format='%h %s' origin/<base_branch>..<head_sha>` and `git show --stat <sha>` for each.
3. Pick the first strategy in this table whose condition holds:

| Condition | Strategy |
|---|---|
| Each commit is self-contained and under the limit (`git show --numstat <sha>` sum) | One unit per commit, in commit order |
| The diff mixes renames, formatting or mass search-and-replace with logic changes | Unit A: mechanical changes only; Unit B onward: behavioral changes |
| Changes span layers (schema/migration, data access, service, API, UI) | One unit per layer, ordered from schema outward |
| Changes span independent directories with no imports between them | One unit per directory |
| None of the above | Ask the author to split; record a blocking finding |

4. Find mechanical hunks with `git diff -M -w --color-moved=zebra --color-moved-ws=allow-indentation-change` (moved and whitespace-only code shows as moved or disappears) and `git diff --word-diff` (renames show as `[-old-]{+new+}` with no other change).
5. A unit may exceed `max_review_lines` only if it is entirely mechanical and you can verify it by a command (for example rerunning the codemod). Record the command in the unit.

### Output
Draft unit list with strategy name.

### Quality Gate
- Every reviewable path appears in exactly one unit.
- Every behavioral unit has `changed_lines` less than or equal to `max_review_lines`.

---

## Phase 3: Emit Units and Split Findings

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Order units so each depends only on earlier ones: contracts (schemas, types, migrations) first, then implementation, then callers, then tests if separated.
2. If the PR needed splitting and no commit-based split existed, write a finding with `proposed_label` `blocking` and a fix that gives the author exact commands for a stacked PR:
   ```
   git switch -c part-1-mechanical origin/<base_branch>
   git checkout <head_sha> -- <unit 1 paths>
   git commit -m "Part 1: <title>"
   ```
   repeated per unit, each branching from the previous part.
3. If commits already form good units, do not ask for a split; write a `nit` finding suggesting the reviewer read commit by commit, and list the commit SHAs.
4. Write `split_findings` to `<findings_dir>/prr-large-pr-split.json` with the same item fields as other review flows (`flow`, `category`="size", `file`, `line`, `evidence`, `proposed_label`, `fix`). Validate with `python -m json.tool`.

### Output
`review_units`, `split_findings`.

### Quality Gate
- `review_units` is non-empty and ordered with unit numbers 1..N.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. `max_review_lines=400` (team policy). `--numstat` excluding `package-lock.json` sums to 1,310 lines across 22 files. Commits:
```
a1b2c3d Rename OrderSvc to OrderService
d4e5f6a Add refund state to order model and migration
0718293 Implement refund endpoint
3a4b5c6 Update UI for refunds
```
- Phase 2: commit a1b2c3d is 700 lines of rename only (word-diff shows only `[-OrderSvc-]{+OrderService+}`), so it becomes a mechanical unit verified by `rg -c OrderSvc` returning 0. The other three commits are 210, 280 and 120 lines.
- Phase 3: four units in commit order; finding is a `nit`: "Read commit by commit: a1b2c3d (mechanical), d4e5f6a, 0718293, 3a4b5c6."

---

## Exit Criteria

DONE when reviewable size is measured with exclusions recorded, every path sits in exactly one ordered unit, behavioral units are within `max_review_lines`, and any needed split request is a finding with exact git commands.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `max_review_lines` not supplied | **Stop**: ask the user for the team limit; do not invent one. |
| Phase 1 | A generated file is not marked in `.gitattributes` | **Adjust**: exclude it only if its header says it is generated (for example "Code generated ... DO NOT EDIT." for Go) and record that evidence. |
| Phase 2 | One commit alone exceeds the limit with mixed changes | **Return**: blocking finding asking the author to split that commit. |
| Phase 3 | Unit order has a circular dependency | **Adjust**: merge the two units and record why. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
