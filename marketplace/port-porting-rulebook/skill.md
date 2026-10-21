# Port Porting Rulebook

**One-line description:** Merges every audit, mapping and idiom table into one numbered `PORTING_RULES.md` in the target repository (rule ids, source form, target form, golden record ids that prove each rule, the exact build, lint and replay commands, and the forbidden shortcuts with their grep checks), so whoever ports a module reads one file instead of eight.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_repo` (string, required): Path to the target project.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).
- `integer_findings` (object[], required): Output of `port-integer-semantics-audit`.
- `float_findings` (object[], required): Output of `port-float-format-rounding-audit`.
- `unicode_findings` (object[], required): Output of `port-string-unicode-audit`.
- `error_mapping` (object, required): Output of `port-error-model-mapping`.
- `concurrency_mapping` (object, required): Output of `port-concurrency-model-mapping`.
- `dependency_map` (object[], required): Output of `port-dependency-equivalence-map`.
- `py_ts_idioms` (object, optional): Output of `port-py-to-ts-idiom-map` when `stack` is `py-ts`.
- `py_go_idioms` (object, optional): Output of `port-py-to-go-idiom-map` when `stack` is `py-go`.
- `ts_migration_plan` (object, optional): Output of `port-js-to-ts-incremental-migration` when `stack` is `js-ts`.
- `kotlin_conversion_plan` (object, optional): Output of `port-java-to-kotlin-conversion` when `stack` is `java-kotlin`.
- `c_rust_idioms` (object, optional): Output of `port-c-to-rust-idiom-map` when `stack` is `c-rust`.
- `ffi_build_plan` (object, optional): Output of `port-c-rust-ffi-strangler` when `stack` is `c-rust`.
- `ts_replay_command` (object, optional): Output of `port-ts-golden-replay`.
- `go_replay_command` (object, optional): Output of `port-go-golden-replay`.
- `kotlin_replay_command` (object, optional): Output of `port-kotlin-golden-replay`.
- `rust_replay_command` (object, optional): Output of `port-rust-golden-replay`.

---

## Outputs

- `porting_rulebook` (object): Path to `PORTING_RULES.md` in `target_repo`, the rule count by section, the `check_sequence` (ordered commands to run after each ported unit), and `forbidden_checks` (grep commands with expected output).

---

## Phase 1: Select Inputs for the Stack

### Entry Criteria
- `stack` is set and the required inputs exist.

### Actions
1. Confirm the stack-specific inputs are present, using this table. A missing required-for-stack input stops the flow.

| `stack` | Idiom input | Plan input | Replay input |
|---|---|---|---|
| `py-ts` | `py_ts_idioms` | none | `ts_replay_command` |
| `py-go` | `py_go_idioms` | none | `go_replay_command` |
| `js-ts` | none | `ts_migration_plan` | `ts_replay_command` |
| `java-kotlin` | none | `kotlin_conversion_plan` | `kotlin_replay_command` |
| `c-rust` | `c_rust_idioms` | `ffi_build_plan` | `rust_replay_command` |

2. Ignore inputs for other stacks even if present.

### Output
The input set for this stack.

### Quality Gate
- Every input the table requires for `stack` is present.

---

## Phase 2: Write the Rules

### Entry Criteria
- Input set complete.

### Actions
1. Create `PORTING_RULES.md` with these sections, in this order. Each rule gets an id; ids never change once written (new rules are appended).
   1. `R-INT-nn` from `integer_findings`: source location, source semantics, target construct, boundary record ids.
   2. `R-FLT-nn` from `float_findings`: source call, target call or helper, records that differ without it.
   3. `R-STR-nn` from `unicode_findings`.
   4. `R-ERR-nn` from `error_mapping`: category, target construct, exit codes, silent-failure traps for this stack.
   5. `R-CON-nn` from `concurrency_mapping`, including every `accidental_safety` guard.
   6. `R-DEP-nn` from `dependency_map`: source dependency, target dependency, behavior differences.
   7. `R-IDM-nn` from the idiom or plan input: each rule row.
   8. Commands: copy exactly from the replay input and the idiom or plan input's checks.
2. Link each rule to proof: list golden record ids whose `tags` include the finding id (`jq -r 'select(.tags[] | test("audit:I-001")) | .id' golden/B-*.jsonl`). A rule with no record says "no record: <reason>" and is listed in an "Unproven rules" section.
3. Write `check_sequence`, the commands run after every ported unit, in this order (fast to slow, stop at first failure):

| Stack | Sequence |
|---|---|
| `py-ts`, `js-ts` | `npx tsc --noEmit -p .`; `npx eslint <changed files>`; replay `one_behavior` for the unit's behaviors; `npm test`; replay `checksum` |
| `py-go` | `gofmt -l .` (must print nothing); `go vet ./...`; `staticcheck ./...`; replay `one_behavior`; `go test ./... -race -count=1`; replay `checksum` |
| `java-kotlin` | `./gradlew compileKotlin compileJava`; replay one behavior; `./gradlew test`; checksum test |
| `c-rust` | `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; replay `debug` and `release` with `GOLDEN_ONLY`; `cargo test`; C project tests through the FFI build; checksum test |

