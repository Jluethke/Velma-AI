# Absolute Deadline Periodic Loop In C Or C++

**One-line description:** Rewrites a C or C++ periodic control loop to wake on absolute deadlines with `clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, ...)`, normalizes `timespec` arithmetic, handles EINTR correctly, and counts overruns, replacing relative sleeps that accumulate drift.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `app_source_dir` (string, required): C or C++ source tree with build and test commands.
- `loop_period_us` (integer, required): Loop period in microseconds.

---

## Outputs

- `loop_patch` (object): The loop file and function changed, the old sleep call and the new one, the overrun counter's name and how it is reported, build and test exit codes, and a measured period drift check over a stated number of iterations.

---

## Phase 1: Find The Current Timing

### Entry Criteria
- Build and tests pass before the change (exit codes recorded).

### Actions
1. Search: `grep -rn -E 'usleep|nanosleep|sleep_for|sleep_until|clock_nanosleep|timerfd|select\(|poll\(|epoll_wait' <app_source_dir>`.
2. Classify the loop's timing:

| Found | Problem |
|---|---|
| `usleep(period)` or `std::this_thread::sleep_for(period)` after the work | Relative: period = work time + sleep + wakeup latency; drifts every iteration |
| `sleep_until` with `std::chrono::steady_clock` | Absolute in intent; libstdc++ maps it to `clock_nanosleep` with `TIMER_ABSTIME` on Linux in recent versions but the behavior is library specific; check your standard library or replace |
| `clock_nanosleep(CLOCK_REALTIME, ...)` | Wall clock: NTP or manual time changes move wakeups |
| `timerfd` with `TFD_TIMER_ABSTIME` on `CLOCK_MONOTONIC` | Already absolute; keep and check overrun via the read count |
| Wakes on a device (CAN read) not a timer | Event driven, not periodic; this flow does not apply |

3. Record the loop function and the line.

### Output
Classification and location.

### Quality Gate
- The loop's sleep call is quoted with file and line, and a table row is cited.

---

## Phase 2: Rewrite The Loop

### Entry Criteria
- Classification is relative, CLOCK_REALTIME, or library-dependent `sleep_until`.

### Actions
1. Replace the loop skeleton with this pattern (C; same in C++):
   ```c
   #include <time.h>
   #include <errno.h>
   #define NSEC_PER_SEC 1000000000L
   static void ts_add_ns(struct timespec *t, long ns) {
       t->tv_nsec += ns;
       while (t->tv_nsec >= NSEC_PER_SEC) { t->tv_nsec -= NSEC_PER_SEC; t->tv_sec++; }
   }
   static int ts_before(const struct timespec *a, const struct timespec *b) {
       return a->tv_sec < b->tv_sec || (a->tv_sec == b->tv_sec && a->tv_nsec < b->tv_nsec);
   }

   struct timespec next, now;
   const long period_ns = PERIOD_US * 1000L;
   unsigned long overruns = 0;
   clock_gettime(CLOCK_MONOTONIC, &next);
   for (;;) {
       ts_add_ns(&next, period_ns);
       int rc;
       do { rc = clock_nanosleep(CLOCK_MONOTONIC, TIMER_ABSTIME, &next, NULL); } while (rc == EINTR);
       if (rc != 0) { /* rc is an error number, not -1 */ handle_error(rc); }
       control_step();
       clock_gettime(CLOCK_MONOTONIC, &now);
       struct timespec next_wake = next;
       ts_add_ns(&next_wake, period_ns);
       if (!ts_before(&now, &next_wake)) {   /* work ran past the next wakeup time */
           overruns++;
           /* apply the overrun policy chosen in step 2 */
       }
   }
   ```
   Key facts: `clock_nanosleep` returns the error number directly and does not set `errno`; with `TIMER_ABSTIME` the remaining-time argument is unused, so retrying on EINTR with the same `next` is correct.
2. Overrun policy is a user decision. Offer both and record the choice: (a) skip missed periods by advancing `next` until it is in the future, counting each skipped period; (b) run immediately to catch up. Do not choose silently. For a control loop that commands actuators, the user's safety design decides this; braking and emergency stop do not depend on this loop.
3. Use `CLOCK_MONOTONIC`, not `CLOCK_MONOTONIC_RAW` (not supported by `clock_nanosleep`) and not `CLOCK_REALTIME`.
4. Expose `overruns` to the existing status or log path through a non-allocating mechanism (atomic counter read by another thread).
5. Change only the loop function's file.

### Output
Patched loop.

### Quality Gate
- Build and full tests pass (exit 0). No test removed or weakened.
- `grep -n 'TIMER_ABSTIME' <loop file>` shows the new call and `grep -n -E 'usleep|sleep_for' <loop file>` shows none left in the loop.

---

## Phase 3: Check Drift

### Entry Criteria
- Patched binary built.
- If it commands actuators: bench or closed course only, behind an independent hardware emergency stop; otherwise outputs disabled.

### Actions
1. Run for K iterations (user choice) with a temporary diagnostic that records `clock_gettime(CLOCK_MONOTONIC)` at the first and last wakeup into variables (no printing inside the loop).
2. Expected elapsed = (K - 1) * period. Report measured elapsed minus expected. With absolute deadlines the difference is bounded by one wakeup latency and does not grow with K; with a relative sleep it grows with K. Run with two values of K to show it does not grow.
3. Report `overruns` for the run.

### Output
`loop_patch`.

### Quality Gate
- Elapsed minus expected is reported for two values of K, and the larger K does not show a proportionally larger difference.
- The overrun count is reported as a number.

---

## Worked Example

Illustrative. `loop_period_us` = 10000 (100 Hz CAN steering-angle reader on a bench).

Phase 1: `src/ctl.c:88: usleep(10000);` after the work: relative (row 1).

Phase 2: loop rewritten as above with skip policy (a) chosen by the user.

Phase 3:
```
K=1000:   expected 9.990000 s  measured 9.990004 s  diff 4 us
K=10000:  expected 99.990000 s measured 99.990003 s diff 3 us
overruns: 0
```
Before the change, the same test gave diffs of 61 ms and 0.6 s.

---

## Exit Criteria

DONE when the loop wakes on absolute CLOCK_MONOTONIC deadlines, EINTR and errors are handled by return value, the overrun policy is the user's recorded choice, tests pass, and drift does not grow with iteration count.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Loop is event driven | **Return**: report; this flow does not apply. |
| Phase 2 | User has not chosen an overrun policy | **Return**: ask; do not ship a default. |
| Phase 2 | Tests fail | **Retry**: fix the change, never the tests. |
| Phase 3 | Diff grows with K | **Retry**: a relative sleep remains somewhere in the loop path; search again. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
