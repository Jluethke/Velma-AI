# Ledger Python Decimal Money

**One-line description:** Implements a Python money module with integer minor units for posted amounts and `decimal.Decimal` for sub-unit math, traps float mixing with `FloatOperation`, and fixes the JSON, SQLAlchemy, Django and psycopg boundaries where floats sneak back in.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the Python repository.
- `money_representation_spec` (object, required): Output of `ledg-money-representation-decision`.

---

## Outputs

- `py_money_module` (object): Path of the money module (for example `src/<pkg>/money.py`), its public API, the boundary fixes made (file and line), and the passing pytest command with its summary line.

---

## Phase 1: Write the Money Type

### Entry Criteria
- `money_representation_spec` lists python types for every value kind.
- `python --version` prints 3.8 or later and `pytest --version` runs inside the project environment.

### Actions
1. Create one module, `money.py`, in the package. Edit one file at a time and run the tests after each file.
2. Define an immutable value: `@dataclass(frozen=True) class Money: minor: int; currency: str`. In `__post_init__`, raise `TypeError` if `type(self.minor) is not int` (this rejects `bool`, `float` and `Decimal`), and raise `ValueError` if `currency` is not in the spec's exponent table.
3. Add `from_decimal_string(s: str, currency: str) -> Money`: parse with `Decimal(s)`, then check `d.as_tuple().exponent >= -exponent`; if the string has more fractional digits than the currency exponent, raise `ValueError`. Never round silently on input. Convert with `int(d.scaleb(exponent))`.
4. Add `__add__` and `__sub__` that raise `ValueError` when currencies differ. Do not define `__mul__` with a float; scaling by a rate goes through `multiply_by_decimal(rate: Decimal, rounding: str)` which takes the rounding constant explicitly.
5. Add `to_decimal_string()` that returns `str(Decimal(self.minor).scaleb(-exponent))` and pads with `quantize(Decimal(1).scaleb(-exponent))`.
6. Turn on the float trap at process start (in the app entry point and in `conftest.py`):
```
import decimal
decimal.getcontext().traps[decimal.FloatOperation] = True
```
With the trap set, `Decimal(3.14)` and `Decimal('3.5') < 3.7` raise `decimal.FloatOperation`. Equality comparison with a float stays silent, so also forbid `==` against floats in review. The context is per thread: new threads start from `decimal.DefaultContext`, so set the trap on `DefaultContext` too, before starting threads.

### Output
`money.py` with the type and constructors.

### Quality Gate
- `python -c "import decimal; from <pkg>.money import Money; Money(1.5, 'USD')"` exits non-zero with `TypeError`.
- `python -c "from <pkg>.money import Money; Money.from_decimal_string('1.005','USD')"` exits non-zero with `ValueError`.

---

## Phase 2: Fix the Boundaries

### Entry Criteria
- Money type exists and its smoke checks pass.

### Actions
1. JSON in: replace `json.loads(body)` on money payloads with `json.loads(body, parse_float=decimal.Decimal)` and then build `Money` from strings. JSON out: `json.dumps` raises `TypeError: Object of type Decimal is not JSON serializable`; emit money as strings via a `default=` hook, never by converting to `float`.
2. psycopg (2 and 3) returns PostgreSQL `numeric` as `Decimal` and `bigint` as `int` by default. Search for any `register_type`/`register_adapter` or loader that maps numeric to float and remove it: `rg -n "FLOAT|DECIMAL" -e register_type -e register_loader`.
3. SQLAlchemy: money columns use `BigInteger` for minor units or `Numeric(p, s)` (where `asdecimal=True` is the default). Replace any `Float` money column. For SQLite, SQLAlchemy warns that it stores Numeric as floating point; do not run money tests only on SQLite.
4. Django: `models.DecimalField(max_digits=..., decimal_places=...)` or `BigIntegerField`; never `FloatField`. DRF `serializers.DecimalField` has `coerce_to_string=True` by default; keep it.
5. Walk each migration item for python in `money_representation_spec` and change one file per commit-sized step, running `pytest -q` after each.

### Output
Boundary fixes list.

### Quality Gate
- `rg -n --type py -e 'float\(' -e 'FloatField' -e 'Column\(Float'` returns no hit classified as money.
- `pytest -q` exits 0 after the last change.

---

## Phase 3: Lock It With Tests

### Entry Criteria
- Boundary fixes are done and the suite passes.

### Actions
1. Add `tests/test_money.py` with exact-value checks: `Money.from_decimal_string('0.10','USD') + Money.from_decimal_string('0.20','USD') == Money(30,'USD')`; JPY rejects `'1.5'`; KWD accepts `'1.005'` as `Money(1005,'KWD')`.
2. Add a test that asserts `decimal.FloatOperation` is raised by `Decimal(0.1)` under the configured context, so removing the trap fails CI.
3. Add a test that round-trips a payload through the JSON hook and asserts the wire value is a string.
4. Run `pytest -q tests/test_money.py` then the full suite `pytest -q`. Record both summary lines.
5. Do not delete or loosen any existing test to get green. If an old test expected a float result, change the expectation to the exact decimal and note it in the output.

### Output
`py_money_module`.

### Quality Gate
- `pytest -q` final line shows `passed` and no `failed` or `error`.
- The FloatOperation test exists and passes.

---

## Worked Example

Illustrative only.
```
$ python -c "from shop.money import Money; print(Money.from_decimal_string('19.99','USD'))"
Money(minor=1999, currency='USD')
$ python -c "import decimal; decimal.getcontext().traps[decimal.FloatOperation]=True; decimal.Decimal(0.1)"
decimal.FloatOperation: [<class 'decimal.FloatOperation'>]
$ pytest -q
48 passed in 1.92s
```
Phase 2 output lists `api/orders.py:31` changed from `float(body["total"])` to `Money.from_decimal_string(body["total"], cur)`.

---

## Exit Criteria

DONE when the money module exists, every python migration item is changed, the float trap is on in app and tests, and `pytest -q` passes.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Python older than 3.8 | **Stop**: report the version; the dataclass and typing code needs 3.8 or later. |
| Phase 2 | FloatOperation raised in third-party code | **Adjust**: convert at that boundary with `Decimal(str(x))` only where the source is display text, and record it. |
| Phase 2 | Tests run only on SQLite | **Adjust**: add a PostgreSQL test job; SQLite Numeric is floating point. |
| Phase 3 | Existing test fails after the change | **Retry**: fix the code or the expectation to the exact value; never delete the test. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
