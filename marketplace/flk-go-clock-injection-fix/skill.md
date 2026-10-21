# Go Clock Injection Fix

**One-line description:** Removes wall-clock and local-zone dependence from a flaky Go test, since Go has no global time mocking, by injecting a clock function or interface (or running the test inside a `testing/synctest` bubble on Go 1.25+), using explicit `*time.Location` values, and bundling zone data with `time/tzdata`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Matrix findings and suspect lines.
- `flake_class` (string, required): Must be `clock_timezone`.
- `baseline_command` (string, required): Reproduction, usually `TZ=<zone> go test ...`.
- `repo_path` (string, required): Module root.

---

## Outputs

- `go_time_fix_diff` (string): Unified diff with a note per hunk.

---

## Phase 1: Find Clock And Zone Reads

### Entry Criteria
- `flake_class` is `clock_timezone`. Otherwise return an empty diff.

### Actions
1. Grep: `grep -n -E "time\.Now\(\)|time\.Since\(|time\.Until\(|time\.Local|\.Local\(\)|time\.After\(|time\.NewTimer|time\.Tick|time\.Sleep|time\.ParseInLocation|time\.LoadLocation" <pkg>/*.go`
2. Classify:

| Read | Problem |
|---|---|
| `time.Now()` then `.Format`, `.Day()`, `.Hour()` | Uses `time.Local`, which is set from `TZ` once at program start |
| `t.Setenv("TZ", ...)` in a test | Does not change `time.Local` after startup; the test is not testing what it claims |
| `time.Now()` compared with an expected value built by `time.Now()` | Races across a boundary |
| `time.LoadLocation` on a machine without zoneinfo | Error `unknown time zone` on Windows or scratch containers |
| `time.Sleep` / `time.After` in code under test | Real waiting in tests |

3. Record the Go version from `go.mod`.

### Output
Read list with intended zone.

### Quality Gate
- Each read has file:line and intended zone.

---

## Phase 2: Inject The Clock

### Entry Criteria
- List exists.

### Actions
1. Choose by Go version and need:

| Situation | Approach |
|---|---|
| Code only reads the current time | Add a field `now func() time.Time` defaulting to `time.Now`; test sets `now: func() time.Time { return fixed }` |
| Code reads time and uses timers or tickers, Go 1.25+ | Wrap the test body in `synctest.Test(t, func(t *testing.T) { ... })` from `testing/synctest`; inside the bubble time is fake and advances only when all goroutines in the bubble are blocked. `synctest.Wait()` waits for them to block. On Go 1.24, the API was experimental under `GOEXPERIMENT=synctest` with `synctest.Run`; check the docs for your version |
| Timers on older Go | Inject a clock interface; if the repo already depends on `github.com/jonboulle/clockwork` or `k8s.io/utils/clock/testing`, use its fake clock (`Advance`) rather than writing a new one |

2. For zones: replace `.Local()` and implicit local formatting with `t.In(loc)` where `loc` is passed in or loaded once with `time.LoadLocation("America/New_York")`. For UTC intent use `.UTC()`.
3. If the binary or test may run where zoneinfo is missing, add `import _ "time/tzdata"` in the main package or build with `-tags timetzdata`. This embeds the zone database (adds size to the binary; note it).
4. Do NOT set `time.Local = ...` in tests: it is a package global and leaks into other tests.

### Output
Product injection points.

### Quality Gate
- `go build ./...` and `go vet ./<pkg>` exit 0.

---

## Phase 3: Rewrite The Test On A Fixed Instant

### Entry Criteria
- Injection in place.

### Actions
1. Use a literal instant at the boundary the matrix found: `fixed := time.Date(2026, 10, 20, 23, 59, 30, 0, time.UTC)`.
2. Build expected values from `fixed`, never from `time.Now()`.
3. For zone behavior, load the zone in the test: `loc, err := time.LoadLocation("Pacific/Kiritimati"); require.NoError(t, err)` (or `if err != nil { t.Fatal(err) }`) and pass it in.
4. Run in every failing matrix zone to show the test no longer depends on the process zone: `TZ=Pacific/Kiritimati go test ./<pkg> -run '^<Test>$' -count=1`.
5. `git -C <repo_path> diff > flk-go-time.diff`; copy into `go_time_fix_diff`; delete it.

### Output
`go_time_fix_diff`.

### Quality Gate
- The test passes in every failing matrix zone with `-count=1`.
- `gofmt -l` on changed files prints nothing.

---

## Worked Example

Illustrative. `TestDailyCutoff` in `./internal/reports`, product `IsPastCutoff()` uses `time.Now().Hour() >= 17`.

- Phase 1: local-zone read at `cutoff.go:12`; intended zone is the store's zone `America/Chicago` per the function comment.
- Phase 2: `type Cutoff struct { now func() time.Time; loc *time.Location }`; `IsPastCutoff` uses `c.now().In(c.loc).Hour()`.
- Phase 3: test uses `time.Date(2026, 10, 20, 22, 0, 0, 0, time.UTC)` (17:00 in Chicago during CDT) and `time.LoadLocation("America/Chicago")`. `TZ=Pacific/Kiritimati` and `TZ=UTC` runs print `ok`.

---

## Exit Criteria

DONE when product code reads time through an injected clock or a synctest bubble, zones are explicit locations, and the test passes in every previously failing zone.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 2 | `unknown time zone` on CI | **Adjust**: add `time/tzdata` import or install tzdata in the image. |
| Phase 2 | synctest unavailable (Go older than 1.24) | **Adjust**: use clock injection. |
| Phase 3 | synctest test deadlocks (`deadlock: main bubble goroutine has exited but blocked goroutines remain` or similar) | **Adjust**: a goroutine in the bubble waits on something outside it (real network, a channel from outside); stub it inside the bubble. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
