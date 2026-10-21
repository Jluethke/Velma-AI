# Jest Fake Timers And Time Zone Fix

**One-line description:** Removes wall-clock, timer and time-zone dependence from a flaky Jest test with modern fake timers (`jest.useFakeTimers`, `jest.setSystemTime`, `advanceTimersByTimeAsync`), a pinned `TZ` set before any `Date` is created, and explicit `timeZone` options in `Intl` formatting.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Matrix findings and suspect lines.
- `flake_class` (string, required): Must be `clock_timezone`.
- `baseline_command` (string, required): Reproduction, usually `TZ=<zone> npx jest ...`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `node_time_fix_diff` (string): Unified diff with a note per hunk.

---

## Phase 1: Find Clock, Timer And Zone Use

### Entry Criteria
- `flake_class` is `clock_timezone`. Otherwise return an empty diff.

### Actions
1. Grep test and product code:
   `grep -n -E "new Date\(\)|Date\.now\(|setTimeout|setInterval|toLocaleDateString\(|toLocaleString\(|toLocaleTimeString\(|getHours\(|getDate\(|getDay\(|Intl\.DateTimeFormat\(" <files>`
2. Classify:

| Use | Problem |
|---|---|
| `getDate()`, `getHours()`, `getDay()` | Local zone; use `getUTCDate()` etc. if UTC is intended |
| `toLocaleDateString()` with no locale or `timeZone` option | Depends on process zone and ICU default locale |
| `new Date('2026-10-20')` | Date-only ISO strings parse as UTC; `new Date('2026-10-20T00:00')` parses as local. Mixing them shifts a day |
| Test expected value built from `new Date()` | Races across a boundary |
| `setTimeout` delay in code under test | Real wait in tests; slow and timing-sensitive |

3. Note the date library if one is used (`date-fns`, `date-fns-tz`, `luxon`, `dayjs`). Each has its own zone handling; read its docs rather than assuming.

### Output
Use list with intended zone per item.

### Quality Gate
- Every use has file:line and intended zone (UTC or a named IANA zone).

---

## Phase 2: Fix Product Zone Handling

### Entry Criteria
- List exists.

### Actions
1. Intended UTC: use `getUTC*` methods and ISO strings ending in `Z`.
2. Intended user zone: pass `timeZone` explicitly: `new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', dateStyle: 'medium' }).format(d)`.
3. Add a `now` parameter to functions that read the clock when that makes the test simpler.
4. Do NOT edit product code if only the test is wrong.

### Output
Product edits or none.

### Quality Gate
- No remaining local-zone getters in functions documented as UTC.

---

## Phase 3: Fake The Clock And Pin TZ In The Test

### Entry Criteria
- Product code settled.

### Actions
1. In the test file:
   `beforeEach(() => { jest.useFakeTimers({ now: new Date('2026-10-20T23:59:30Z') }); });`
   `afterEach(() => { jest.useRealTimers(); });`
   Modern fake timers (the default since Jest 27) fake `Date` too. `jest.setSystemTime(date)` moves the clock without firing timers.
2. Advance time instead of waiting: `jest.advanceTimersByTime(ms)`; if callbacks await promises between timers, use `await jest.advanceTimersByTimeAsync(ms)` (Jest 29.5+). `jest.runOnlyPendingTimers()` for recursive timers; avoid `jest.runAllTimers()` with `setInterval`, which loops until Jest's limit.
3. If the test also uses real I/O or `process.nextTick`, exclude it: `jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })`. For Testing Library `findBy` and `waitFor` with fake timers, use `advanceTimers: true` or advance manually.
4. Pin the zone for tests that are about a zone: set it before any Date code runs. Options, in order of preference:
   - `globalSetup` file: `module.exports = async () => { process.env.TZ = 'UTC'; };` (runs in the parent process before workers start; workers inherit env).
   - `package.json` script `"test": "cross-env TZ=UTC jest"` (`cross-env` for Windows shells).
   Setting `process.env.TZ` inside a test file is too late for some cached values; avoid it.
5. For zone-specific behavior, test it explicitly with the `timeZone` option and a fixed instant rather than changing `TZ` per test.
6. Do NOT pin `TZ=UTC` for the whole suite and call the flake fixed if the matrix showed a product bug in other zones; fix the product (Phase 2) and pin only to make expectations deterministic.

### Output
`node_time_fix_diff`.

### Quality Gate
- `TZ=<zone> npx jest <file> --ci` passes for every failing matrix zone.
- `git -C <repo_path> diff` captured into `node_time_fix_diff`.

---

## Worked Example

Illustrative. `src/reports/daily.test.ts`; product `dayKey(d)` uses `d.getDate()` but the API stores UTC days.

- Phase 1: `daily.ts:9 getDate()` local, intended UTC.
- Phase 2: `getUTCFullYear/getUTCMonth/getUTCDate`.
- Phase 3: `jest.useFakeTimers({ now: new Date('2026-10-20T23:59:30Z') })`; expected `'2026-10-20'`. `TZ=Pacific/Kiritimati npx jest src/reports/daily.test.ts --ci` prints `Tests: 4 passed, 4 total`; same for `Pacific/Pago_Pago`.

---

## Exit Criteria

DONE when product zone handling matches intent, the test runs on a fixed fake clock at the found boundary with timers advanced explicitly, and it passes in every previously failing zone.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 3 | Test hangs with fake timers | **Adjust**: a promise waits on a faked `nextTick` or timer; use `doNotFake` or `advanceTimersByTimeAsync`. |
| Phase 3 | `advanceTimersByTimeAsync is not a function` | **Adjust**: Jest is older than 29.5; use `jest.advanceTimersByTime` plus `await Promise.resolve()` between steps, or upgrade. |
| Phase 3 | Legacy timers configured (`fakeTimers: { legacyFakeTimers: true }`) | **Adjust**: legacy timers do not fake `Date`; switch this file to modern timers. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
