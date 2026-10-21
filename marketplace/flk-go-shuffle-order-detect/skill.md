# Go Shuffle Order Detection

**One-line description:** Detects Go test order dependence with `go test -shuffle=on`, replays the printed seed with `-shuffle=<seed>`, and narrows the polluting test with anchored `-run` alternations until a two-test reproduction remains.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): Supplies package, test name and CI command.
- `go_flake_rate_report` (object, required): From `flk-go-count-measure`.
- `repeat_count` (integer, required): Number of shuffled runs.
- `repo_path` (string, required): Module root.

---

## Outputs

- `go_order_report` (object): `{order_dependent, failing_seeds[], polluter_test, two_test_repro_command, mechanism_hint, cross_package_suspected}`.

---

## Phase 1: Shuffle Runs

### Entry Criteria
- `go version` is 1.17 or newer (`-shuffle` was added in Go 1.17).

### Actions
1. Shuffle orders tests and benchmarks within one package binary. It does not reorder packages and does not reorder subtests.
2. Loop:
   `for i in $(seq 1 <repeat_count>); do go test ./internal/billing -count=1 -shuffle=on -v > flk-shuf-$i.log 2>&1 || echo "FAIL $i"; done`
3. For each failing run, read the seed from the first line: `-test.shuffle 1718034411921457000`. Record it.
4. Replay: `go test ./internal/billing -count=1 -shuffle=1718034411921457000 -v`. It must fail again.
5. If no in-package order fails but `go_flake_rate_report` showed CI-selection failures, set `cross_package_suspected`. Packages run as separate processes, in parallel up to `-p` (default GOMAXPROCS). They share only external state: databases, files, ports, env set by the CI script. Test it with `go test ./... -p 1 -count=1` repeated: if failures vanish with `-p 1`, packages collide on an external resource; go to `flk-go-test-isolation-fix`.

### Output
Failing seeds.

### Quality Gate
- A failing seed replays to a failure, or `order_dependent: false` is recorded with the number of shuffled runs.

---

## Phase 2: Narrow The Polluter

### Entry Criteria
- A replaying seed exists.

### Actions
1. From the replay's `-v` output, list the `=== RUN` lines before the victim. Those top-level tests are candidates.
2. `-run` with an alternation keeps their shuffled relative order only if the seed and the set are the same; the set changes the permutation. So drop `-shuffle` and force order by the source order instead: Go runs tests in source order (file names sorted, then declaration order) when not shuffling.
3. Run each candidate with the victim: `go test ./internal/billing -count=1 -run '^(TestCandidate|TestInvoiceRounding)$' -v`. When the candidate is declared before the victim in source order, this is candidate-first. If it is declared after, the pair cannot be forced into candidate-first order this way; instead create a temporary, uncommitted test in the package that calls both bodies in order, or bisect with `-shuffle` seeds and the two-name `-run` until a seed puts the candidate first.
4. When candidates are many, halve: run `-run '^(A|B|C|...|TestInvoiceRounding)$'` with half the candidates and the replaying approach above, keep the half that fails.
5. Confirm: candidate plus victim fails; victim alone with `-count=1` passes repeatedly.

### Output
`polluter_test`, `two_test_repro_command`.

### Quality Gate
- The two-test command and its failing output are recorded, and a victim-alone run passes.

---

## Phase 3: Characterize

### Entry Criteria
- Polluter confirmed.

### Actions
1. Read the polluter and set `mechanism_hint`:

| Seen in polluter | Mechanism |
|---|---|
| Assigns a package-level `var` (config, client, `http.DefaultClient`, `time.Local`) | leaked package global |
| `os.Setenv` instead of `t.Setenv` | leaked env |
| `os.Chdir` instead of `t.Chdir` (Go 1.24) | leaked working directory |
| `sync.Once` initialized with test-specific values | one-shot init captured by first test |
| `flag.Set` | leaked flag |
| Writes under a fixed path instead of `t.TempDir()` | leaked file |
| Registers handlers on `http.DefaultServeMux` | duplicate registration panic or leaked route |
| Starts a goroutine with no stop | background goroutine mutates shared state later |

2. Do NOT fix by renaming tests to change source order or by setting `-shuffle=off` in CI.
3. Delete `flk-shuf-*.log` and any temporary test file.

### Output
`go_order_report`.

### Quality Gate
- `git -C <repo_path> status --porcelain` is empty after cleanup.

---

## Worked Example

Illustrative. `./internal/billing`, victim `TestInvoiceRounding`, `repeat_count` = 299.

- Phase 1: runs 12, 140 and 251 fail. Run 140 starts with `-test.shuffle 1718034411921457000`; replay fails with `invoice_test.go:88: total = 1999, want 2000`.
- Phase 2: candidates before the victim: `TestTaxTable`, `TestCurrencyEUR`, `TestLedgerExport`. `go test ./internal/billing -count=1 -run '^(TestCurrencyEUR|TestInvoiceRounding)$' -v` fails (`TestCurrencyEUR` is declared first in `currency_test.go`, which sorts before `invoice_test.go`).
- Phase 3: `TestCurrencyEUR` sets the package var `defaultRounding = roundDown` and never restores it: leaked package global.

---

## Exit Criteria

DONE when `go_order_report` names a confirmed polluter with a reproduction, or states `order_dependent: false` with the run count, plus the `-p 1` result when cross-package is suspected.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flag provided but not defined: -shuffle` | **Stop**: Go is older than 1.17; upgrade the toolchain or use the source-order pair method only. |
| Phase 1 | Seed does not replay | **Adjust**: failure is not order-only; pass the seed to the classifier as weak evidence. |
| Phase 2 | Pair never fails | **Adjust**: pollution needs two tests; test triples from the failing half. |
| Phase 3 | Polluter is in another package | **Return**: to `flk-go-test-isolation-fix` with `cross_package_suspected` set. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
