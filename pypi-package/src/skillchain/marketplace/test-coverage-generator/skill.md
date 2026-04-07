# Test Coverage Generator

Analyze a codebase to identify every testable surface, prioritize by risk and business criticality, generate comprehensive test cases across the test pyramid, validate test quality and independence, and report remaining coverage gaps with maintenance recommendations.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ANALYZE    --> Scan codebase for functions, classes, branches, edge cases
PHASE 2: PRIORITIZE --> Rank by risk (untested critical paths first, then edge cases)
PHASE 3: GENERATE   --> Write test cases (unit, integration, edge case, error path)
PHASE 4: VALIDATE   --> Check tests are independent, deterministic, fast
PHASE 5: REPORT     --> Coverage summary, remaining gaps, maintenance recommendations
```

## Inputs

- `source_code`: string -- The code to generate tests for (files, modules, or functions)
- `existing_tests`: string (optional) -- Current test files for gap analysis
- `coverage_report`: string (optional) -- Coverage output (lcov, coverage.py, istanbul) for line/branch data
- `test_framework`: string (optional) -- Target framework (pytest, jest, mocha, JUnit, go test). Auto-detected if not specified.
- `coverage_history`: object (optional) -- Previous coverage data from this skill for trend tracking

## Outputs

- `coverage_analysis`: object -- Map of all testable surfaces with current coverage status
- `prioritized_test_plan`: object -- Ordered list of tests to write, ranked by risk
- `generated_tests`: object -- Complete test code ready to add to the test suite
- `validation_report`: object -- Quality assessment of generated tests (independence, determinism, speed)
- `coverage_summary`: object -- Current coverage, projected coverage after adding tests, remaining gaps

---

## Execution

### Phase 1: ANALYZE -- Identify Testable Surfaces

**Entry criteria:** Source code is provided. At least one function or class to analyze.

**Actions:**

1. **Extract testable units:**
   - List every public function with: name, parameters (types if available), return type, side effects
   - List every public class with: methods, constructor parameters, state mutations
   - List every API endpoint with: method, path, parameters, response types, auth requirements
   - List every database query with: operation type, tables touched, conditions

2. **Map code branches:**
   - For each function, identify all execution paths:
     - Conditional branches: if/elif/else, switch/case, ternary
     - Loop paths: zero iterations, one iteration, many iterations
     - Exception paths: try/except/finally, throw/catch
     - Early returns: guard clauses, validation failures
   - Count: total branches, branches covered by existing tests, uncovered branches

3. **Identify edge cases per function** (see Reference: Edge Case Catalog):
   - **Null/empty inputs**: None, null, undefined, empty string, empty list, empty dict
   - **Boundary values**: 0, 1, -1, MAX_INT, MIN_INT, empty, single-element, at-capacity
   - **Type boundaries**: float precision limits, string encoding (unicode, emoji, null bytes)
   - **State boundaries**: uninitialized, mid-transition, already-completed, concurrent access
   - **Time boundaries**: midnight, DST transitions, leap years, epoch, far future dates

4. **Identify integration points:**
   - Function calls that cross module boundaries
   - Database operations (read, write, transaction)
   - External API calls (HTTP, gRPC, message queue)
   - File system operations (read, write, delete)
   - Cache operations (get, set, invalidate)

5. **Analyze existing test coverage (if provided):**
   - Parse coverage report for line-by-line and branch-level coverage
   - Map covered lines to functions/classes
   - Identify: fully covered, partially covered, uncovered functions
   - Identify: tested happy paths, tested error paths, untested paths

**Output:** Complete map of testable surfaces: functions, branches, edge cases, integration points, and current coverage status.

**Quality gate:** Every public function is listed. Branch count is computed for all functions with >1 branch. Edge cases are identified for all functions with parameters. If existing tests are provided, coverage mapping is complete.

---

### Phase 2: PRIORITIZE -- Rank by Risk

**Entry criteria:** Testable surface map is complete.

**Actions:**

1. **Assign risk scores** (see Reference: Risk Scoring Matrix):
   - **Business criticality** (0-3): How important is this function to the product?
     - 3: Revenue path (payment, checkout, billing)
     - 2: Core feature (auth, data retrieval, user operations)
     - 1: Supporting feature (formatting, logging, admin tools)
     - 0: Infrastructure (dev tooling, migrations, scripts)
   - **Complexity** (0-3): How likely is a bug in this code?
     - 3: Cyclomatic complexity >15, many branches, state mutations
     - 2: Complexity 6-15, some branches, moderate logic
     - 1: Complexity 1-5, linear flow, simple logic
     - 0: Trivial (getters, setters, constants)
   - **Change frequency** (0-3): How often does this code change?
     - 3: Changed in >50% of recent PRs
     - 2: Changed monthly
     - 1: Changed quarterly
     - 0: Stable (not changed in >6 months)
   - **Current coverage** (0-3): How tested is it now?
     - 3: 0% coverage (untested)
     - 2: <50% coverage (partially tested)
     - 1: 50-80% coverage (mostly tested)
     - 0: >80% coverage (well tested)

   **Risk score = business_criticality + complexity + change_frequency + current_coverage** (max 12)

2. **Apply the test pyramid to prioritization:**
   - **Unit tests** (base, most tests): test individual functions in isolation
   - **Integration tests** (middle): test module boundaries and data flow
   - **End-to-end tests** (top, fewest): test critical user workflows
   - Prioritize: unit tests for high-complexity functions, integration tests for critical paths, e2e tests only for the top 3-5 user workflows

3. **Order the test plan:**
   - Sort by risk score (highest first)
   - Within the same risk score: prefer error paths over happy paths (errors are more likely untested)
   - Group tests by file/module for efficient development

**Output:** Prioritized test plan: ordered list of tests to write with risk score, test type (unit/integration/e2e), target function, and specific scenarios.

**Quality gate:** Every test in the plan has a risk score. The top 10 entries are all risk score >= 6. The plan follows the test pyramid (more unit tests than integration, more integration than e2e).

---

### Phase 3: GENERATE -- Write Test Cases

**Entry criteria:** Prioritized test plan is ordered.

**Actions:**

1. **For each planned test, generate:**

   a. **Test name**: descriptive, follows `test_<function>_<scenario>_<expected>` convention
   b. **Setup** (Arrange): create necessary objects, mock dependencies, set state
   c. **Action** (Act): call the function under test with specific inputs
   d. **Assertion** (Assert): verify the output AND side effects
   e. **Teardown**: clean up any state (or use fixtures for automatic cleanup)

2. **Apply test generation patterns per test type:**

   **Unit tests:**
   - One test per execution path through the function
   - Mock all external dependencies (database, APIs, file system)
   - Test return values AND side effects (function calls, state changes)
   - Include: happy path, each error path, boundary values, null inputs

   **Integration tests:**
   - Test real interactions between two modules (no mocking the boundary)
   - Use test database (SQLite in-memory or test container)
   - Test the data flow: input -> module A -> module B -> output
   - Include: successful flow, error propagation, transaction rollback

   **Edge case tests:**
   - Apply boundary value analysis (see Reference: Boundary Value Analysis)
   - Apply equivalence partitioning (see Reference: Equivalence Partitioning)
   - Test the exact boundary and one value on each side

   **Error path tests:**
   - Test every exception the function can throw
   - Test every error return value
   - Test resource cleanup on failure (connections closed, locks released, files deleted)
   - Test error message content (useful for debugging)

3. **Generate test fixtures and factories:**
   - Create reusable factory functions for common test objects
   - Create fixture setup/teardown for database state, file system state
   - Use parameterized tests where the same logic is tested with different inputs

4. **Write the test code** in the target framework syntax (pytest, jest, JUnit, etc.):
   - Follow the framework's conventions for file naming, class structure, assertion style
   - Include necessary imports
   - Include comments explaining WHY each test exists (not WHAT it does)

**Output:** Complete test code: test files with all generated tests, fixtures, factories, and mocks.

**Quality gate:** Every test has exactly one assertion focus (may have multiple assert statements, but they all verify one behavior). No test depends on another test's side effects. No test uses `sleep()` or real time delays. All mocks are for external boundaries (not internal functions).

---

### Phase 4: VALIDATE -- Check Test Quality

**Entry criteria:** Test code is generated.

**Actions:**

1. **Independence check:**
   - Can each test run in isolation? (no dependency on test execution order)
   - Does each test set up its own state? (no reliance on shared mutable state)
   - Does each test clean up after itself? (no pollution of other tests)
   - Test for independence: shuffle test order -- all should still pass

2. **Determinism check:**
   - No dependency on current time (use frozen time / clock mocking)
   - No dependency on random values (use seeded random or fixed values)
   - No dependency on file system ordering (directory listing order varies by OS)
   - No dependency on network calls (all external calls mocked)
   - No dependency on global state (singletons, class variables, environment variables)

3. **Speed check:**
   - Unit tests: <100ms each (flag tests that are slower)
   - Integration tests: <2s each (flag tests that are slower)
   - If a test is slow: is it doing I/O that could be mocked? Is it creating excessive test data?

4. **Assertion quality check:**
   - Every test has at least one assertion (no "smoke tests" that just don't crash)
   - Assertions are specific (not `assert result is not None` when you know the exact expected value)
   - Error tests assert the specific error type AND message, not just "an error was thrown"
   - No assertions on implementation details (private methods, internal state)

5. **Mutation testing concepts:**
   - For each test: what mutation would it catch? (what code change would make it fail?)
   - If changing a `>` to `>=` in the source wouldn't fail any test: the boundary is untested
   - If changing a `+` to `-` in the source wouldn't fail any test: the computation is untested
   - Flag tests that would survive obvious mutations (weak tests)

**Output:** Validation report: quality score per test, independence issues, determinism issues, speed issues, assertion quality issues, mutation survival risks.

**Quality gate:** All tests pass the independence check (can run in any order). All tests pass the determinism check (same result on repeated runs). No test takes >5s. Every test would catch at least one meaningful mutation.

---

### Phase 5: REPORT -- Coverage Summary

**Entry criteria:** Tests are generated and validated.

**Actions:**

1. **Calculate coverage projection:**
   - Current line coverage: X%
   - Projected line coverage after adding generated tests: Y%
   - Current branch coverage: X%
   - Projected branch coverage after adding generated tests: Y%
   - Lines/branches that remain uncovered and why (dynamic dispatch, generated code, dead code)

2. **Identify remaining gaps:**
   - Functions still at 0% coverage (if any)
   - Branches still uncovered (with specific line numbers)
   - Error paths still untested
   - Integration boundaries still untested
   - Justify each gap: intentionally skipped (low risk), infeasible to test (requires specific hardware), or deferred (future work)

3. **Maintenance recommendations:**
   - Tests that will likely need updating when source code changes (tightly coupled to implementation)
   - Tests that should be refactored if coverage framework is added (e.g., parameterize manual duplicates)
   - Recommended CI configuration: when to run which tests (unit on every commit, integration on PR, e2e nightly)
   - Coverage thresholds to enforce: recommended minimum per module

4. **Trend tracking (if coverage_history provided):**
   - Coverage change over time: trending up, flat, or declining
   - Modules with declining coverage (code growing faster than tests)
   - Highest ROI testing targets (most risk reduction per test written)

**Output:** Coverage summary: current coverage, projected coverage, remaining gaps, maintenance recommendations, trend analysis.

**Quality gate:** Coverage projections are based on specific tests (not estimates). Every gap has a justification. Maintenance recommendations are actionable (specific files, specific changes).

---

## Exit Criteria

The skill is DONE when:
- Every public function has been cataloged with its branches and edge cases
- Tests are prioritized by risk score with the test pyramid respected
- Generated tests follow the framework conventions and pass quality validation
- Every generated test is independent, deterministic, and has meaningful assertions
- Coverage projection shows specific improvement with remaining gaps justified
- Maintenance recommendations are specific and actionable

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| ANALYZE | Source code is in an unsupported language | **Adjust** -- generate tests in pseudocode with framework-agnostic assertions |
| ANALYZE | Coverage report format not recognized | **Adjust** -- skip coverage mapping, treat all code as uncovered for prioritization |
| PRIORITIZE | Cannot determine business criticality (no domain context) | **Adjust** -- set business criticality to 1 for all, prioritize by complexity and coverage only |
| GENERATE | Function has too many branches for exhaustive testing (>50 paths) | **Adjust** -- test the top 20 paths by risk, note remaining paths as deferred |
| GENERATE | Cannot mock a dependency (e.g., hardware, proprietary SDK) | **Adjust** -- generate integration test stub with TODO for manual setup |
| VALIDATE | Test requires environment not available (database, API key) | **Adjust** -- mark as integration test, add skip decorator with reason |
| REPORT | No existing coverage data for trend analysis | **Adjust** -- establish baseline, skip trend section |

## State Persistence

Between runs, this skill saves:
- **Coverage baseline**: line and branch coverage at time of generation
- **Test inventory**: generated tests mapped to source functions
- **Coverage trend**: coverage percentages over time per module
- **Gap log**: known untested areas with justifications (prevents re-flagging known gaps)

---

## Reference

### Edge Case Catalog

#### Numeric Inputs
```
Zero:               0, 0.0, -0.0
One:                1, -1
Boundaries:         MAX_INT, MIN_INT, MAX_FLOAT, MIN_FLOAT, Infinity, -Infinity, NaN
Precision:          0.1 + 0.2 (floating point), very large numbers, very small numbers
Overflow:           MAX_INT + 1, multiplication of two large numbers
Division:           Division by zero, division by very small number
```

#### String Inputs
```
Empty:              "", " " (whitespace only)
Single char:        "a", " ", "\n", "\0"
Unicode:            "cafe\u0301" (composed vs decomposed), emoji "😀", CJK characters
Injection:          "'; DROP TABLE users; --", "<script>alert('xss')</script>"
Length:             Very long string (10K+ chars), string at max field length
Encoding:           UTF-8 BOM, Latin-1 characters, null bytes within string
```

#### Collection Inputs
```
Empty:              [], {}, set()
Single element:     [1], {"k": "v"}
Duplicates:         [1, 1, 1], keys that hash-collide
Ordering:           Already sorted, reverse sorted, random, single element
Size:               At capacity limit, one over capacity, very large (10K+ elements)
Nested:             [[[]]], deeply nested dicts, circular references
```

#### Time/Date Inputs
```
Epoch:              1970-01-01, Unix timestamp 0
Boundaries:         2038-01-19 (32-bit overflow), year 9999, year 0001
DST transitions:    Spring forward (missing hour), fall back (repeated hour)
Leap year:          Feb 29, Feb 28 in non-leap year
Timezones:          UTC, UTC+14, UTC-12, half-hour offsets (UTC+5:30)
Formats:            ISO 8601, Unix timestamp, locale-specific strings
```

### Boundary Value Analysis

For a function with a boundary at value B:

```
Test these values:
  B - 1:  Just below the boundary (should behave as "before" group)
  B:      Exactly at the boundary (which group does it belong to?)
  B + 1:  Just above the boundary (should behave as "after" group)