4. Write `forbidden_checks`; each is run before every commit and must print nothing (or a count that does not grow):

| Shortcut | Check |
|---|---|
| Editing the golden corpus | `git diff --name-only HEAD -- <golden dir>` prints nothing |
| Skipping or disabling tests | `git diff HEAD -U0 | rg "^\+.*(\.skip\(|\.only\(|t\.Skip\(|@Disabled|#\[ignore\]|xit\(|test\.todo)"` prints nothing |
| Silencing the type checker | TS: `git diff HEAD -U0 | rg "^\+.*(@ts-ignore|@ts-nocheck|as any)"`; Kotlin: `git diff HEAD -U0 | rg "^\+.*(@Suppress|!!)"` without a `reason:` comment; Rust: `git diff HEAD -U0 | rg "^\+.*(unsafe|\.unwrap\(\)|#\[allow)"` outside the FFI module; Go: `git diff HEAD -U0 | rg "^\+.*_ = .*err"` |
| Loosening the comparator | `git diff --name-only HEAD -- <harness dir>` prints nothing in a porting commit |
| Porting more than one unit per commit | `git diff --name-only HEAD` lists only the unit's files, its test files, and the registry |

### Output
`PORTING_RULES.md`.

### Quality Gate
- Every finding id from every input appears in exactly one rule (`rg -c "I-0|F-0|U-0|E-0" PORTING_RULES.md` compared with the input counts).
- Every command in `check_sequence` was run once on the current target tree and its exit status recorded (failures are expected before porting starts; "command not found" is not acceptable).

---

## Phase 3: Commit the Rulebook

### Entry Criteria
- File written.

### Actions
1. Commit `PORTING_RULES.md` alone: `git add PORTING_RULES.md && git commit -m "porting rules v1"`.
2. Set `porting_rulebook` to the path, counts per section, `check_sequence`, and `forbidden_checks`.

### Output
`porting_rulebook`.

### Quality Gate
- `git log -1 --name-only` lists only `PORTING_RULES.md`.

---

## Worked Example

Illustrative. `stack=py-go`. Inputs: 6 integer findings, 4 float, 5 string, 9 error rows, 1 concurrency guard, 7 dependencies, 18 idiom rules.

Excerpt of `PORTING_RULES.md`:
```
R-INT-01 (I-001) pager.py:2 `index // size`, negatives possible.
  Go: q := a / b; if (a%b != 0) && ((a < 0) != (b < 0)) { q-- }
  Proof: B-002/0011..0014 (sign combinations)
R-ERR-03 (E-003) load.py:7 KeyError 'port' -> category parse.
  Go trap: map/struct zero value. Decode into struct{Port *int}; nil -> ErrParse.
  Proof: B-006/0003
Unproven rules: R-DEP-05 (requests timeout): no record, network calls are not in the corpus.
```
Phase 2 command check:
```
$ gofmt -l . ; echo $?
0
$ go test ./internal/golden/ -run TestGolden -count=1 | tail -n 1
ok  	example.com/blog/internal/golden	0.214s   (all records skipped: nothing ported yet)
```

---

## Exit Criteria

DONE when one committed `PORTING_RULES.md` holds every finding as a numbered rule with proof records, the stack's check sequence runs, and every forbidden shortcut has a check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Required stack input missing | **Return**: run the producing flow for this stack first. |
| Phase 2 | Two inputs give conflicting target constructs for the same site | **Stop**: present both to the user; the rulebook holds one answer per site. |
| Phase 2 | A check command is not installed | **Adjust**: install it; do not remove it from the sequence. |
| Phase 3 | Rules change later | **Adjust**: append new ids and mark replaced ones "superseded by R-...", never renumber. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
