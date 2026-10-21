# Split Phase

**One-line description:** Splits a function that does two things in sequence (typically parse then compute, or compute then format) into two functions joined by an explicit intermediate data structure, following Fowler's Split Phase mechanics with one commit per mechanical move and tests green after each.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `baseline_commit` (string, required): From `srf-baseline-green-check`.
- `split_function` (string, required): `<file>:<function>` to split, for example `orders/price.py:price_order`.

---

## Outputs

- `step_commits` (string[]): SHAs of the extract, intermediate-structure, and cleanup commits.
- `step_log` (object[]): Per commit: move made, results, SHA.

---

## Phase 1: Find the Seam

### Entry Criteria
- `git status --porcelain` empty; characterization tests cover every line of `split_function`.

### Actions
1. Read the function top to bottom. Mark each statement as phase A (reads raw input, parses, validates, looks up) or phase B (computes results, formats output, writes).
2. Apply this table to find the seam line:

| Pattern | Seam |
|---|---|
| All phase A statements come before all phase B statements | The line between them. Continue. |
| A and B statements interleave | Stop splitting; first reorder statements in their own commit, only if each moved statement has no side effects and does not read a variable written between its old and new position. Rerun tests after the reorder. |
| Phase B reads the raw input directly (not just values computed in A) | Note each such read; phase A must copy those values into the intermediate structure. |
| Phase A has side effects (I/O, logging, mutation of arguments) | Keep them in phase A; record their order. |

3. List every local variable written in phase A and read in phase B. These become fields of the intermediate structure. Read-only inputs used by B are fields too.

### Output
Seam line and the field list of the intermediate data.

### Quality Gate
- Every variable crossing the seam is listed.
- No statement after the seam is marked phase A.

---

## Phase 2: Extract Phase B

### Entry Criteria
- Phase 1 seam found with no interleaving left.

### Actions
1. Extract every statement after the seam into a new function `apply_<name>` (or `format_<name>`) using the stack's extract flow (`srf-py-extract-function-rope`, `srf-ts-extract-function-tsserver`, or gopls `refactor.extract.function` for Go, confirmed with `gopls codeaction -h`). The tool computes the parameters: they equal the field list from Phase 1.
2. Run tests. Commit `refactor: extract apply_pricing from price_order`.
3. Do NOT rename or reorder the new function's parameters in this commit.

### Output
Phase B as its own function taking many parameters.

### Quality Gate
- Tests exit 0; the extracted function's parameters match the Phase 1 field list.

---

## Phase 3: Introduce the Intermediate Structure

### Entry Criteria
- Phase 2 committed.

### Actions
1. Create the intermediate type named for what it holds (`PriceData`, `ParsedOrder`):

| Stack | Form |
|---|---|
| Python | `@dataclass(frozen=True) class PriceData:` with the fields |
| TypeScript | `interface PriceData { readonly ... }` |
| Go | `type priceData struct { ... }` |

2. Change `apply_pricing` to take one `PriceData` argument. Move one field at a time from the parameter list into the structure, running tests after each field if the function has more than a handful; commit when all fields are moved: `refactor: apply_pricing takes PriceData`.
3. Extract the statements before the seam into `parse_order(raw) -> PriceData` (or `calculate_<name>`) with the extract tool, so the original function becomes:
```python
def price_order(raw, catalog):
    data = parse_order(raw, catalog)
    return apply_pricing(data)
```
4. Run tests; commit `refactor: extract parse_order returning PriceData`.
5. Check that phase B no longer touches raw input: `apply_pricing` must not reference `raw`. Use `grep -n "raw" <file>` limited to the function's line range.

### Output
Two functions joined by `PriceData`.

### Quality Gate
- The original function body is two statements (call A, call B) plus any return.
- `apply_pricing` has exactly one parameter of the intermediate type.
- Tests exit 0 after each commit.

---

## Phase 4: Verify the Series

### Entry Criteria
- Phase 3 committed.

### Actions
1. Run the typechecker for the stack, `test_command`, and the API check if present. The public function keeps its name and signature, so the API check must be silent.
2. Confirm every commit in the series is green: run `srf-verify-step-history` or loop `git rev-list --reverse <start>..HEAD` running `test_command` at each.
3. Record `step_commits` and `step_log`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- Typechecker, tests and API check exit 0 at HEAD.
- Each commit in the series passes `test_command`.

---

## Worked Example

Illustrative only. `split_function=orders/price.py:price_order`, 48 lines: lines 1 to 20 parse the order and look up products, lines 21 to 48 compute discounts and totals.

Phase 1 field list: `base_price`, `quantity`, `discount_threshold`, `discount_rate`, `shipping_per_case`. Phase 2 extracts `apply_pricing(base_price, quantity, discount_threshold, discount_rate, shipping_per_case)`. Phase 3 creates `PriceData` and `parse_order`.
```
$ git log --oneline 9f2c4e1..HEAD
b7c8d9e refactor: extract parse_order returning PriceData
a6b7c8d refactor: apply_pricing takes PriceData
f5a6b7c refactor: extract apply_pricing from price_order
$ pytest -q
215 passed, 2 skipped
```

---

## Exit Criteria

DONE when the function is two calls joined by a named intermediate structure, phase B no longer reads raw input, the public signature is unchanged, and every commit is green.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Statements interleave with side effects | **Stop**: reordering would change behavior; report the statements. |
| Phase 2 | Extract tool returns many outputs (tuple) | **Adjust**: phase B writes variables that A reads later; the seam is wrong; move it. |
| Phase 3 | Tests fail after introducing the structure | **Retry**: revert, move one field per commit. |
| Phase 4 | API check reports a change | **Retry**: the public function signature moved; restore it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
