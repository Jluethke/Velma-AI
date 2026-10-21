# CI Test Sharding by Recorded Timing

**One-line description:** Splits the verified parallel command across GitHub Actions matrix jobs using recorded durations (pytest-split `--store-durations` with `--splits/--group`, Jest or Vitest `--shard=i/n`, a greedy longest-first package split for Go built from `go test -json` timings), sets `fail-fast: false`, and merges per-shard coverage so totals stay comparable.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `ci_config_path` (string, required): GitHub Actions workflow running the tests.
- `stack` (string, required): `python`, `node` or `go`.
- `parallel_command` (string, required): From `tsp-order-isolation-check`.
- `shard_count` (integer, required): Number of matrix jobs. Supplied by the user from runner budget and queue limits.

---

## Outputs

- `shard_config` (object): Shard tool and timing file, matrix YAML, per-shard command, per-shard wall times from a real run, the slowest-shard to fastest-shard gap, and the coverage merge command and merged totals.

---

## Phase 1: Record Timings for the Splitter

### Entry Criteria
- `parallel_command` passes locally; `shard_count` is an integer of 2 or more.

### Actions
1. Produce the timing data:

| `stack` | Tool | Command | File |
|---|---|---|---|
| python | `pytest-split` | `pytest --store-durations` (full suite, serial or parallel) | `.test_durations` (commit it, per pytest-split docs) |
| node (Jest 28+) | built-in `--shard` | none; Jest shards by test path hash, not timing (check docs for your version) | none |
| node (Vitest) | built-in `--shard` | none; Vitest shards by file | none |
| go | `go test -json` | `go test -count=1 -json ./... > go-test.json` | `go-test.json` |

2. Go split, greedy longest-first: from `go-test.json` get package `Elapsed` (`jq -r 'select(.Action=="pass" and .Test==null) | [.Elapsed, .Package] | @tsv'`), sort descending, assign each package to the shard with the smallest running total. Write `shards/shard-<i>.txt` with one package per line. Commit the files and a script-free note in the README on how to regenerate them.
3. For Jest, if one file dominates, a hash split can leave one shard much longer than others; record per-shard times in Phase 3 and, if the gap is large, split that file (by `describe` groups into separate files) rather than adding shards.

### Output
Timing file or shard lists.

### Quality Gate
- python: `.test_durations` exists and `python -c "import json; print(len(json.load(open('.test_durations'))))"` equals the collected test count.
- go: every package from `go list ./...` that has tests appears in exactly one shard file (`cat shards/*.txt | sort | uniq -d` prints nothing).

---

## Phase 2: Write the Matrix

### Entry Criteria
- Timing data ready.

### Actions
1. In `ci_config_path`, on the test job:
   `strategy:`
   `  fail-fast: false`
   `  matrix:`
   `    shard: [1, 2, ..., <shard_count>]`
   `fail-fast: false` keeps other shards running so one failure does not hide others.
2. Per-shard command, using `${{ matrix.shard }}` and `${{ strategy.job-total }}`:

| `stack` | Command |
|---|---|
| python | `<parallel_command> --splits ${{ strategy.job-total }} --group ${{ matrix.shard }}` (`--splitting-algorithm least_duration` is available; check `pytest --help` for the installed version) |
| node (Jest) | `<parallel_command> --shard=${{ matrix.shard }}/${{ strategy.job-total }}` |
| node (Vitest) | `<parallel_command> --shard=${{ matrix.shard }}/${{ strategy.job-total }}` |
| go | `go test <flags from parallel_command> $(cat shards/shard-${{ matrix.shard }}.txt)` |

3. Coverage per shard: python write `COVERAGE_FILE=.coverage.shard${{ matrix.shard }}` and upload with `actions/upload-artifact@v4` (unique `name` per shard); Jest `--coverage --coverageReporters=json` and upload `coverage/coverage-final.json`; Vitest `--reporter=blob` uploads `.vitest-reports/*` for `vitest --merge-reports`; Go `-coverprofile=cover-${{ matrix.shard }}.out`.
4. Add a `merge` job with `needs: test` that downloads all artifacts and merges: python `coverage combine` then `coverage report`; Jest `npx nyc merge <dir> merged.json` then `npx nyc report -t <dir> --reporter=text-summary` (or `istanbul-merge`); Vitest `npx vitest --merge-reports --coverage`; Go `gocovmerge cover-*.out > merged.out` (`go install github.com/wadey/gocovmerge@latest`) then `go tool cover -func=merged.out | tail -1`.
5. Edit only `ci_config_path` (and commit `.test_durations` or `shards/`). Do NOT push; the user pushes.

### Output
Matrix and merge job.

### Quality Gate
- `actionlint <ci_config_path>` prints nothing, if installed.
- The merge job lists exactly `shard_count` artifacts to download.

---

## Phase 3: Verify Balance and Totals

### Entry Criteria
- Branch run completed (pushed by the user).

### Actions
1. Read per-shard durations: `gh run view <run-id> --json jobs --jq '.jobs[] | [.name, .startedAt, .completedAt] | @tsv'`.
2. Compute slowest shard minus fastest shard. Record it; no fixed tolerance applies. If the slowest shard is a single file or package, splitting that unit is the only fix that helps.
3. Confirm every test ran once: sum per-shard test counts (pytest summary lines, Jest `Tests:` lines, Go pass events) and compare with the baseline count.
4. Confirm merged coverage covered lines equal the unsharded coverage at the same commit.
5. Refresh timings when tests change: rerun `pytest --store-durations` or regenerate Go shard files and commit; stale timings unbalance shards but never drop tests (pytest-split assigns unknown tests by average duration).

### Output
`shard_config`.

### Quality Gate
- Sum of per-shard test counts equals the baseline test count.
- Merged covered lines equal unsharded covered lines.

---

## Worked Example

Illustrative. `stack=python`, `parallel_command=pytest -n 4 --dist loadfile`, `shard_count=3`.

- Phase 1: `pytest --store-durations` writes `.test_durations` with 412 entries.
- Phase 2: shards run `pytest -n 4 --dist loadfile --splits 3 --group <i>`; each writes `.coverage.shard<i>`; merge job runs `coverage combine` and `coverage report`.
- Phase 3: shard times 2m10s, 2m18s, 2m04s (gap 14 s). Test counts 137 + 139 + 136 = 412. Merged `TOTAL 6120 712` matches unsharded.

---

## Exit Criteria

DONE when the matrix runs `shard_count` shards with `fail-fast: false`, every test runs exactly once, merged coverage equals unsharded coverage, and per-shard times are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--shard` rejected by Jest | **Adjust**: Jest added `--shard` in 28; upgrade or split by `--testPathPattern` lists per shard. |
| Phase 2 | Artifacts collide on name | **Retry**: include `${{ matrix.shard }}` in every artifact `name` (upload-artifact v4 requires unique names). |
| Phase 3 | Sum of test counts below baseline | **Stop**: a shard dropped tests; check pytest-split group math and Go shard files for missing packages. |
| Phase 3 | Merged coverage below unsharded | **Return**: a shard's coverage file was not uploaded or the merge path is wrong; fix before trusting the shard config. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
