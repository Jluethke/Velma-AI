# Eliminate Any, cast and type: ignore in Python

**One-line description:** Inventories every explicit `Any`, `cast()` and `# type: ignore` with ruff and the checker, replaces each with real narrowing (`isinstance`, `is None`, `match`, `TypeIs`, `TypeGuard`, `assert_never`), and locks the result with `warn_unused_ignores`, `warn_redundant_casts`, `disallow_any_explicit` or the pyright strict rules plus ruff `ANN401` and `PGH003`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_generic_types` (object[], optional): From `tsm-py-generics-paramspec`; helpers already made generic, so casts at their call sites are already gone.

---

## Outputs

- `py_unsafe_fixes` (object): Counts before and after of explicit `Any`, `cast(`, bare `# type: ignore`, coded `# type: ignore[...]`; the checker flags and ruff rules enabled; the list of remaining justified suppressions with reasons; and the any-exprs coverage figure after (same command as `tsm-py-type-coverage`).

---

## Phase 1: Inventory

### Entry Criteria
- The checker runs with 0 errors under the committed config.

### Actions
1. Count with grep (save each to `.typecheck-logs/`):
   - `grep -rnE "\bAny\b" src --include=*.py | grep -v "^.*import" | wc -l`
   - `grep -rn "cast(" src --include=*.py | wc -l`
   - `grep -rnE "# type: ?ignore($|[^\[])" src --include=*.py | wc -l` (bare)
   - `grep -rnE "# type: ?ignore\[" src --include=*.py | wc -l` (coded)
   - `grep -rnE "# pyright: ?ignore($|[^\[])" src --include=*.py | wc -l`
2. Ruff (pin it in the dev group): `ruff check src --select ANN401,PGH003 --output-format concise`. `ANN401` flags `Any` in annotations of function parameters and returns; `PGH003` flags `# type: ignore` without a code. Confirm both codes exist with `ruff rule ANN401` and `ruff rule PGH003`.
3. Ask the checker which suppressions are stale:
   - mypy: `mypy --warn-unused-ignores --warn-redundant-casts` lists `Unused "type: ignore" comment` and `Redundant cast to "X"`.
   - pyright: set `reportUnnecessaryTypeIgnoreComment = "error"` and `reportUnnecessaryCast = "error"` (already on in strict for casts) and run.
4. Measure the expressions still typed `Any`: mypy `--disallow-any-expr` in a dry run (do not commit it) prints each expression; count them. This flag is very strict and is a measuring tool here, not a target setting.

### Output
Counts and per-line lists.

### Quality Gate
- Every count is copied from command output and the saved lists exist.

---

## Phase 2: Replace With Narrowing

### Entry Criteria
- Inventory saved.

### Actions
1. Delete stale suppressions first (step 3 output): they are free wins. Commit `types: remove unused ignores and redundant casts`.
2. For each remaining site, one module per commit, use the first matching row:

   | Site | Replacement |
   |---|---|
   | `cast(Foo, x)` where `x` is a union | `if not isinstance(x, Foo): raise TypeError(...)` then use `x`. |
   | `cast(Foo, d)` where `d` is `dict` from JSON | Validation at the boundary (`tsm-py-pydantic-boundaries`); internal code receives the typed value. |
   | Helper `def is_invoice(x: object) -> bool` used before casts | `def is_invoice(x: object) -> TypeIs[Invoice]:` (3.13 `typing`, or `typing_extensions` 4.10+). `TypeIs` narrows in both branches; use `TypeGuard` only when the narrowed type is not a subtype of the input type (for example `list[object]` to `list[str]`), since `TypeGuard` narrows only the true branch. |
   | `if/elif` chain over a union or enum | Add `else: assert_never(x)` (3.11 `typing`, else `typing_extensions`); a new variant then fails the check. With `match`, put `case _: assert_never(x)` last. |
   | `x: Any` parameter | The real type, a `Protocol`, or a type variable; see the earlier flows. `object` when any value is accepted and only `object` methods are used. |
   | `-> Any` return | The real return type; if it varies with arguments, `@overload`. |
   | `# type: ignore[attr-defined]` on a dynamic attribute | Declare the attribute on the class, or use `getattr(obj, "name")` followed by narrowing. |
   | `# type: ignore[import-untyped]` | Fix with `tsm-py-stubs-missing-imports`. |
   | Third-party API typed `Any` | Wrap once: assign to a variable annotated with the real type after an `isinstance` check, inside one small adapter function. |

3. `Any` vs `object`: `Any` turns off checking in both directions; `object` accepts any value but allows only `object` operations. Never replace `object` with `Any`.
4. A suppression that must stay (a checker bug, an untyped C extension) is written with the code and a reason: `# type: ignore[no-untyped-call]  # <library> 2.x ships no types for this call`. pyright: `# pyright: ignore[reportUnknownMemberType]  # reason`.
5. After each module: checker, `ruff check`, `test_command`; commit `types(any): billing.webhooks`.

### Output
Sites replaced or justified.

### Quality Gate
- Checker count is 0 after each commit; tests match the baseline.
- Bare ignores: `grep -rnE "# type: ?ignore($|[^\[])" src` prints nothing.
- Every remaining coded ignore has a trailing reason comment: `grep -rnE "# type: ?ignore\[[a-z-, ]+\]\s*$" src` prints nothing.

---

## Phase 3: Lock It In

### Entry Criteria
- Phase 2 complete.

### Actions
1. mypy: confirm `warn_unused_ignores = true` and `warn_redundant_casts = true` in `[tool.mypy]`. Add `disallow_any_explicit = true` for modules that now have zero explicit `Any` (per-module override, same list as the strict list), and `enable_error_code = ["ignore-without-code", "redundant-expr", "truthy-bool"]` globally after checking each code exists in the installed version (`mypy --help` and the error code docs).
2. pyright: in strict mode the unknown-type rules already report implicit `Any` flows; confirm `reportUnnecessaryTypeIgnoreComment = "error"`.
3. ruff: add `ANN401` and `PGH003` to `[tool.ruff.lint] extend-select`.
4. Re-run the any-exprs coverage with the command from `tsm-py-type-coverage` and record the figure.
5. Commit `types: lock any and ignore rules`.

### Output
`py_unsafe_fixes`.

### Quality Gate
- `ruff check src` exits 0 with the two rules selected.
- Checker exits 0 with the new flags.
- Coverage figure is greater than or equal to the `py_type_coverage` headline.

---

## Worked Example

Illustrative only. Inventory: explicit `Any` 58, `cast(` 41, bare ignores 17, coded ignores 22. mypy reports 9 unused ignores and 6 redundant casts.

Phase 2: the 15 stale ones go in the first commit. `billing.webhooks` has:
```python
def is_paid(e: dict[str, Any]) -> bool: return e.get("type") == "invoice.paid"
...
if is_paid(e):
    inv = cast(PaidEvent, e)
```
Becomes `def is_paid(e: WebhookEvent) -> TypeIs[PaidEvent]` and the cast is removed. The status dispatch gets `case _: assert_never(status)`; adding a new `"refunded"` literal later makes mypy print `Argument 1 to "assert_never" has incompatible type "Literal['refunded']"`, which is the intended alarm.

Phase 3: `ruff check src` exits 0, mypy exits 0, any-exprs coverage 83.20 to 96.75.

---

## Exit Criteria

DONE when bare ignores are zero, every remaining suppression is coded with a reason, explicit `Any` and `cast` are gone or justified, the lock-in flags pass, and coverage did not drop.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `--disallow-any-expr` floods output | **Adjust**: count it per module with `grep -c`; it is a measurement, not a target. |
| Phase 2 | `TypeIs` rejected: narrowed type is not a subtype of the input | **Adjust**: use `TypeGuard` for that function. |
| Phase 2 | Replacing a cast changes behavior because the new check raises | **Return**: the cast hid a case the code never handled; record it for the user and keep the old behavior until they decide. |
| Phase 3 | A flag name is not recognized by the installed mypy | **Adjust**: remove that flag and record it; do not upgrade the checker inside this flow. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
