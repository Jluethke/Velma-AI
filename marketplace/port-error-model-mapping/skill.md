# Port Error Model Mapping

**One-line description:** Maps every way the source signals failure (exceptions, error returns, errno, panics, silent defaults, process exit codes) to the target language's error model with a decision table per error kind, and defines a small set of language-neutral error categories so the golden corpus can compare failures across languages.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `source_repo` (string, required): Path to the source repository at the reference commit.
- `stack` (string, required): Port pair (`py-ts`, `py-go`, `js-ts`, `java-kotlin`, `c-rust`).
- `behavior_inventory` (object[], required): Output of `port-behavior-surface-inventory`.

---

## Outputs

- `error_mapping` (object): `categories` (the error category names and which source errors fall in each), `sites` (one row per raise or error-return site: location, source error, category, target construct), `silent_failures` (operations that fail loudly in one language and silently in the other), and `exit_codes` (source exit code per failure, and the target code that must match).

---

## Phase 1: Enumerate Failure Sites

### Entry Criteria
- `behavior_inventory` exists.

### Actions
1. Grep the source for every failure signal:
   - Python: `rg -n "raise |except |assert |sys\.exit\(" --type py`; list custom exception classes with `rg -n "class \w+\((\w*Error|\w*Exception)\)" --type py`.
   - JavaScript: `rg -n "throw |catch \(|\.catch\(|reject\(|process\.exit\(" --type js`.
   - Java: `rg -n "throw new |catch \(|throws |System\.exit\(" --type java`; checked exceptions are those extending `Exception` but not `RuntimeException`.
   - C: `rg -n "return -1|return NULL|errno|perror|abort\(|assert\(|exit\(" --type c`.
2. Find implicit failures that raise without a `raise` keyword: Python dict `d[k]` (KeyError), list index (IndexError), `int(s)` (ValueError), division by zero; JavaScript `JSON.parse` (SyntaxError), property access on `undefined` (TypeError); Java unboxing `null` (NullPointerException), `Integer.parseInt` (NumberFormatException); C null dereference and out-of-bounds (undefined behavior, no signal).
3. Record which in-scope behavior each site belongs to.

### Output
Failure site list.

### Quality Gate
- Every `raise`, `throw`, error-return and exit site from the grep has a row.
- Every custom exception class has at least one row or is listed as unused.

---

## Phase 2: Define Categories and Map Constructs

### Entry Criteria
- Failure site list exists.

### Actions
1. Define error categories from the source's own exception classes. Start from the source names (for example `ValueError` becomes `invalid_argument`); one category per distinct way a caller is expected to react. Do not merge two categories that callers catch separately (check `except A:` versus `except B:` blocks).
2. Map each site with this decision table. Take the first row that matches.

| Source failure kind | TypeScript | Go | Kotlin | Rust |
|---|---|---|---|---|
| Expected failure a caller handles (bad input, not found, parse error, Java checked exception) | `class InvalidArgumentError extends Error { name = "InvalidArgumentError" }`; throw it | sentinel `var ErrInvalidArgument = errors.New("invalid argument")`; return `fmt.Errorf("parse %q: %w", s, ErrInvalidArgument)`; callers use `errors.Is` | exception class extending `Exception`, add `@Throws(X::class)` when Java code calls it and catches X; or a `sealed class Result` if the codebase already uses one | enum variant in a `thiserror` enum: `#[error("invalid argument: {0}")] InvalidArgument(String)`; return `Err(...)`; callers use `?` or `match` |
| Failure carrying extra data (status code, offending field) | fields on the Error subclass | custom error struct implementing `Error() string`; callers use `errors.As` | properties on the exception | fields on the enum variant |
| Exception chaining (`raise X from e`, `new X(msg, cause)`) | `new X(msg, { cause: e })` (ES2022) | `%w` in `fmt.Errorf`; `errors.Join` (Go 1.20+) for several | `X(msg, e)` | `#[source]` or `#[from]` field |
| Programmer error (assert, invariant broken, unreachable branch) | `throw new Error("invariant: ...")` | `panic("invariant: ...")` | `check(...)`, `require(...)`, `error(...)` | `panic!`, `unreachable!`, `assert!` |
| Cleanup (`finally`, `with`, try-with-resources, `goto cleanup`) | `try/finally`; `using` (TS 5.2) only if your runtime supports `Symbol.dispose` | `defer` (runs at function exit, not block exit; do not `defer` inside a loop) | `use { }`, `try/finally` | `Drop` on a guard type; `?` returns early and still drops |
| Catch-all (`except Exception`, `catch (Exception e)`) | `catch (e)` and rethrow unknown types | handle returned errors; do not add `recover()` unless the source caught programmer errors on purpose | `catch (e: Exception)` also catches `CancellationException` in coroutines: rethrow it | `match` on the enum; panics are not caught (`catch_unwind` only at FFI or thread boundaries) |
| Application top level (CLI main) | catch, print, `process.exitCode = N` | `fmt.Fprintln(os.Stderr, err); os.Exit(N)` | catch, print, `exitProcess(N)` | `anyhow::Result` in `main`, or match and `std::process::exit(N)` |

