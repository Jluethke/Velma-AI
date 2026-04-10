# Test Case Writer

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Takes a skill.md and generates shadow validation test cases. Creates input/output pairs that test happy paths, edge cases, error handling, and quality gate boundaries. Produces a test_cases.json file compatible with the SkillChain shadow validation system. Essential for anyone publishing a skill that needs to pass validation.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ANALYZE    --> Parse the skill and extract testable surfaces
PHASE 2: DESIGN     --> Plan test cases across coverage categories
PHASE 3: GENERATE   --> Write concrete input/output pairs with expected keywords
PHASE 4: VALIDATE   --> Verify test cases are self-consistent and achievable
```

## Inputs

- `skill_md`: string -- The complete contents of the skill.md to generate tests for.
- `test_count`: number (optional) -- Number of test cases to generate (default: 5, min: 3, max: 10).
- `focus_areas`: string[] (optional) -- Specific areas to emphasize: "happy_path", "edge_cases", "error_handling", "quality_gates", "performance".
- `domain_examples`: object[] (optional) -- Real-world examples of the skill's input/output to ground the test cases in reality.

## Outputs

- `test_cases_json`: object -- Complete test_cases.json file with all test cases.
- `coverage_matrix`: object -- Map of which skill sections (phases, gates, error handlers) are covered by which test cases.
- `test_rationale`: object[] -- For each test case: why it exists, what it tests, what failure it would catch.

---

## Execution

### Phase 1: ANALYZE -- Extract Testable Surfaces

**Entry criteria:** A valid skill.md is provided.

**Actions:**

1. Parse the skill into sections: inputs, outputs, phases, quality gates, error handling, exit criteria.
2. For each input, identify its valid range: what types are accepted? What are the boundaries (min/max, empty, null, huge)?
3. For each output, identify what makes it correct: what fields must be present? What values are valid?
4. For each quality gate, identify the pass/fail boundary: what is the minimum condition to pass? What input would cause a gate to fail?
5. For each error handler, identify the trigger condition: what input or state causes this failure mode?
6. List all testable surfaces: each input boundary, each output requirement, each gate boundary, each error trigger. Count them.

**Output:** Testable surface inventory with boundary conditions and trigger conditions.

**Quality gate:** At least 10 testable surfaces identified. Every phase has at least one testable surface. Every quality gate has its pass/fail boundary defined.

---

### Phase 2: DESIGN -- Plan Test Case Coverage

**Entry criteria:** Testable surfaces are cataloged.

**Actions:**

1. Allocate test cases across categories using this distribution:
   - Happy path: 40% of test_count (typical inputs producing expected outputs)
   - Edge cases: 25% (boundary inputs, minimal inputs, maximal inputs)
   - Error handling: 20% (inputs designed to trigger specific failure modes)
   - Quality gate boundaries: 15% (inputs that barely pass or barely fail gates)
   - Round up fractions; minimum 1 per category.

2. For each allocated slot, select the most valuable testable surface to cover:
   - Prioritize surfaces that, if broken, would cause the most user-visible damage.
   - Prioritize surfaces on the critical path (early phases that gate everything downstream).
   - Avoid testing the same surface twice unless it has multiple failure modes.

3. For each test case, define the scenario: a one-sentence description of what is being tested and why.
4. Build the coverage matrix: which testable surfaces are covered, which are not. Flag any uncovered critical surfaces.

**Output:** Test case allocation with scenarios and coverage matrix.

**Quality gate:** Every category has at least one test case. At least 70% of critical testable surfaces (quality gates, error handlers) are covered. No two test cases test the exact same thing.

---

### Phase 3: GENERATE -- Write Concrete Test Cases

**Entry criteria:** Test case scenarios are planned.

**Actions:**

1. For each test case, generate:
   - `id`: sequential string like "tc_001", "tc_002"
   - `name`: short descriptive name (e.g., "happy_path_standard_input", "edge_empty_list", "error_missing_required_field")
   - `category`: one of "happy_path", "edge_case", "error_handling", "quality_gate"
   - `scenario`: one-sentence description of what is being tested
   - `input`: concrete input data that exercises the scenario. Use realistic values, not lorem ipsum.
   - `expected_keywords`: 8-12 keywords that MUST appear in the output if the skill executes correctly. Choose keywords that are specific to the correct output, not generic words.
   - `expected_behavior`: one-sentence description of what should happen (for error cases: what error should be raised)
   - `phase_coverage`: which phases this test case exercises

2. For happy path cases: use typical, representative inputs. Expected keywords should validate that all phases executed and all outputs were produced.
3. For edge cases: use boundary inputs (empty arrays, single-item lists, maximum-length strings, Unicode). Expected keywords should validate graceful handling.
4. For error handling cases: use inputs that trigger specific failure modes from the skill's error handling table. Expected keywords should include the error type or recovery action.
5. For quality gate cases: use inputs that produce outputs right at the gate boundary. Expected keywords should validate that the gate correctly passes or fails.

**Output:** Complete test case array with all fields populated.

**Quality gate:** Every test case has 8-12 expected_keywords. Keywords are specific (not "the", "and", "is"). No two test cases have identical inputs. Every test case references at least one phase.

---

### Phase 4: VALIDATE -- Verify Test Consistency

**Entry criteria:** All test cases are generated.

**Actions:**

1. Cross-check each test case input against the skill's declared input types: does the input match the expected type? If not, the test case is testing the wrong thing.
2. Cross-check expected_keywords against the skill's declared outputs: could the skill plausibly produce text containing these keywords?
3. Verify error handling test cases actually trigger the declared failure modes, not undocumented ones.
4. Check for keyword overlap between test cases: if two test cases have more than 50% keyword overlap, they may be testing the same thing — differentiate or merge.
5. Assemble the final test_cases.json:
   ```json
   {
     "skill_name": "<from skill.md>",
     "version": "1.0.0",
     "test_cases": [ ...all test case objects... ],
     "coverage": { "phases": [...], "gates": [...], "errors": [...] },
     "generated_at": "<ISO timestamp>"
   }
   ```

**Output:** Validated test_cases.json and final coverage matrix.

**Quality gate:** All test case inputs match declared input types. No keyword overlap exceeds 50% between cases. Every error handling test case maps to a declared failure mode.

---

## Exit Criteria

The skill is DONE when:
- test_cases.json is generated with the requested number of test cases
- All four categories are represented (happy path, edge, error, quality gate)
- Every test case has 8-12 specific expected_keywords
- Coverage matrix shows at least 70% of critical surfaces covered
- Test cases are self-consistent (inputs match types, keywords are plausible)

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| ANALYZE | Skill.md has no quality gates or error handling sections | **Adjust** -- generate tests for phases and inputs/outputs only, note the missing sections in the coverage report |
| ANALYZE | Skill.md is too short to extract testable surfaces (< 20 lines) | **Abort** -- the skill needs more structure before tests can be written. Suggest using skill-improver first |
| DESIGN | Not enough testable surfaces for the requested test_count | **Adjust** -- reduce test_count to match available surfaces and note the limitation |
| GENERATE | Cannot create realistic input data for a skill domain (e.g., requires real API responses) | **Adjust** -- use synthetic but structurally valid data, mark the test case as "needs real data validation" |
| VALIDATE | Keyword overlap exceeds 50% on more than half the test cases | **Retry** -- return to Phase 3 and regenerate with more diverse scenarios |
| VALIDATE | User rejects final output | **Targeted revision** -- ask which test case's inputs, expected keywords, or category assignment fell short and rerun only that test case's Phase 3-4. Do not regenerate the full test suite. |

---

## Reference

### Test Case Category Distribution

| Category | Allocation | Purpose |
|---|---|---|
| Happy path | 40% of test_count | Typical inputs, all phases execute, all outputs produced |
| Edge cases | 25% | Boundary inputs (empty, minimal, maximal, Unicode) |
| Error handling | 20% | Inputs that trigger specific failure modes in the error table |
| Quality gate | 15% | Inputs that barely pass or barely fail a defined gate |

Minimum 1 test case per category regardless of test_count.

### Expected Keywords Quality Rules

- Minimum 8, maximum 12 keywords per test case
- Keywords must be specific to the correct output (not generic words like "the", "and", "is")
- No two test cases may share more than 50% keyword overlap
- Error handling test cases: keywords should include the error type or recovery action
- Happy path test cases: keywords should validate all phases executed and all outputs are present

### Coverage Target

At least 70% of critical testable surfaces (quality gates and error handlers) must be covered by at least one test case. Document uncovered surfaces in the coverage matrix.

### Test Case JSON Structure

```json
{
  "id": "tc_001",
  "name": "happy_path_standard_input",
  "category": "happy_path",
  "scenario": "One-sentence description of what is being tested",
  "input": { /* realistic, concrete input data */ },
  "expected_keywords": ["keyword1", "keyword2", ...],
  "expected_behavior": "One sentence: what should happen",
  "phase_coverage": ["PHASE_1", "PHASE_2", ...]
}
```

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
