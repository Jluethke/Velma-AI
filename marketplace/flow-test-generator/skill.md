# Flow Test Generator

Analyzes a FlowFabric flow definition (flow.md + manifest.json), extracts its execution phases, inputs, outputs, and quality gates, then generates comprehensive test cases that cover all phases, edge cases, and error handling paths, validates test coverage, and predicts shadow validation success probability.

## Execution Pattern: Phase Pipeline

## Inputs
- skill_md_content: string -- Full text content of the flow.md file to generate tests for
- manifest_json: object -- The flow's manifest.json (name, inputs, outputs, execution_pattern, domain)
- existing_tests: array -- Any existing test cases (optional, for gap analysis)

## Outputs
- test_cases: array -- Generated test cases in SkillChain format [{input, expected_keywords}]
- coverage_report: object -- Analysis of which phases, inputs, outputs, and error paths are tested
- validation_prediction: object -- Predicted shadow validation success probability with rationale

## Execution

### Phase 1: ANALYZE -- Extract Flow Structure
**Entry criteria:** flow.md content is provided and non-empty.
**Actions:**
1. Parse the flow.md to extract:
   - **Execution pattern:** ORPA or Phase Pipeline
   - **Phase names and descriptions:** What each phase does
   - **Inputs:** All declared inputs with types and constraints
   - **Outputs:** All declared outputs with descriptions
   - **Quality gates:** Conditions between phases
   - **Exit criteria:** What defines completion
   - **Error handling:** Failure modes and responses per phase
   - **Reference section:** Domain knowledge the flow draws on
2. From the manifest, extract:
   - Domain, tags, input/output field names
   - Execution pattern (cross-validate with flow.md declaration)
3. Build a "testable behavior map":
   - For each phase: what specific actions should produce what specific outputs?
   - For each quality gate: what condition must be verified?
   - For each error handler: what failure should be simulated?
4. Identify the flow's "core competency" -- the primary thing it does that must be tested most rigorously.

**Output:** Structured flow anatomy: phases with actions/outputs, quality gates, error handlers, core competency identification.
**Quality gate:** Every phase in the flow.md is identified and extracted. At least one testable behavior per phase is identified. The execution pattern matches between manifest and flow.md.

### Phase 2: GENERATE -- Create Test Cases
**Entry criteria:** Flow anatomy extracted with testable behaviors identified.
**Actions:**
1. Generate one test case per execution phase (minimum coverage):
   - **Phase-specific test:** Input that exercises a specific phase's logic. Expected keywords should be unique to that phase's output.
   - Example: For an OBSERVE phase that gathers metrics, the test input should ask about data gathering, and expected keywords should include metric-specific terms.
2. Generate one edge case test:
   - **Minimal input:** What happens with the absolute minimum viable input? (Tests whether the flow handles sparse data gracefully.)
   - **Adversarial input:** What happens with inputs that are technically valid but unusual? (Tests robustness.)
3. Generate one integration test:
   - **Full pipeline test:** Input that exercises all phases end-to-end. Expected keywords should span multiple phases.