3. Fill `silent_failures` from this table for the pair; each row is a place the port can silently produce a value where the source failed, or the reverse:

| Operation | Python | JS / TS | Go | Kotlin | C | Rust |
|---|---|---|---|---|---|---|
| Missing map key | `KeyError` | `undefined` | zero value (use `v, ok := m[k]`) | `map[k]` gives `null`; `getValue(k)` throws | n/a | `map[&k]` panics; `.get(&k)` gives `None` |
| Index out of range | `IndexError` | `undefined` | panic | `IndexOutOfBoundsException` | undefined behavior | panic; `.get(i)` gives `None` |
| Integer divide by zero | `ZeroDivisionError` | `Infinity`/`NaN` | panic | `ArithmeticException` | undefined behavior | panic |
| Parse invalid number | `ValueError` | `NaN` from `Number`, partial from `parseInt` | `error` | `NumberFormatException`; `toIntOrNull()` gives `null` | `atoi` gives 0 | `Err` |
| Write to nil map | n/a | n/a | panic | n/a | n/a | n/a |

4. Fill `exit_codes`. Uncaught failures exit differently per runtime: Python uncaught exception exits 1 and `argparse` usage errors exit 2; Node uncaught exception exits 1; a Go panic exits 2; a Rust panic exits 101; the JVM exits 1 when `main` throws; C `abort()` raises SIGABRT (shell shows 134). If the source CLI's exit code is part of its contract, the target must set it explicitly; list each.

### Output
`error_mapping`.

### Quality Gate
- Every site has a category and a target construct from the table.
- Every row of the `silent_failures` table that applies to the pair has at least one source site listed or "no sites" with the grep used.
- Every CLI exit code in `behavior_inventory` appears in `exit_codes` with the target code.

---

## Phase 3: Fix Comparison Rules

### Entry Criteria
- `error_mapping` drafted.

### Actions
1. Decide what the golden corpus compares for each failure: always the category; the message only when it is user-facing output (CLI stderr parsed by scripts, HTTP error body). Mark message comparison as `exact`, `prefix`, or `none` per category.
2. Write the category list in a form the capture harness and replay harness both use: a JSON object mapping source exception class name to category, and the target error type name to category.

### Output
Comparison rules added to `error_mapping`.

### Quality Gate
- Every category has a message rule.
- The class-to-category JSON parses with `jq . categories.json` (exit 0).

---

## Worked Example

Illustrative. `stack=py-go`.

Source:
```python
class ConfigError(Exception): ...
def load(path):
    try:
        raw = open(path).read()
    except FileNotFoundError as e:
        raise ConfigError(f"missing config {path}") from e
    return json.loads(raw)["port"]
```
Phase 1 sites: explicit `ConfigError`; implicit `json.JSONDecodeError`; implicit `KeyError` on `["port"]`.

Phase 2 rows:
```
E-001 load.py:6 ConfigError         category=config_missing  Go: return 0, fmt.Errorf("missing config %s: %w", path, ErrConfigMissing)
E-002 load.py:7 JSONDecodeError     category=parse           Go: json.Unmarshal error wrapped with ErrParse
E-003 load.py:7 KeyError 'port'     category=parse           Go: silent_failures hit; decoding into struct{Port *int} and checking Port == nil, else zero value 0 is returned silently
exit_codes: uncaught ConfigError -> Python exits 1; Go main must call os.Exit(1), not panic (which exits 2)
```
Phase 3: `config_missing` message rule `prefix` ("missing config"); `parse` message rule `none`.

---

## Exit Criteria

DONE when every failure site maps to a category and a target construct, every silent-failure trap for the pair is checked, exit codes are listed, and the category file parses.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Source swallows exceptions (`except: pass`) | **Adjust**: record the site as category `swallowed`; the port must swallow the same set, and the user decides if that is an intended divergence. |
| Phase 2 | One source exception class used for unrelated failures | **Adjust**: keep one category for parity; note the split as a later improvement. |
| Phase 2 | Java checked exception crosses into Kotlin callers | **Adjust**: add `@Throws` only on functions Java code calls; Kotlin callers need nothing. |
| Phase 3 | Messages contain nondeterministic data (paths, ids) | **Adjust**: use `prefix` or a mask regex from `port-nondeterminism-inventory`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
