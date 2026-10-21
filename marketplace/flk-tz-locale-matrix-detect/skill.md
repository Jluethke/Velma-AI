# Time Zone And Locale Matrix Detection

**One-line description:** Runs a flaky test under a fixed matrix of IANA time zones and locales chosen for specific edge properties (largest positive and negative UTC offsets, a non-whole-hour offset, a DST zone, a 30-minute DST shift, Turkish and German locales) and with the clock placed near midnight, to expose clock and locale dependence.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `flake_evidence` (object, required): Supplies test id, stack and failure UTC timestamps.
- `stack` (string, required): `python`, `node` or `go`.
- `repo_path` (string, required): Repository root.

---

## Outputs

- `tz_matrix_report` (object): `{runs[{tz, locale, result, message}], tz_dependent, locale_dependent, failing_values[], timestamp_clustering, env_is_honored}`.

---

## Phase 1: Choose The Matrix And Check The Runtime Honors It

### Entry Criteria
- `stack` set.

### Actions
1. Use these values. Each is picked for a property, not at random:

| Value | Property |
|---|---|
| `TZ=UTC` | Baseline. |
| `TZ=Pacific/Kiritimati` | UTC+14, the largest positive offset: local date is a day ahead of UTC for most of the day. |
| `TZ=Pacific/Pago_Pago` | UTC-11, a large negative offset: local date is a day behind. |
| `TZ=Asia/Kolkata` | UTC+5:30, non-whole-hour offset. |
| `TZ=America/St_Johns` | UTC-3:30 with DST. |
| `TZ=America/New_York` | Common DST zone (23-hour and 25-hour days). |
| `TZ=Australia/Lord_Howe` | DST shift of 30 minutes, not 60. |
| `LC_ALL=tr_TR.UTF-8` | Turkish dotted and dotless i break case-insensitive compares. |
| `LC_ALL=de_DE.UTF-8` | Comma decimal separator, different date order. |

2. Check that each value is honored on this platform:
   - Python: `TZ=Pacific/Kiritimati python -c "import time; print(time.strftime('%z'))"` must print `+1400`. On Windows, `time.tzset` does not exist and `TZ` is not read the same way; run the matrix in Linux or WSL or a container.
   - Node: `TZ=Pacific/Kiritimati node -e "console.log(new Date().getTimezoneOffset())"` must print `-840`.
   - Go: `TZ=Pacific/Kiritimati go run` a one-line program printing `time.Now().Format("-0700")`; Go reads `TZ` once at startup into `time.Local`. On Windows or minimal containers without zoneinfo, import `time/tzdata` or build with `-tags timetzdata`.
   - Locales: `locale -a | grep -i -E "tr_TR|de_DE"`. If missing on Debian or Ubuntu, `locale-gen tr_TR.UTF-8 de_DE.UTF-8` as root. Node and Go mostly ignore `LC_ALL` for formatting (Node uses ICU with `Intl` defaults; Go has no locale formatting in the standard library), so locale rows matter mainly for Python and for any code calling `toLocaleString()` without a locale argument.
3. Set `env_is_honored` per value from these checks.

### Output
Matrix with honored values.

### Quality Gate
- Every row used has a recorded check output proving the runtime saw it.

---

## Phase 2: Run The Matrix

### Entry Criteria
- Honored values listed.

### Actions
1. For each honored value, run the single test with the measurement command from the stack flow, for example:
   - `TZ=Pacific/Kiritimati python -m pytest "<test_id>" -p no:randomly -q`
   - `TZ=Pacific/Kiritimati npx jest <file> -t "<pattern>" --ci --runInBand`
   - `TZ=Pacific/Kiritimati go test ./pkg -run '^TestX$' -count=1`
2. Run each once with real time, then once with the system clock near local midnight. Without changing the machine clock, approximate this by choosing the zone whose current local time is closest to 23:59 at the moment you run (compute with `TZ=<zone> date`). Record the local time at run start.
3. Compare with `flake_evidence.failure_timestamps_utc`: compute each failure's local time in the CI runner's zone (usually UTC). If failures cluster within an hour of local midnight, at month end, or on DST change dates, set `timestamp_clustering` to that pattern.
4. Decision:

| Result | `tz_dependent` / `locale_dependent` |
|---|---|
| Fails in at least one TZ row, passes in UTC | `tz_dependent: true` |
| Fails only in a locale row | `locale_dependent: true` |
| Fails only in the near-midnight run | `tz_dependent: true` (date boundary) |
| Passes everywhere, but CI failures cluster at midnight UTC | `tz_dependent: true` (clock boundary in UTC) |
| Passes everywhere, no clustering | both false |

5. Do NOT fix here. Do not set `TZ=UTC` in CI as the "fix": that hides a bug users in other zones hit. The fix flows pin the zone inside the test where the test is about a specific zone, and fix product code where it uses local time by accident.

### Output
`tz_matrix_report`.

### Quality Gate
- Each run has a result and, for failures, the first assertion line.

---

## Worked Example

Illustrative. Python, `tests/reports/test_daily.py::test_today_bucket`.

- Phase 1: `TZ=Pacific/Kiritimati python -c "import time; print(time.strftime('%z'))"` prints `+1400`.
- Phase 2: UTC passes; Kiritimati fails with `assert date(2026, 10, 21) == date(2026, 10, 20)`; Pago_Pago passes at 13:00 local. CI failures in `flake_evidence` all between 23:41 and 00:07 UTC. `tz_dependent: true`, `timestamp_clustering` = "within 20 minutes of 00:00 UTC". The test compares `date.today()` (local) with a UTC-derived date.

---

## Exit Criteria

DONE when every honored matrix value has a recorded result and both dependence flags are set from the decision table.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Runtime ignores `TZ` (Windows Python) | **Adjust**: run the matrix in WSL or a Linux container. |
| Phase 1 | Locale not installed | **Adjust**: generate it with `locale-gen`, or drop the row and record why. |
| Phase 2 | Every row fails, including UTC | **Return**: the failure is not clock-related; pass to the classifier with other evidence. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
