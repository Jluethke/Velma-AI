# Python Clock And Time Zone Fix

**One-line description:** Removes wall-clock and local-zone dependence from a flaky Python test by freezing time with time-machine or freezegun at an explicit aware instant, pinning `TZ` with `monkeypatch` plus `time.tzset()`, and fixing product code that mixes naive local datetimes with UTC.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `root_cause_evidence` (object, required): Includes `tz_matrix_report` findings and suspect lines.
- `flake_class` (string, required): Must be `clock_timezone`.
- `baseline_command` (string, required): Reproduction, usually with a `TZ=` prefix.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `py_time_fix_diff` (string): Unified diff with a note per hunk.

---

## Phase 1: Find Every Clock Read

### Entry Criteria
- `flake_class` is `clock_timezone`. Otherwise return an empty diff.

### Actions
1. In the test and the product code it calls:
   `grep -n -E "datetime\.now\(\)|datetime\.utcnow\(|date\.today\(|time\.time\(|time\.localtime|time\.strftime|\.astimezone\(\)|fromtimestamp\(" <files>`
2. Classify each read:

| Read | Problem |
|---|---|
| `datetime.now()` / `date.today()` | Naive local time; depends on `TZ` |
| `datetime.utcnow()` | Naive UTC; deprecated since Python 3.12; mixing with aware values raises `TypeError` |
| `fromtimestamp(ts)` without `tz=` | Local zone |
| `.astimezone()` with no argument | Converts to local zone |
| `time.time()` in a duration | Wall clock can jump; use `time.monotonic()` for durations |
| Test computes "expected" with the same clock as the code | Races across a second, minute or midnight boundary |

3. Decide whether the product behavior is meant to be local-time (a user's calendar day) or UTC (timestamps, storage). Read the function's docstring or caller. If unknown, ask; do not guess.

### Output
Clock-read list with intended zone.

### Quality Gate
- Every read is listed with file:line and its intended zone.

---

## Phase 2: Fix Product Code Where It Is Wrong

### Entry Criteria
- List exists.

### Actions
1. Where product code means UTC but reads local time: use `datetime.now(timezone.utc)` (or `datetime.now(UTC)` on 3.11+).
2. Where product code means a specific user zone: take a `zoneinfo.ZoneInfo("America/New_York")` (Python 3.9+) as a parameter, and compute `datetime.now(tz)`.
3. Where a function reads the clock and is hard to test, add a parameter with a default: `def bucket(now: datetime | None = None): now = now or datetime.now(timezone.utc)`.
4. Do NOT change product code if the matrix showed only the test is wrong.

### Output
Product changes (or none).

### Quality Gate
- `grep` from Phase 1 shows no remaining naive reads in the product functions that were meant to be UTC.

---

## Phase 3: Freeze The Test Clock And Zone

### Entry Criteria
- Product code corrected or confirmed.

### Actions
1. Prefer time-machine if installed (`python -m pip show time-machine`): it patches the C-level clock and is faster than freezegun. It does not support PyPy.
   - Decorator: `@time_machine.travel(datetime(2026, 10, 20, 23, 59, 30, tzinfo=timezone.utc), tick=False)`
   - pytest fixture (time-machine plugin): `def test_x(time_machine): time_machine.move_to(datetime(..., tzinfo=timezone.utc), tick=False)`
   - Check `time_machine.travel` signature in the installed version's docs; the `tick` argument exists in current releases.
2. freezegun (if already used): `@freeze_time("2026-10-20 23:59:30", tz_offset=0)`; aware instant via `freeze_time(datetime(..., tzinfo=timezone.utc))`. freezegun cannot affect code in C extensions that read the clock directly.
3. Choose the frozen instant to cover the boundary the matrix found: just before midnight in the zone under test, a DST transition date for DST bugs, the last day of a month for month bugs. Write the instant as a literal with an explicit zone.
4. Pin the zone when behavior depends on it (Unix only, because `time.tzset` does not exist on Windows). Use a fixture that restores the zone itself, because `monkeypatch` undoes the env var only after your fixture's teardown has run, so a `tzset()` in your teardown would still see the patched value:
   `@pytest.fixture` / `def tz_kiritimati():` / `old = os.environ.get("TZ")` / `os.environ["TZ"] = "Pacific/Kiritimati"; time.tzset()` / `yield` / `if old is None: os.environ.pop("TZ", None)` / `else: os.environ["TZ"] = old` / `time.tzset()`.
   On Windows, inject a `ZoneInfo` into the code under test instead.
5. Compute expected values from the frozen literal, not from `datetime.now()` in the test.
6. Do NOT set `TZ=UTC` in CI or `pytest.ini` env as the fix.

### Output
Edited test and `py_time_fix_diff`.

### Quality Gate
- The test passes under each failing matrix zone: `TZ=<zone> python -m pytest "<test_id>" -q` exit 0 for every `failing_values` entry.
- `git -C <repo_path> diff` captured into `py_time_fix_diff`.

---

## Worked Example

Illustrative. `tests/reports/test_daily.py::test_today_bucket`; product `bucket_for(event)` uses `date.today()` but events are stored in UTC.

- Phase 1: `reports/daily.py:14 date.today()` naive local; intended UTC per docstring "UTC day bucket".
- Phase 2: `datetime.now(timezone.utc).date()`, with `now` parameter added.
- Phase 3: `@time_machine.travel(datetime(2026, 10, 20, 23, 59, 30, tzinfo=timezone.utc), tick=False)`; expected `date(2026, 10, 20)`. `TZ=Pacific/Kiritimati` and `TZ=Pacific/Pago_Pago` runs print `1 passed`.

---

## Exit Criteria

DONE when product clock reads match their intended zone, the test freezes an explicit aware instant at the found boundary, and it passes in every previously failing zone.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `flake_class` not matched | **Return**: empty diff. |
| Phase 1 | Intended zone unknown | **Stop**: ask the user; local versus UTC is a product decision. |
| Phase 3 | Library reads the clock in C and ignores freezegun | **Adjust**: switch that test to time-machine, or inject `now`. |
| Phase 3 | `AttributeError: module 'time' has no attribute 'tzset'` | **Adjust**: Windows; inject a `ZoneInfo` instead of setting `TZ`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