4. For each generated test case:
   - **Input:** A natural-language prompt that a user would realistically ask this flow.
   - **Expected keywords:** 6-12 terms that must appear in a correct response. Guidelines:
     - Include domain-specific terms (not generic words like "good" or "important")
     - Include action verbs from the flow's defined actions ("classify," "score," "calculate")
     - Include output-specific terms (column names, metric names, framework names from the Reference section)
     - Avoid overly broad keywords that would appear in any response on the topic
     - Include at least 2 keywords unique to the correct execution path (wouldn't appear if the flow skipped phases)
5. Generate at minimum 5 test cases total. More for complex flows (1 per phase + 1 edge + 1 integration as minimum).

**Output:** Array of test cases in SkillChain format: [{input: string, expected_keywords: string[]}].
**Quality gate:** At least 5 test cases generated. Every execution phase is covered by at least one test. At least one edge case test exists. Expected keywords are specific (not generic). No two tests have identical expected keywords.

### Phase 3: VALIDATE -- Check Coverage
**Entry criteria:** Test cases generated.
**Actions:**
1. Build a coverage matrix:
   - Rows: execution phases, quality gates, error handlers, inputs, outputs
   - Columns: test cases
   - Cells: "covered" if the test case exercises that element
2. Identify gaps:
   - Any phase with no test coverage = critical gap
   - Any declared output not verified by any test = moderate gap
   - Any error handler not tested = minor gap (but important for robustness)
   - Quality gates with no test = moderate gap
3. Check for test quality issues:
   - **Too-broad keywords:** Keywords that would match any response on the topic (false positives)
   - **Too-narrow keywords:** Keywords that require exact phrasing (false negatives due to synonym variation)
   - **Insufficient keywords:** Fewer than 6 keywords per test (low discrimination power)
   - **Duplicate tests:** Two tests that are functionally identical (waste)
4. If existing tests are provided: merge and deduplicate, checking whether existing tests already cover any of the identified behaviors.
5. Calculate overall coverage score: (covered elements / total testable elements) x 100%.

**Output:** Coverage matrix, gap list ranked by severity, test quality issues, overall coverage score.
**Quality gate:** Coverage score is calculated. All critical gaps are identified. No test has fewer than 6 expected keywords.

### Phase 4: SCORE -- Predict Validation Success
**Entry criteria:** Coverage analysis complete.
**Actions:**
1. Evaluate flow quality factors that predict shadow validation success:
   - **Execution clarity (0-25 pts):** Are phases specific and actionable? Vague phases = inconsistent outputs = validation failure.
   - **Output definition (0-25 pts):** Are outputs concrete and typed? "A report" = 5 pts. "A JSON object with severity-ranked findings including file paths and line numbers" = 25 pts.
   - **Quality gates (0-20 pts):** Do quality gates exist between phases with testable conditions? No gates = 0. Vague gates = 10. Specific testable gates = 20.
   - **Error handling (0-15 pts):** Are failure modes defined with specific responses? None = 0. Generic = 7. Phase-specific with actions = 15.
   - **Reference depth (0-15 pts):** Does the reference section contain actionable domain knowledge? Empty = 0. Lists = 7. Frameworks, formulas, checklists = 15.
2. Calculate predicted success probability:
   - Score 0-40: <30% validation success (flow needs major rework)
   - Score 41-60: 30-50% success (flow needs improvement in weakest areas)
   - Score 61-75: 50-70% success (solid flow, minor improvements recommended)
   - Score 76-90: 70-85% success (well-structured flow)
   - Score 91-100: 85-95% success (excellent flow, high confidence)
3. Generate specific improvement recommendations for the lowest-scoring factors.

**Output:** Flow quality score breakdown, predicted validation success %, specific improvement recommendations.
**Quality gate:** Score breakdown covers all 5 factors. Prediction is accompanied by rationale. At least 2 improvement recommendations are provided if score < 80.

### Phase 5: OUTPUT -- Deliver Test Suite
**Entry criteria:** Tests generated, coverage validated, prediction scored.
**Actions:**
1. Format the final test_cases.json array for SkillChain compatibility:
   ```json
   [
     {"input": "...", "expected_keywords": ["...", "..."]},
     ...
   ]
   ```
2. Include the coverage report as a separate deliverable.
3. Include the validation prediction with improvement recommendations.
4. If existing tests were provided: highlight which new tests were added and which existing tests were kept/modified/removed.

**Output:** Final test_cases.json content, coverage report, validation prediction with recommendations.
**Quality gate:** test_cases.json is valid JSON. All tests have both "input" and "expected_keywords" fields. Total test count is >= 5.

## Exit Criteria
Complete when: (1) at least 5 test cases are generated in valid SkillChain format, (2) coverage report shows no critical gaps, (3) validation prediction is delivered with score and recommendations.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ANALYZE | flow.md is malformed or doesn't follow execution standard | Adjust -- extract what's possible, flag structural issues as part of quality scoring |
| ANALYZE | No execution phases defined | Abort -- cannot generate meaningful tests without defined execution phases |
| GENERATE | Domain is unfamiliar (cannot generate realistic inputs) | Adjust -- generate generic structural tests (phase coverage) and flag for domain expert review |
| VALIDATE | Coverage score below 50% | Retry -- generate additional test cases targeting uncovered elements |
| SCORE | Insufficient data for prediction (very short flow.md) | Adjust -- provide prediction with high uncertainty range, note limited confidence |
| SCORE | User rejects final output | **Targeted revision** -- ask which test case, phase coverage gap, or validation scenario fell short and regenerate only that section. Do not regenerate the full test suite. |

## Reference

### Test Case Design Principles
1. **One behavior per test:** Each test case should target a specific phase or behavior. Tests that try to validate everything validate nothing well.
2. **Realistic inputs:** Test inputs should sound like real user prompts, not synthetic test data. This tests the flow as it will actually be used.
3. **Discriminating keywords:** The best expected keywords are terms that would ONLY appear in a correct, complete response. Generic terms pass bad responses too.
4. **Edge cases matter:** The difference between a good flow and a great flow is how it handles unusual inputs, missing data, and error conditions.
5. **The 5-test minimum:** At least one test per execution pattern cycle/phase, one edge case, one integration test.

### Expected Keywords Selection Heuristics
- **Include:** Domain-specific nouns (framework names, metric names, formula names)
- **Include:** Action verbs from the flow's defined actions ("classify," "rank," "calculate," "generate")
- **Include:** Output structure terms (column headers, section names the output should contain)
- **Exclude:** Common adjectives ("good," "important," "effective") -- these appear in any response
- **Exclude:** The input's own words reflected back -- tests should verify new content, not echoing
- **Target:** 8-12 keywords per test for optimal discrimination (fewer = too lenient, more = too strict)

### Shadow Validation Mechanics
Shadow validation runs a flow 5 times with the same input and checks:
1. **Consistency:** Do all 5 runs produce outputs containing the same expected keywords?
2. **Completeness:** Do outputs cover all expected keywords (not just a subset)?
3. **Correctness:** Are the keywords contextually appropriate (not just mentioned in passing)?

Flows fail shadow validation primarily because:
- Vague phases produce different outputs on each run
- Missing quality gates allow garbage to propagate
- Undefined exit criteria mean the flow sometimes stops early
- No error handling means unexpected inputs produce crashes or empty outputs

### Coverage Categories
- **Phase coverage:** Every execution phase is exercised by at least one test
- **Input coverage:** Every declared input type is used in at least one test
- **Output coverage:** Every declared output is verified by at least one test's keywords
- **Error coverage:** At least one error handling path is tested
- **Edge coverage:** At least one test uses minimal, boundary, or unusual inputs

### State Persistence
Accumulates over time:
- Test patterns that correlate with high shadow validation success
- Domain-specific keyword effectiveness (which keywords discriminate well)
- Common coverage gaps by flow domain
- Prediction accuracy (predicted vs actual validation outcomes)
