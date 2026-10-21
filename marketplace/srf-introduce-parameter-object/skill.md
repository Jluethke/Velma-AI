# Introduce Parameter Object

**One-line description:** Replaces a group of parameters that always travel together (for example `start`, `end`, `tz`) with one immutable value type, using a parallel-change sequence: add the type, add a new signature that takes it, keep the old signature as a delegating wrapper, migrate callers in batches, then remove the wrapper only when the API check allows it.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `baseline_commit` (string, required): From `srf-baseline-green-check`.
- `param_object_function` (string, required): `<file>:<function>` whose parameters are grouped, for example `reports/query.py:fetch_sales`.
- `parameter_group` (string[], required): Parameter names to group, in their current order, for example `["start", "end", "tz"]`.
- `new_type_name` (string, required): Name of the value type, for example `DateRange`.

---

## Outputs

- `step_commits` (string[]): SHAs: type added, new signature, caller batches, wrapper removal.
- `step_log` (object[]): Per commit: what changed, callers migrated, results, SHA.

---

## Phase 1: Confirm the Group and Pick the Type Form

### Entry Criteria
- `git status --porcelain` empty; characterization tests cover `param_object_function`.

### Actions
1. List callers: Python `git grep -n "fetch_sales(" -- "*.py"`; TypeScript use ts-morph `findReferencesAsNodes()` on the function; Go `gopls references <file>:<line>:<col>`.
2. Confirm the group: 2 or more other functions take the same parameters together (`git grep -n "start, end, tz"`), or callers always pass them together. If the group appears in only this function, record that and continue only if the user confirms.
3. Pick the type form from this table:

| Stack | Form | Notes |
|---|---|---|
| Python 3.7+ | `@dataclass(frozen=True)` | Keep field order identical to `parameter_group`; copy default values exactly. Frozen prevents callers mutating a shared instance. |
| Python with pydantic already used | Existing project convention | Do not add pydantic for this. |
| TypeScript | `interface DateRange { readonly start: Date; readonly end: Date; readonly tz?: string }` | Optional fields keep the same `?` and defaults move into the function body unchanged. |
| Go | `type DateRange struct { Start, End time.Time; TZ string }` passed by value | Zero values must match the old defaults, or keep an explicit default in the function. |

4. Record each parameter's default value and keyword-only or positional status. Defaults must behave identically after the change.

### Output
Caller list, confirmed group, type form, defaults table.

### Quality Gate
- Every parameter in `parameter_group` has its default and kind recorded.
- Caller count recorded.

---

## Phase 2: Add the Type and the New Signature

### Entry Criteria
- Phase 1 complete.

### Actions
1. Add `new_type_name` next to the function. Commit alone after tests pass: `refactor: add DateRange value type`.
2. Add the new function under a temporary name that takes the object, and move the body there. Make the old function a wrapper:
```python
def fetch_sales_in(rng: DateRange, region: str) -> list[Sale]:
    start, end, tz = rng.start, rng.end, rng.tz   # first line: unpack, body below unchanged
    ...

def fetch_sales(start, end, region, tz="UTC"):
    return fetch_sales_in(DateRange(start, end, tz), region)
```
   The wrapper keeps the old name, order and defaults exactly.
3. Run the characterization tests and `test_command`. Run the API check: it must be silent because the old signature is unchanged.
4. Commit: `refactor: fetch_sales delegates to fetch_sales_in(DateRange)`.

### Output
Type and new signature, old signature delegating.

### Quality Gate
- Tests exit 0; API check silent.
- The old function body is one line that builds the object and calls the new function.

---

## Phase 3: Migrate Callers in Batches

### Entry Criteria
- Phase 2 committed.

### Actions
1. Migrate callers one directory or one module per commit: replace `fetch_sales(a, b, r, tz=t)` with `fetch_sales_in(DateRange(a, b, t), r)`. Keep argument expressions in the same evaluation order; if an argument has side effects and its position moves, assign it to a local first.
2. After each batch: typecheck (`mypy`/`pyright`, `tsc --noEmit`, `go build ./...`), characterization tests, `test_command`, commit `refactor: migrate reports/ callers to DateRange`.
3. Do NOT edit tests' expected values. Tests that call the old function may keep doing so; they are migrated last, in their own commit.
4. Push the object deeper: if `fetch_sales_in` passes `start, end, tz` on to helpers, change those helpers to take `DateRange` in further commits using the same wrapper pattern.

### Output
Callers migrated.

### Quality Gate
- After each batch, tests and typecheck exit 0.
- `git grep -n "fetch_sales(" -- "*.py"` count decreases with each batch commit.

---

## Phase 4: Retire or Keep the Wrapper

### Entry Criteria
- No internal callers of the old signature remain (grep count 0 outside the wrapper).

### Actions
1. Apply this table:

| Old function is | Action |
|---|---|
| Internal only (API check would not change, or not in public API) | Delete the wrapper; rename `fetch_sales_in` to `fetch_sales` with the stack's rename flow; commit. |
| Public API | Keep the wrapper. Optionally mark it deprecated (`warnings.warn(..., DeprecationWarning, stacklevel=2)`, `/** @deprecated */`, `// Deprecated:`) only if the user approves. |

2. Run tests and the API check; commit.

### Output
`step_commits`, `step_log`.

### Quality Gate
- API check silent, or the user approved the recorded break.
- `git status --porcelain` empty; every commit in the series passes `test_command`.

---

## Worked Example

Illustrative only. `param_object_function=reports/query.py:fetch_sales`, `parameter_group=["start","end","tz"]`, `new_type_name=DateRange`, 11 callers in 3 packages.
```
$ git log --oneline 9f2c4e1..HEAD
e1f2a3b refactor: rename fetch_sales_in to fetch_sales
d4c5b6a refactor: remove fetch_sales positional wrapper
9a8b7c6 refactor: migrate tests to DateRange
6f5e4d3 refactor: migrate api/ callers to DateRange
3c2b1a0 refactor: migrate reports/ callers to DateRange
0f9e8d7 refactor: fetch_sales delegates to fetch_sales_in(DateRange)
7a6b5c4 refactor: add DateRange value type
```
`fetch_sales` was internal (`griffe check` silent before removal), so the wrapper was retired.

---

## Exit Criteria

DONE when callers pass the value object, defaults behave as before, the wrapper is retired or kept by rule, and every commit is green.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Defaults differ between functions sharing the group | **Stop**: the group is not one concept; keep defaults per function and report. |
| Phase 2 | API check reports a changed signature | **Retry**: the wrapper changed order or defaults; restore them exactly. |
| Phase 3 | A caller passes the parameters via `**kwargs` | **Adjust**: leave it on the wrapper and list it. |
| Phase 4 | Public consumers exist | **Return**: keep the wrapper. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
