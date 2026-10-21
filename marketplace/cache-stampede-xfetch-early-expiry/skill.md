# Cache Stampede XFetch Early Expiry

**One-line description:** Implements probabilistic early recomputation (the XFetch algorithm from Vattani, Chierichetti and Lowenstein, "Optimal Probabilistic Cache Stampede Prevention", VLDB 2015) by storing the recompute duration and logical expiry with each value, so one request refreshes a hot key shortly before it expires without any lock.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Path to the repository.
- `ttl_table` (object[], required): TTLs from `cache-ttl-from-change-rate`.
- `stampede_plan` (object[], required): Rows from `cache-stampede-risk-assess` that include `early_expiry`.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `early_expiry_change` (object): Files changed, the stored envelope format, beta value and its source, the test results (deterministic and statistical), and the forced-expiry database call counts before and after.

---

## Phase 1: Define the Envelope and Formula

### Entry Criteria
- `stampede_plan` row includes `early_expiry`.

### Actions
1. Store each value in an envelope: `{"v": <value>, "delta": <recompute seconds>, "exp": <logical expiry, unix seconds>}`. `delta` is measured each time the value is computed (wall time from start of load to just before the set). `exp = now + TTL`.
2. Set the backend TTL equal to the logical TTL, or slightly longer if you also want stale serving; never shorter, or the key disappears before early recompute can happen.
3. The read rule from the paper:
   `recompute if now - delta * beta * ln(rand()) >= exp`, where `rand()` is uniform in (0, 1].
   Because `ln(rand())` is negative or zero, `-delta * beta * ln(rand())` is a non-negative random head start. Hotter keys get more reads near expiry, so some read almost surely triggers a refresh just before `exp`.
4. `beta = 1` is the value the paper recommends as default. Values above 1 refresh earlier, below 1 later. Use 1 unless the user supplies another value; record the source.
5. Guard `rand()` against 0: `ln(0)` is negative infinity. Python `random.random()` returns [0, 1), so use `1 - random.random()`. JavaScript `Math.random()` is [0, 1), same fix. Go `rand.Float64()` is [0, 1), same fix.

### Output
Envelope format and formula with beta and its source.

### Quality Gate
- The envelope has all three fields, and the formula text matches the paper's form.
- The `rand()` source cannot return 0 (the `1 - x` form is in the code).

---

## Phase 2: Implement

### Entry Criteria
- Envelope defined.

### Actions
1. Read path, in the cache module only:

   ```python
   def get_xfetch(key, load, ttl, beta=1.0):
       env = cache_get_json(key)                       # None on miss
       now = time.time()
       if env is None or now - env["delta"] * beta * math.log(1.0 - random.random()) >= env["exp"]:
           start = time.monotonic()
           value = load()
           delta = time.monotonic() - start
           cache_set_json(key, {"v": value, "delta": delta, "exp": now + ttl}, ex=ttl)
           return value
       return env["v"]
   ```
   Node and Go: same structure with `Math.log(1 - Math.random())` and `math.Log(1 - rand.Float64())`. Java: `Math.log(1 - ThreadLocalRandom.current().nextDouble())`.
2. Measure `delta` with a monotonic clock (`time.monotonic()`, `performance.now()`, `time.Since` in Go, `System.nanoTime()` in Java). Use wall clock only for `exp`, which must be comparable across processes.
3. Inject the random source and the clock as parameters so tests can control them.
4. Combine with coalescing: if two requests in one process both decide to refresh, coalescing collapses them to one.

### Output
XFetch read path.

### Quality Gate
- Unit tests pass for: rand fixed near 1 (head start near 0) does not refresh before `exp`; rand fixed near 0 (large head start) refreshes early; a miss always loads.
- `git diff --stat` shows only the cache module and its tests.

---

## Phase 3: Verify Under Load

### Entry Criteria
- Unit tests pass.

### Actions
1. Statistical test: with a fake clock, simulate R reads per second for one key over its last 3 x delta seconds before `exp`, repeat 1,000 times, and record how many runs refreshed before `exp` and how many had more than one refresh. This checks the implementation, not the paper.
2. Staging: under steady load, watch the miss-path counter (or `pg_stat_statements.calls` for the query) over several TTL periods. Expected: about one recompute per TTL period and no burst at expiry. Compare with the forced-expiry count recorded in `stampede_plan`.
3. Run the full suite.

### Output
`early_expiry_change`.

### Quality Gate
- Statistical test results are recorded (runs with early refresh, runs with multiple refreshes).
- Staging recompute count per TTL period is recorded and compared with the before number.

---

## Worked Example

Illustrative. Category counts, TTL 60 s, delta about 0.45 s, r = 120 per second, beta = 1 (paper default).

Phase 1: envelope `{"v": {...}, "delta": 0.452, "exp": 1760000060}`.

Phase 2: unit tests with injected rand 0.999999 (head start 0.45 x 1e-6 s) do not refresh at `exp - 1`; rand 1e-9 (head start 0.45 x 20.7 = 9.3 s) refreshes at `exp - 5`.

Phase 3: simulation, 1,000 runs: 1,000 refreshed before `exp`, 3 had two refreshes. Staging over 10 TTL periods: 10 recomputes, versus 51 at a single forced expiry before.

---

## Exit Criteria

DONE when hot keys refresh probabilistically before expiry using measured delta and a sourced beta, tests pass, and staging shows no recompute burst at expiry.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Old cached values lack `delta` and `exp` | **Adjust**: bump the key schema version so old values are never read. |
| Phase 2 | `ValueError: math domain error` | **Adjust**: `log(0)` was called; use `1 - random()`. |
| Phase 3 | Many refreshes per period | **Adjust**: check that `exp` is set once at compute time, not refreshed on read; check beta. |
| Phase 3 | Key expires with no early refresh | **Adjust**: backend TTL is shorter than logical TTL; make them equal. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
