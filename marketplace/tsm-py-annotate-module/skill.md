# Annotate One Python Module

**One-line description:** Annotates one Python module (or one cycle unit) per commit in conversion order, drafting signatures from MonkeyType call traces, confirming each with `reveal_type` and the checker in strict mode, and proving the test result is unchanged, without adding `Any`, `cast` or bare `type: ignore`.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_conversion_order` (object[], required): From `tsm-py-conversion-order`.
- `py_stub_report` (object[], required): From `tsm-py-stubs-missing-imports`; third-party imports are typed.
- `migration_profile` (object, required): Supplies `checker`, `check_command`, `test_command`, `test_baseline`, `language_version`.

---

## Outputs

- `py_annotated_modules` (object[]): One row per unit: module names, commit hash, strict error count before and after for those modules, test result after, signatures drafted by MonkeyType versus written by hand, and open questions (functions whose type could not be determined).

---

## Phase 1: Draft Signatures

### Entry Criteria
- Every earlier unit in `py_conversion_order` is annotated (its row exists in `py_annotated_modules`).
- Working tree clean.

### Actions
1. Take the next unit. Work on it alone. Record its current strict error count: mypy `mypy --strict <module path> 2>&1 | grep -c "^<module path>:"`; pyright: add `# pyright: strict` temporarily and run `pyright <module path>`.
2. Choose the syntax for the project's minimum Python (`requires-python` lower bound):

   | Minimum Python | Write |
   |---|---|
   | 3.9 or lower | `from __future__ import annotations` at the top, then `list[int]`, `X \| None` are allowed in annotations only; runtime uses (type aliases, `isinstance`, pydantic fields) need `typing.Optional`, `typing.List` or `typing_extensions`. |
   | 3.10 or 3.11 | `X \| None`, `list[int]` everywhere. |
   | 3.12 or higher | As above, plus PEP 695 `def f[T](x: T) -> T` and `type Alias = ...`. |

3. Optional draft from runtime traces with MonkeyType (only if the test suite exercises the module):
   - `pip install monkeytype` into the dev environment (do not add it to the project dependencies unless the user asks).
   - `monkeytype run -m pytest tests/test_money.py` (records call types into `monkeytype.sqlite3`).
   - `monkeytype stub billing.money` prints a draft stub; read it.
   - Apply only after reading: `monkeytype apply billing.money`. It rewrites the source file; check `git diff`.
   - Add `monkeytype.sqlite3` to `.git/info/exclude`; never commit it.
4. Treat every MonkeyType type as evidence of what tests passed, not as the contract. Widen or narrow by reading the code:
   - Concrete `list[int]` for a parameter that is only iterated becomes `Iterable[int]`; only read by index or length becomes `Sequence[int]`; read-only mapping becomes `Mapping[str, int]`.
   - A union of many concrete classes usually means a Protocol (see `tsm-py-typeddict-protocol`).
   - `dict[str, Any]` or `Dict[str, Union[...]]` from JSON-like data marks a TypedDict or a boundary for `tsm-py-pydantic-boundaries`.

### Output
Draft annotations in the working tree.

### Quality Gate
- `git diff --stat` lists only files of this unit.
- `monkeytype.sqlite3` is not staged: `git status --porcelain | grep monkeytype` prints nothing.

---

## Phase 2: Confirm and Fix

### Entry Criteria
- Draft annotations exist (or the unit is annotated by hand).

### Actions
1. Annotate every function signature fully: all parameters (except `self`/`cls`), `*args`, `**kwargs` (`**kwargs: str` means each value is `str`), and the return type, including `-> None`. Annotate class attributes and module-level constants whose inferred type is wider than intended (`TIMEOUT: Final = 30`).
2. When unsure what the checker infers, insert `reveal_type(expr)` (available from `typing` in 3.11+, and understood by checkers without import in earlier versions), run the checker, read the `note: Revealed type is "..."` line (pyright: `information: Type of "expr" is "..."`), then delete the call. Never commit `reveal_type`.
3. Fix each strict error in this unit using this table:

   | mypy code / pyright rule | Fix |
   |---|---|
   | `no-untyped-def` / `reportMissingParameterType` | Add the missing annotations. |
   | `no-untyped-call` | The callee is unannotated; it belongs to an earlier unit. Stop and annotate it there. |
   | `union-attr` / `reportOptionalMemberAccess` | Narrow: `if x is None: raise ...` or return early. |
   | `arg-type`, `assignment`, `return-value` | Real mismatch. Read both sides; fix the wrong annotation, or record a real bug as `# type: ignore[code]  # BUG: <text>` and report it. Never change runtime behavior here. |
   | `type-arg` / `reportMissingTypeArgument` | Add type parameters: `dict[str, Decimal]`, not `dict`. |
   | `no-any-return` | A typed function returns an `Any` value; type the source or narrow; see `tsm-py-eliminate-any-cast`. |

4. Never write `Any`, `cast(...)` or a bare `# type: ignore`. When a type cannot be determined from callers and code, leave the parameter unannotated, record an open question, and do not add the unit to the strict list until resolved.
5. Run the full project check (errors elsewhere must not rise) and `test_command`.

### Output
Unit with zero strict errors.

### Quality Gate
- Strict error count for the unit's files is 0 (same command as Phase 1 step 1).
- Project error count under the committed config did not rise.
- `test_command` result equals `test_baseline`.
- `git diff | grep -E "^\+.*(\bAny\b|cast\(|# type: ignore$)"` prints nothing.

---

## Phase 3: Commit and Hand Off

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Commit `types: annotate billing.money`.
2. Add the unit to the strict list with `tsm-py-mypy-module-strict` or `tsm-py-pyright-strict` (same commit or the next one).
3. Append the row to `py_annotated_modules` and continue with the next unit.

### Output
`py_annotated_modules`.

### Quality Gate
- One commit per unit; `git show --stat HEAD` lists only the unit's files plus the checker config.

---

## Worked Example

Illustrative only. Unit `billing.money`, Python 3.12, mypy.

Phase 1: `mypy --strict src/billing/money.py` shows 9 errors in the file. `monkeytype run -m pytest tests/test_money.py` then `monkeytype stub billing.money` prints:
```
def convert(amount: Decimal, rates: Dict[str, Decimal], to: str) -> Decimal: ...
def format_amount(amount: Decimal, currency: str, places: int = ...) -> str: ...
```
`rates` is only read, so it becomes `Mapping[str, Decimal]`; `Dict` becomes built-in syntax.

Phase 2: one `union-attr` error: `CURRENCIES.get(to).symbol`. Narrowed with `info = CURRENCIES.get(to); if info is None: raise UnknownCurrency(to)`. The old code raised `AttributeError`; tests only check the happy path, so behavior there is unchanged and the new exception is recorded for the user. Strict errors 0, `412 passed`. Commit, then add `billing.money` to the strict override.

---

## Exit Criteria

DONE when every unit in `py_conversion_order` is annotated with zero strict errors, each in its own commit with an unchanged test result, and every open question is listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Earlier unit not annotated | **Stop**: annotate it first; otherwise this unit needs `Any` at its imports. |
| Phase 1 | MonkeyType records nothing | **Adjust**: the tests do not call the module; annotate by hand from the code and callers. |
| Phase 2 | Annotation reveals a real bug | **Return**: record it with `# type: ignore[code]  # BUG:` and report it; fixing behavior is a separate change. |
| Phase 2 | A test fails after annotation | **Retry**: annotations do not change behavior except via `from __future__ import annotations` affecting runtime introspection (dataclasses, pydantic, `typing.get_type_hints`); revert the future import or fix the runtime-evaluated annotation. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
