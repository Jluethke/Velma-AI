# Replace Conditional with Polymorphism

**One-line description:** Replaces a `switch`, `match` or `if/elif` chain that branches on a type code with one class (or Go type implementing an interface) per case, following Fowler's mechanics: one case moved per commit, the original conditional delegating until it is empty, tests green after every move.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `test_command` (string, required): Full suite command.
- `baseline_commit` (string, required): From `srf-baseline-green-check`.
- `conditional_location` (string, required): `<file>:<line>` of the conditional, for example `shipping/cost.py:31`.
- `type_code_name` (string, required): The value being switched on, for example `shipment.kind` with cases `"ground"`, `"air"`, `"freight"`.

---

## Outputs

- `step_commits` (string[]): One SHA per case moved, plus the setup and cleanup commits.
- `step_log` (object[]): Per commit: case moved, files changed, test result, SHA.

---

## Phase 1: Qualify the Conditional

### Entry Criteria
- `git status --porcelain` empty.
- Characterization tests exist (from a `srf-*-characterization-tests` or golden flow) and each case of the conditional is covered. Confirm by reading the coverage output; a case with zero hits means stop and add a test first.

### Actions
1. Find every place that branches on the same type code: `git grep -n "<type_code_name>" -- "*.py" "*.ts" "*.go" "*.java"`. Polymorphism pays off when two or more functions switch on it.
2. Apply this table:

| Finding | Decision |
|---|---|
| Only one conditional, 2 to 3 short cases, no other switch on the code | Stop: a lookup table or leaving it is simpler. Record and exit. |
| Cases differ only by data (rates, labels) | Stop: use a dict or map of values, not classes. |
| Two or more functions switch on the same code, or cases contain distinct logic | Continue. |
| A `default`/`else` branch throws for unknown codes | Keep that behavior in the factory (Phase 2). |
| Type code persisted in a database or sent over the wire | Keep the code field; classes are created from it by a factory. |

3. Write down the exact behavior of the default branch (exception type and message, or fallback value). The factory must reproduce it.

### Output
Go or no-go, case list, default-branch behavior.

### Quality Gate
- Every case of the conditional has nonzero coverage in the characterization run.
- The decision cites a table row.

---

## Phase 2: Create the Hierarchy and Factory

### Entry Criteria
- Go decision.

### Actions
1. Create the base type and the factory without changing any caller. Stack forms:

| Stack | Base | Factory |
|---|---|---|
| Python | `class ShippingCost:` with the method raising `NotImplementedError`, or `abc.ABC` with `@abstractmethod` | `def shipping_cost_for(shipment) -> ShippingCost:` mapping codes to classes; unknown code reproduces the old default behavior |
| TypeScript | `abstract class ShippingCost { abstract cost(s: Shipment): number }` or an `interface` | `function shippingCostFor(s: Shipment): ShippingCost` using a `switch` with an exhaustive `never` check on the union type |
| Go | `type shippingCost interface { cost(s Shipment) Money }` | `func shippingCostFor(s Shipment) (shippingCost, error)` returning the same error the old default returned |

2. Initially every subclass inherits a base method that calls the original conditional function, so behavior is identical. In Python: `def cost(self, s): return _legacy_cost(s)` where `_legacy_cost` is the original function body renamed (use the rename flow for your stack).
3. Change the original function to `return shipping_cost_for(s).cost(s)`.
4. Run `test_command`. Commit: `refactor: introduce ShippingCost hierarchy delegating to legacy conditional`.
5. Do NOT move any case logic in this commit.

### Output
Hierarchy and factory in place, behavior unchanged.

### Quality Gate
- `test_command` exits 0 with baseline counts.
- `git show --stat HEAD` lists only the files holding the conditional and the new types.

---

## Phase 3: Move One Case per Commit

### Entry Criteria
- Phase 2 committed.

### Actions
1. Pick one case. Copy its branch body into the matching subclass method override. Translate references: local variables become parameters or fields; `return` values stay identical.
2. In the legacy conditional, replace that branch body with a raise or panic stating it is unreachable (`raise AssertionError("ground handled by GroundCost")`), so a missed dispatch fails loudly in tests.
3. Run characterization tests and `test_command`. Green: commit `refactor: move ground cost into GroundCost`. Red: `git checkout -- .`, reread the branch for a variable you missed, retry.
4. Repeat for each case. One case per commit; never move two cases in one commit.
5. Repeat for each other function that switched on the same code (from Phase 1 step 1), adding a method per function.

### Output
All cases moved, legacy branches unreachable.

### Quality Gate
- After each commit, `test_command` exits 0.
- `git log --oneline <phase2 sha>..HEAD` has one commit per case per function.

---

## Phase 4: Remove the Legacy Conditional

### Entry Criteria
- Every branch of the legacy conditional raises the unreachable error.

### Actions
1. Delete `_legacy_cost` and the base-class fallback that called it; make the base method abstract.
2. Confirm nothing else calls it: `git grep -n "_legacy_cost"` prints nothing.
3. Run the stack typechecker (`mypy`/`pyright`, `tsc --noEmit`, `go vet ./...`), tests, and the API check if one exists.
4. Commit `refactor: remove legacy shipping cost conditional`.

### Output
`step_commits`, `step_log`.

### Quality Gate
- The grep prints nothing; typechecker and tests exit 0; API check silent.
- `git status --porcelain` empty.

---

## Worked Example

Illustrative only. Python, `conditional_location=shipping/cost.py:31`, cases `ground`, `air`, `freight`, default raises `ValueError("unknown kind: x")`.
```
$ git log --oneline 9f2c4e1..HEAD
a41c0d2 refactor: remove legacy shipping cost conditional
77e1b9a refactor: move freight cost into FreightCost
3c90f4e refactor: move air cost into AirCost
c2d18a7 refactor: move ground cost into GroundCost
5be3a10 refactor: introduce ShippingCost hierarchy delegating to legacy conditional
$ pytest -q
215 passed, 2 skipped
```
The factory raises `ValueError("unknown kind: x")` exactly as before; the characterization case `unknown_kind` still passes.

---

## Exit Criteria

DONE when each case lives in its own type, the factory reproduces the old default behavior, the legacy conditional is gone, and every commit in the series is green.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A case has no test coverage | **Stop**: add characterization tests first. |
| Phase 1 | Cases differ only by data | **Return**: recommend a lookup table; no hierarchy. |
| Phase 3 | Moved case fails tests | **Retry**: revert the case, check for shared mutable locals or fallthrough between cases. |
| Phase 3 | `match` or `switch` had fallthrough between cases | **Adjust**: duplicate the shared tail into each subclass in the same commit. |
| Phase 4 | Typechecker reports a missing override | **Adjust**: implement it in the subclass reported. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
