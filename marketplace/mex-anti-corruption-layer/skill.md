# Anti-Corruption Layer Between Legacy and Extracted Model

**One-line description:** Builds a translation layer (adapter plus translator) so the extracted module speaks its own clean model while the monolith keeps its legacy shapes, with table-driven tests for every field mapping, status code and enum value, so no legacy naming, nullability quirk or status code leaks across the boundary in either direction.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `module_interface` (object, required): From `mex-interface-boundary-contract`; the new model.
- `seam_map` (object, required): From `mex-seam-identification`; edges marked `invert_dependency` and `route_via_facade` show where translation is needed.
- `deployment_decision` (string, required): `in_process` or `service`.
- `stack` (string, required): `python`, `node`, `go` or `java`.

---

## Outputs

- `acl_adapter` (object): Adapter and translator file paths, the field mapping table, the enum and status mapping table, the direction of each translation, and the list of legacy quirks absorbed.
- `translation_tests` (object): Test file path, run command, case count and pass summary.

---

## Phase 1: Build the Mapping Tables

### Entry Criteria
- `module_interface` is final for the operations in scope.

### Actions
1. For each interface type, write a field mapping table: new field, legacy source (table column, ORM attribute, legacy JSON key), transformation, and null handling. Read legacy shapes from the code and the database schema (`\d invoices` in psql, `SHOW CREATE TABLE invoices` in mysql); do not infer from names.
2. For each enum or status, write a value mapping table with every legacy value. Get the full list from data, not code: `SELECT status, COUNT(*) FROM invoices GROUP BY status;`. Legacy data often has values the code no longer writes.
3. Record quirks to absorb, for example: money stored as float dollars (convert to integer minor units with explicit rounding rule named by the user or the accounting policy), local-time timestamps without zone (record the zone the legacy system assumed), empty string meaning null, magic IDs such as `0` or `-1`.
4. Decide the translation location with this rule: the layer lives on the side that protects its model. The new module owns the translator for data it receives from the monolith (the port adapter for `invert_dependency` edges). The monolith owns the translator for data it receives from the new module, if it needs legacy shapes.

### Output
Field mapping, value mapping and quirk tables.

### Quality Gate
- Every legacy enum value returned by the `GROUP BY` query has a mapping row or an explicit `reject` rule.
- Every field has a null handling rule.

---

## Phase 2: Implement the Adapter and Translator

### Entry Criteria
- Mapping tables complete.

### Actions
1. Implement pure translator functions with no I/O: python functions in `billing/acl/translate.py`; node `src/billing/acl/translate.ts`; go `internal/billing/acl/translate.go`; java `com.acme.billing.acl.LegacyTranslator`. Translators take legacy values and return interface types, or the reverse.
2. Implement the adapter that does the I/O: for `in_process`, it calls the legacy code or reads legacy rows; for `service`, it calls the monolith's endpoint or consumes its events. The adapter calls the translator; it never maps fields itself.
3. Unknown enum values: raise or return the interface's `ValidationFailed` error with the unknown value in the message. Do not map unknown values to a default status silently.
4. Keep the anti-corruption layer the only code that imports legacy types: add it to the allowed sources in the stack's boundary rules (import-linter, dependency-cruiser, depguard or ArchUnit) and nothing else.

### Output
Adapter and translator code.

### Quality Gate
- The type check or compile command exits 0.
- `rg -n "<legacy type or module name>" <new module dir>` returns hits only under the `acl` directory.

---

## Phase 3: Table-Driven Translation Tests

### Entry Criteria
- Code compiles.

### Actions
1. Write one table-driven test per translator with one row per mapping row and per enum value, plus quirk cases: python `@pytest.mark.parametrize`; node `test.each`; go a `[]struct{name string; in Legacy; want Invoice}` loop with `t.Run`; java `@ParameterizedTest` with `@MethodSource`.
2. Add round-trip tests where translation goes both ways: `to_legacy(from_legacy(x)) == x` for every row.
3. Add one test per unknown or rejected value asserting the error.
4. Run the tests, then run the characterization suite from `mex-characterization-tests`; it must pass unchanged.

### Output
`translation_tests`.

### Quality Gate
- Test count is at least the number of mapping rows plus enum values plus quirk rows.
- Characterization suite passes with no snapshot updates.

---

## Worked Example

Illustrative. Legacy `invoices.status` values from `SELECT status, COUNT(*) ...`: `N` 120, `P` 98211, `V` 431, `X` 2 (undocumented). Legacy `amount` is `numeric(12,2)` dollars.

| Legacy | New | Rule |
|---|---|---|
| `status='N'` | `DRAFT` | |
| `status='P'` | `PAID` | |
| `status='V'` | `VOID` | |
| `status='X'` | none | reject with `ValidationFailed("unknown legacy status X")`; reported to user |
| `amount 12.30` | `total_minor 1230`, `currency` from `customers.currency` | multiply by 100 with `Decimal`, never float |

```
$ pytest -q tests/billing/acl
27 passed in 0.18s
```

---

## Exit Criteria

DONE when every legacy field and value has a tested mapping or an explicit rejection, legacy types appear only under the `acl` directory, and characterization tests still pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Rounding rule for money is unknown | **Return**: ask the user for the accounting rule; do not pick one. |
| Phase 1 | Production data has values the code never writes | **Return**: list them with counts; the user decides map or reject. |
| Phase 2 | Translator needs a database lookup | **Adjust**: move the lookup into the adapter and pass the result into the translator. |
| Phase 3 | Round trip fails for a lossy field | **Adjust**: document the loss in the mapping table and assert it explicitly. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
