# Minimize the Failing Input by Delta Debugging

**One-line description:** Shrinks the failing input (file, request, argument list, config) and the repro steps to the smallest version that still triggers the exact error signature, using the ddmin procedure by hand or an existing reducer (C-Reduce, cvise, `creduce`-style shell predicates), with the repro script as the oracle.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `deterministic_repro` (object, required): Output of `repro-nondeterminism-pin`; its script is the oracle (exit 1 = still failing with the same signature).
- `bug_brief` (object, required): Output of `repro-intake-checklist`; supplies `failing_input`.
- `confirm_runs` (integer, required): Number of confirmation runs for the final minimal repro; a user input.

---

## Outputs

- `minimal_input` (object): The smallest failing input found, its size before and after (bytes, lines, or element count), and the reduction log.
- `minimal_repro` (object): The repro script rewritten to use `minimal_input`, with every non-essential step removed, its run command, and its exit code over a confirmation run.

---

## Phase 1: Prepare the Predicate

### Entry Criteria
- `deterministic_repro` fails with exit code 1.

### Actions
1. Copy the failing input to `.repro/min/input.orig` and make the script read its input from a path argument (`$1`), so the reducer can swap candidates.
2. The predicate is "script exits 1". Exit 0 (bug gone) and exit 2 (different failure, for example a parse error from a broken candidate) both mean "not interesting". This rule is the most important line in the flow: a reducer that accepts any non-zero exit will shrink the input into a syntax error and report success.
3. Choose the unit to delete:

| Input type | Unit |
|---|---|
| Text file, log, CSV | Lines (then characters within the last surviving lines) |
| JSON / YAML | Object keys and array elements; reformat one element per line first (`jq . in.json > in.pretty.json`) so line deletion maps to elements |
| Source code (compiler or parser bug) | Top-level declarations, then statements; prefer `cvise` or `creduce`, which understand C-like syntax |
| Command-line arguments | Individual arguments |
| Config file | Individual settings |
| Sequence of API calls / UI steps | Individual steps in `trigger_steps` |
| Binary file | Byte ranges; only if a format-aware tool is unavailable |

### Output
Predicate script `.repro/min/interesting.sh` that exits 0 when the candidate is interesting (bug present) and 1 otherwise. Note: reducers such as C-Reduce and cvise expect exit 0 for "interesting"; this is the reverse of the repro script, so invert it explicitly: `bash .repro/repro.sh "$1"; [ $? -eq 1 ]`.

### Quality Gate
- `bash .repro/min/interesting.sh .repro/min/input.orig; echo $?` prints `0`.
- `bash .repro/min/interesting.sh /dev/null; echo $?` prints `1` (an empty input must not count as interesting unless the bug really triggers on empty input; if it does, that is your minimal input).

---

## Phase 2: Run ddmin

### Entry Criteria
- Predicate validated.

### Actions
1. If the input is C, C++, or C-like source and `cvise --version` or `creduce --version` works, run `cvise .repro/min/interesting.sh <file>` (note: cvise runs the predicate in a temporary directory with the file copied in by name, so the predicate must reference the file by its base name). Skip to Phase 3.
2. Otherwise run ddmin by hand on the units chosen in Phase 1:
   1. Set n = 2. Split the current input into n contiguous chunks of near-equal size.
   2. For each chunk, test the input with only that chunk kept. If interesting, make it current, set n = 2, repeat.
   3. Else, for each chunk, test the input with that chunk removed (the complement). If interesting, make it current, set n = max(n - 1, 2), repeat.
   4. Else, if n < number of units, set n = min(2n, number of units) and repeat.
   5. Else stop: the input is 1-minimal (removing any single unit makes it uninteresting).
3. Log every test: chunk count, which chunk, kept or removed, predicate result. Use `sed -n '<start>,<end>p'` for line ranges and `sed '<start>,<end>d'` for removal.
4. Save each accepted candidate as `.repro/min/step-<k>.txt` so any step can be recovered.

### Output
1-minimal input and the log.

### Quality Gate
- The final candidate passes the predicate (`interesting.sh` exits 0).
- Removing each single remaining unit fails the predicate (run the loop and paste the results).

---

## Phase 3: Minimize the Steps and Freeze

### Entry Criteria
- Minimal input found.

### Actions
1. Apply the same remove-one-and-test loop to the script's steps (config flags, setup commands, environment pins). Keep a step only if removing it changes exit 1 to anything else.
2. Rewrite the script into `minimal_repro` with the minimal input inlined when it is under a screen of text, or as a fixture path otherwise.
3. Run `minimal_repro` `confirm_runs` times as in `repro-deterministic-script` and record exit codes.
4. Compare the signature line in the minimal run's log with `bug_brief.error_signature`. It must match the exception type and message; the stack depth may differ.

### Output
`minimal_input`, `minimal_repro`.

### Quality Gate
- The signature line from the minimal run matches the original signature (`grep -F` succeeds).
- Size before and after are both recorded as numbers produced by `wc -c` or `wc -l`.

---

## Worked Example

Illustrative only. Input: a 4,812-line YAML config that crashes a Node service with `TypeError: Cannot read properties of undefined (reading 'port')`.

- Phase 1: units = top-level keys and list items after `yq -o=json . config.yaml | jq .` reformatting. `interesting.sh` exits 0 on the original, 1 on `/dev/null`.
- Phase 2: ddmin with n = 2: keeping the second half alone is interesting; repeated halving reaches 9 lines. Single-unit removal check: each of the 9 lines removed gives exit 0 or exit 2.
- Phase 3: minimal config is a `services:` list with one entry using `listen: { host: "::" }` and no `port` key. Steps reduced from 5 to 1 (`node dist/main.js --config min.yaml`). `wc -l` 4812 to 9. Signature line matches.

---

## Exit Criteria

DONE when `minimal_input` is 1-minimal under the exit-1 predicate and `minimal_repro` reproduces the same error signature on every confirmation run.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Empty input is interesting | **Return**: the minimal input is empty; record that and skip Phase 2. |
| Phase 2 | Reduction converges to a syntax error | **Stop**: the predicate is accepting exit 2; fix it to require exit 1 and restart from `input.orig`. |
| Phase 2 | Each predicate run is slow | **Adjust**: run Phase 2 on a coarser unit first (top-level blocks), then refine; do not lower `confirm_runs` in the predicate below one run. |
| Phase 3 | Signature changed during reduction (different exception) | **Retry**: return to the last `step-<k>.txt` with the original signature and tighten `grep -F` to the full message. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