Example: discount applies for orders >= $100
  Test $99.99:   No discount (below boundary)
  Test $100.00:  Discount applied (at boundary)
  Test $100.01:  Discount applied (above boundary)

For ranges [A, B]:
  Test A - 1:   Outside range (below)
  Test A:       At lower boundary
  Test A + 1:   Inside range (just above lower)
  Test B - 1:   Inside range (just below upper)
  Test B:       At upper boundary
  Test B + 1:   Outside range (above)
```

### Equivalence Partitioning

Divide input space into groups where all values should produce the same behavior:

```
Example: age validation for a signup form (must be 13-120)

Partition 1: age < 0       → Invalid (negative age)
Partition 2: age 0-12      → Invalid (too young)
Partition 3: age 13-120    → Valid (accepted)
Partition 4: age > 120     → Invalid (unrealistic)
Partition 5: age = null    → Invalid (missing)
Partition 6: age = "abc"   → Invalid (wrong type)

Test one value from each partition:
  age = -1   → expect rejection
  age = 5    → expect rejection
  age = 25   → expect acceptance
  age = 150  → expect rejection
  age = null → expect rejection
  age = "hi" → expect rejection
```

### Test Pyramid Reference

```
                    /\
                   /  \
                  / E2E\           ~5% of tests
                 / (few) \         Slow, brittle, expensive
                /----------\       Test critical user journeys only
               / Integration\      ~15% of tests
              /   (moderate)  \    Test module boundaries
             /------------------\  Real DB, real services, test containers
            /      Unit Tests    \ ~80% of tests
           /       (many, fast)   \Fast, isolated, mock boundaries
          /________________________\Test every function, branch, edge case
```

### Mutation Testing Concepts

```
What mutations to consider for each test:

Arithmetic:     + → -, * → /, += → -=
Comparison:     > → >=, < → <=, == → !=, > → <
Boolean:        && → ||, ! removed, true → false
Return:         return x → return 0, return null, return !x
Boundary:       off-by-one: i < n → i <= n, i > 0 → i >= 0
Null:           Remove null check, return null instead of value
Exception:      Remove try/catch, change exception type

If a test still passes after a mutation: the test is too weak.
The test doesn't actually verify the behavior it claims to test.
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
