# TDD Time Boundary

**One-line description:** Makes code that reads the current time or waits on timers testable by injecting a clock or using the stack's fake-timer tool, then test-drives expiry, scheduling and time zone behaviors without real sleeps.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `double_plan` (object[], required): From `tdd-test-double-choice`; the rows with role clock and the `boundaries` list.
- `stack` (string, required): `python`, `node`, `go`, `rust` or `java`.

---

## Outputs

- `time_tests` (object): The clock seam added (file, signature), the tests written (names), and the run output showing them pass with no real waiting.

---

## Phase 1: Find Every Time Read

### Entry Criteria
- `double_plan.boundaries` contains `time`, or a clock collaborator is listed.

### Actions
1. Search the unit under test for direct time reads and waits:

| stack | Search pattern |
|---|---|
| python | `datetime.now`, `datetime.utcnow`, `date.today`, `time.time`, `time.monotonic`, `time.sleep`, `asyncio.sleep` |
| node | `Date.now`, `new Date()`, `performance.now`, `setTimeout`, `setInterval` |
| go | `time.Now`, `time.Since`, `time.Sleep`, `time.After`, `time.NewTimer`, `time.NewTicker` |
| rust | `SystemTime::now`, `Instant::now`, `chrono::Utc::now`, `thread::sleep`, `tokio::time::sleep` |
| java | `Instant.now()`, `LocalDate.now()`, `LocalDateTime.now()`, `System.currentTimeMillis`, `Thread.sleep` |

2. List each hit with file and line. Each one is a place a test cannot control.

### Output
List of time reads.

### Quality Gate
- The search was run over the unit's files and the hit list (or "none") is recorded.

---

## Phase 2: Add the Seam

### Entry Criteria
- At least one time read found.

### Actions
1. Choose the seam with this table. Injection is the default; fake-timer tools are for code that schedules callbacks.

| stack | Reads "now" | Schedules or waits |
|---|---|---|
| python | add a parameter `now: Callable[[], datetime] = lambda: datetime.now(timezone.utc)`; tests pass `lambda: FIXED` | `time-machine`: `with time_machine.travel(datetime(2024, 1, 1, tzinfo=timezone.utc), tick=False):` (or `freezegun`'s `@freeze_time("2024-01-01")`) |
| node | add a parameter `now: () => Date = () => new Date()` | Jest `jest.useFakeTimers(); jest.setSystemTime(new Date('2024-01-01T00:00:00Z')); jest.advanceTimersByTime(ms)`; Vitest same with `vi.` prefix; restore with `useRealTimers()` in `afterEach` |
| go | add a field `now func() time.Time` defaulting to `time.Now` | Go 1.25+: `testing/synctest`, `synctest.Test(t, func(t *testing.T) { ... })` runs goroutines on a fake clock (Go 1.24 had it behind `GOEXPERIMENT=synctest`); otherwise inject a timer interface |
| rust | a `trait Clock { fn now(&self) -> SystemTime; }` with a real impl and a fixed impl | tokio: `#[tokio::test(start_paused = true)]` and `tokio::time::advance(Duration)`; needs tokio feature `test-util` in `[dev-dependencies]` |
| java | constructor parameter `java.time.Clock`; production passes `Clock.systemUTC()` | tests pass `Clock.fixed(Instant.parse("2024-01-01T00:00:00Z"), ZoneOffset.UTC)`; move time with `Clock.offset(base, Duration.ofMinutes(5))` |

2. Change ONE time read per step. After each change run the full suite; it must stay green before the next change (this is a refactor under green).
3. Always use timezone-aware values in tests (`timezone.utc`, `Z` suffix, `ZoneOffset.UTC`). A naive local time makes the test pass on one machine and fail on another.

### Output
Seam in place, suite still green.

### Quality Gate
- The Phase 1 search, rerun on the unit (excluding the default value of the seam), returns no direct time reads.
- Full suite exit code 0 after the seam change.

---

## Phase 3: Drive Time Behaviors

### Entry Criteria
- Seam in place.

### Actions
1. Write one failing test at a time (use `tdd-red-one-failing-test` rules) for each applicable case:

| Case | Example |
|---|---|
| Exactly at the boundary | token issued 10:00 with 15 min life is valid at 10:15:00 or not, per the requirement |
| One unit past it | invalid at 10:15:01 |
| Clock moves during the operation | advance fake clock between two calls |
| Date rollover, month end, leap day | 2024-02-29 |
| Daylight saving change (only if the requirement uses local time) | a zone such as `America/New_York` on its DST transition date |
| Timer callback fires | advance by the delay and assert the callback ran once |

2. Never call real `sleep` in a test to wait for time to pass. If a test needs more than the fake clock, the seam is incomplete.
3. Boundary values (15 minutes and so on) come from the requirement. If the requirement does not state whether the boundary instant is inclusive, record it as an open question instead of choosing.

### Output
`time_tests`.

### Quality Gate
- Searching the new test files for `sleep(` returns nothing.
- The time tests pass and the run's reported duration does not include the scheduled delays (for example a 15-minute expiry test finishes in under a few seconds).

---

## Worked Example

Illustrative only. `stack` = `java`. `TokenService.isValid(token)` calls `Instant.now()`.

Phase 1: one hit, `TokenService.java:31`.
Phase 2: constructor gains `Clock clock`; line 31 becomes `Instant.now(clock)`; `./gradlew test` stays green.
Phase 3:

```java
@Test
void tokenIsRejectedOneSecondAfterExpiry() {
    Instant issued = Instant.parse("2024-01-01T10:00:00Z");
    Clock clock = Clock.fixed(issued.plus(Duration.ofMinutes(15)).plusSeconds(1), ZoneOffset.UTC);
    TokenService svc = new TokenService(clock);
    assertFalse(svc.isValid(new Token(issued, Duration.ofMinutes(15))));
}
```

Run: `./gradlew test --tests 'com.example.TokenServiceTest'` reports the test FAILED (returns true), then passes after the expiry check is added.

---

## Exit Criteria

DONE when the unit reads time only through a seam, and boundary, rollover and timer behaviors are covered by tests that never sleep.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Fake timers make a promise-based test hang (Jest/Vitest) | **Adjust**: use `advanceTimersByTimeAsync` / `runAllTimersAsync` so pending promises resolve. |
| Phase 2 | `time-machine` or `freezegun` not allowed as a dependency | **Adjust**: use the injected `now` parameter only. |
| Phase 2 | Suite turns red after adding the seam | **Retry**: revert the change (`git restore <file>`) and make a smaller one. |
| Phase 3 | Test passes only in one time zone | **Stop**: find the naive local time and make it explicit UTC or an explicit zone. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
