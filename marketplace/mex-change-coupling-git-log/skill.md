# Change Coupling from Git History

**One-line description:** Measures which files outside the candidate module change in the same commits as files inside it, using code-maat's coupling analysis on a `git log --numstat` export, so hidden runtime coupling that import graphs miss (shared schemas, config, contracts by convention) shows up before the boundary is drawn.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Monolith working tree.
- `extraction_brief` (object, required): From `mex-extraction-candidate-brief`; supplies `candidate_module`.
- `history_window` (string, optional): `git log --after` date such as `2025-10-01`. When absent, ask the user; if they have no preference, use the full history and say so in the output.

---

## Outputs

- `change_coupling` (object): `window`, `log_file`, `tool_parameters` (the code-maat parameters actually used), `coupled_pairs` (inside file, outside file, degree, average revisions), `outside_hotspots` (outside files coupled to many candidate files), and `notes` on bulk commits removed.

---

## Phase 1: Export the History

### Entry Criteria
- Java 8 or later is installed (`java -version`) for code-maat, or the code-maat Docker image is available.

### Actions
1. Export the log in code-maat's `git2` format, exactly as documented in the code-maat README:
   ```
   git -C "$REPO" log --all --numstat --date=short --pretty=format:'--%h--%ad--%aN' --no-renames --after=2025-10-01 > /tmp/mex_git.log
   ```
   Drop `--after` when using full history.
2. Get code-maat: download the release JAR from the code-maat GitHub releases page, or build it with `lein uberjar` from the repo. Do not use a JAR from an unknown mirror.
3. Find mass-change commits that would fake coupling (formatter runs, license header updates, mass renames): `git -C "$REPO" log --after=... --pretty=format:'%h %s' --shortstat | awk '/files? changed/ {print prev, $1} {prev=$0}' | sort -k2 -n -r | head -20` lists commits by files touched. Note any formatting or bulk commits; code-maat's `--max-changeset-size` option drops large changesets (read its default from `java -jar code-maat.jar -h`).

### Output
`/tmp/mex_git.log` and a list of bulk commits.

### Quality Gate
- `head -3 /tmp/mex_git.log` starts with a line matching `--<hash>--<date>--<author>`.
- `grep -c '^--' /tmp/mex_git.log` is greater than zero.

---

## Phase 2: Run Coupling Analysis

### Entry Criteria
- Log exported.

### Actions
1. Print the tool's options and defaults first: `java -jar code-maat-<version>-standalone.jar -h`. Copy the defaults for `--min-revs`, `--min-shared-revs`, `--min-coupling`, `--max-coupling` and `--max-changeset-size` into `tool_parameters`. Use those defaults unless the user supplies other values; do not invent new cutoffs.
2. Run coupling: `java -jar code-maat-<version>-standalone.jar -l /tmp/mex_git.log -c git2 -a coupling > /tmp/mex_coupling.csv`.
3. Output columns are `entity,coupled,degree,average-revs`. `degree` is the percentage of shared commits relative to the average revisions of the pair.
4. Keep only pairs with exactly one side inside the candidate:
   ```
   awk -F, -v c="app/billing/" 'NR>1 && ((index($1,c)==1) != (index($2,c)==1))' /tmp/mex_coupling.csv | sort -t, -k3 -n -r > /tmp/mex_cross.csv
   ```
5. Also run `-a revisions` to see how often each candidate file changes: `java -jar ... -l /tmp/mex_git.log -c git2 -a revisions | grep '^app/billing/'`.

### Output
`/tmp/mex_cross.csv` with cross-boundary pairs.

### Quality Gate
- `head -1 /tmp/mex_coupling.csv` prints `entity,coupled,degree,average-revs`.
- Every row in `/tmp/mex_cross.csv` has exactly one file under the candidate path.

---

## Phase 3: Interpret

### Entry Criteria
- Cross pairs computed.

### Actions
1. Classify each outside file in a cross pair with this table:

   | Outside file is | Meaning | Record as |
   |---|---|---|
   | A migration file or schema (`migrations/`, `db/`, `schema.sql`, `*.prisma`) | Shared database tables | `data_coupling` |
   | Config (`settings.py`, `application.yml`, `.env.example`) | Shared configuration | `config_coupling` |
   | Another module's source with no import edge to the candidate | Coupling by convention (duplicated logic, string keys, shared JSON shape) | `hidden_coupling` |
   | Another module's source with an import edge | Already visible in the import graph | `import_coupling` |
   | Test fixture or factory | Shared test data | `test_coupling` |

2. Count, per outside file, how many distinct candidate files it couples to; the top entries are `outside_hotspots`.
3. Write `change_coupling`.

### Output
`change_coupling`.

### Quality Gate
- Every `hidden_coupling` entry was checked against the import graph output (`mex-*-import-graph`, `mex-go-package-graph` or `mex-java-dependency-graph-jdeps`) and has no import edge.

---

## Worked Example

Illustrative. Candidate `app/billing`, window `2025-10-01`.

```
$ java -jar code-maat-1.0.4-standalone.jar -l /tmp/mex_git.log -c git2 -a coupling > /tmp/mex_coupling.csv
$ head -4 /tmp/mex_cross.csv
app/billing/models.py,app/orders/serializers.py,71,18
app/billing/tasks.py,app/settings.py,64,25
app/billing/models.py,migrations/0142_invoice_tax.py,58,12
```
Interpretation: `app/orders/serializers.py` has no import of billing but changes with `billing/models.py` in most commits; it rebuilds the invoice JSON by hand, a `hidden_coupling` that the new interface must cover.

---

## Exit Criteria

DONE when `change_coupling` lists every cross-boundary pair code-maat reports with its tool parameters recorded and each outside file classified.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | History is shallow (`git rev-parse --is-shallow-repository` prints `true`) | **Adjust**: ask the user to run `git fetch --unshallow`; coupling from a shallow clone is incomplete. |
| Phase 1 | Candidate was moved or renamed within the window | **Adjust**: run once per old path, since `--no-renames` treats old and new paths as different files. |
| Phase 2 | code-maat reports a parse error | **Retry**: re-export with the exact `--pretty=format` shown; any other format fails. |
| Phase 3 | Only bulk commits create the coupling | **Return**: report the pair as noise with the commit hashes. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
