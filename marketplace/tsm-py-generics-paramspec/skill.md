# Python Generics, ParamSpec and overload

**One-line description:** Replaces `Any` in containers, repositories, caches, factories and decorators with `TypeVar` or PEP 695 type parameters, `ParamSpec` and `Concatenate` for decorators, `Self` for fluent methods, and `@overload` for return types that depend on arguments, so types flow through these helpers instead of being erased.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `py_structural_types` (object[], optional): From `tsm-py-typeddict-protocol`; new types that generic helpers will now carry.

---

## Outputs

- `py_generic_types` (object[]): One row per helper made generic: name, file, technique (`TypeVar`, PEP 695, `ParamSpec`, `Self`, `overload`), the `Any` it removed, the call sites whose inferred type improved (checked with `reveal_type`), and the checker result.

---

## Phase 1: Find Type-Erasing Helpers

### Entry Criteria
- The modules holding the helpers are annotated.

### Actions
1. Search:
   - Decorators: `grep -rnE "def [a-z_]+\(f(unc)?: (Callable|Any)" src` and `grep -rn "functools.wraps" src`
   - Containers and caches: `grep -rnE "class [A-Za-z]+(Cache|Repo|Repository|Registry|Pool|Queue|Box|Result)\b" src`
   - Functions returning `Any` or `object` whose result callers then `cast`: `grep -rn "cast(" src`
   - Missing type arguments: mypy `type-arg` errors, pyright `reportMissingTypeArgument`
2. For each helper, apply this table:

   | Pattern | Technique |
   |---|---|
   | Output type equals an input type (`first(xs)`, `retry(fn)` returning `fn`'s result) | Type variable |
   | Class storing values of one caller-chosen type (`Cache`, `Repository`) | Generic class |
   | Decorator that keeps the wrapped function's signature | `ParamSpec` |
   | Decorator that adds or removes a leading argument (injects `session`) | `ParamSpec` with `Concatenate` |
   | Method returns `self` for chaining, including in subclasses | `typing.Self` (3.11+, else `typing_extensions`) |
   | Return type depends on a flag or argument type (`load(path, as_text: Literal[True]) -> str`) | `@overload` |
   | Type variable only valid for some types (numbers, a base class) | `bound=` or constraints |

### Output
Helper list with technique.

### Quality Gate
- Every search hit is assigned a technique or marked not-applicable with a reason.

---

## Phase 2: Apply the Technique

### Entry Criteria
- Helper list exists.

### Actions
1. Choose syntax by minimum Python: 3.12+ uses PEP 695 (`def first[T](xs: Sequence[T]) -> T | None:`, `class Cache[V]:`); earlier versions use `T = TypeVar("T")` and `class Cache(Generic[V]):`. Do not mix both styles in one module.
2. Type variables:
   ```python
   def first[T](xs: Sequence[T]) -> T | None:
       return xs[0] if xs else None
   ```
   Use `Sequence`, `Iterable` or `Mapping` for parameters, not `list` or `dict`: `list[int]` is not a `list[float]` (lists are invariant), but `Sequence[int]` is a `Sequence[float]`. This one change fixes many `arg-type` errors.
   A type variable used once in a signature does nothing (pyright reports it under `reportInvalidTypeVarUse`); replace it with the concrete type or `object`.
3. Bounds: `def largest[N: (int, float)](xs: Sequence[N]) -> N` for constraints, `def save[M: Model](m: M) -> M` for an upper bound (pre-3.12: `TypeVar("M", bound=Model)`).
4. Decorators with ParamSpec:
   ```python
   import functools
   from collections.abc import Callable

   def retry[**P, R](times: int) -> Callable[[Callable[P, R]], Callable[P, R]]:
       def deco(fn: Callable[P, R]) -> Callable[P, R]:
           @functools.wraps(fn)
           def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
               for attempt in range(times):
                   try:
                       return fn(*args, **kwargs)
                   except TransientError:
                       if attempt == times - 1:
                           raise
               raise AssertionError("unreachable")
           return wrapper
       return deco
   ```
   Pre-3.12: `P = ParamSpec("P")`, `R = TypeVar("R")`. `P.args` and `P.kwargs` must be used together on `*args` and `**kwargs`.
   Injected argument: `def with_session[**P, R](fn: Callable[Concatenate[Session, P], R]) -> Callable[P, R]`.
   Async functions: the wrapped type is `Callable[P, Awaitable[R]]` (or `Coroutine[Any, Any, R]` when the code needs coroutine methods; the `Any` there is part of the standard spelling and acceptable).
5. Self:
   ```python
   class Query:
       def where(self, clause: str) -> Self: ...
   ```
6. Overload: write each `@overload` signature with `...` bodies, then the real implementation with a signature covering all of them; the implementation is not visible to callers.
   ```python
   @overload
   def load(path: str, as_text: Literal[True]) -> str: ...
   @overload
   def load(path: str, as_text: Literal[False] = ...) -> bytes: ...
   def load(path: str, as_text: bool = False) -> str | bytes: ...
   ```
7. Verify call sites: at two call sites per helper insert `reveal_type(result)`, run the checker, confirm the revealed type is the concrete type (for example `builtins.int`, `Invoice`), not `Any` or a bare type variable, then remove the calls.
8. Remove the `cast(...)` calls the generic made redundant; `warn_redundant_casts` (mypy) or `reportUnnecessaryCast` (pyright strict) lists them.
9. Run the checker and `test_command`. One helper per commit: `types(generic): retry`.

### Output
`py_generic_types`.

### Quality Gate
- `reveal_type` at two call sites per helper showed a concrete type (recorded), and no `reveal_type` remains: `grep -rn "reveal_type(" src` prints nothing.
- Redundant-cast diagnostics: 0.
- Checker count for touched modules is 0 and the project count did not rise; tests match the baseline.

---

## Worked Example

Illustrative only. Python 3.12, mypy. `billing.cache.TTLCache` stores `Any`; `billing.db.with_session(fn)` injects a session; callers write `cast(Invoice, cache.get(key))`.

Phase 2: `class TTLCache[V]:` with `def get(self, key: str) -> V | None` and `def set(self, key: str, value: V) -> None`. Callers declare `invoices: TTLCache[Invoice] = TTLCache(ttl=60)`. `with_session[**P, R](fn: Callable[Concatenate[Session, P], R]) -> Callable[P, R]`.

```
$ mypy src/billing/api.py
src/billing/api.py:44: note: Revealed type is "billing.models.Invoice | None"
src/billing/api.py:61: note: Revealed type is "def (invoice_id: builtins.str) -> billing.models.Invoice"
src/billing/api.py:45: error: Redundant cast to "Invoice"  [redundant-cast]
```
The redundant cast is deleted; `reveal_type` lines removed; mypy clean; tests pass.

---

## Exit Criteria

DONE when every listed helper carries its type through (proven by `reveal_type` at call sites), redundant casts are gone, and checks and tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | `Incompatible types ... "list[int]"; expected "list[float]"` | **Adjust**: change the parameter to `Sequence[float]`; do not cast. |
| Phase 2 | Checker does not support PEP 695 syntax | **Adjust**: the checker version is old or `python_version` is below 3.12; use `TypeVar` syntax. |
| Phase 2 | Overload implementation reports "overlapping overloads" | **Adjust**: order overloads from most specific to least, and make `Literal` defaults appear in only one overload. |
| Phase 2 | A decorator's wrapped signature still shows `...` (`Callable[..., Any]`) | **Retry**: `functools.wraps` alone does not type the result; return type must be `Callable[P, R]`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
