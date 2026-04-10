# API Test Generator

**One-line description:** Converts an OpenAPI/Swagger specification into a comprehensive integration test suite covering happy paths, edge cases, error scenarios, and load patterns.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `openapi_spec` (string, required): OpenAPI 3.0 or Swagger 2.0 specification in JSON or YAML format
- `test_framework` (string, optional, default: "pytest"): Target testing framework (pytest, jest, mocha, postman, or generic)
- `include_load_tests` (boolean, optional, default: true): Whether to generate load/performance test scenarios
- `include_auth_tests` (boolean, optional, default: true): Whether to generate authentication and authorization test cases
- `include_security_tests` (boolean, optional, default: true): Whether to generate security vulnerability test cases (SQL injection, XSS, CSRF, etc.)
- `custom_edge_cases` (array of strings, optional): Domain-specific edge cases to include (e.g., "timezone handling", "unicode characters")
- `output_format` (string, optional, default: "code"): Output format (code, markdown, json, or postman-collection)
- `performance_sla_ms` (integer, optional, default: 5000): Expected response time threshold in milliseconds for performance assertions

## Outputs

- `test_suite` (object): Structured test suite with metadata
  - `summary` (object): Test counts by category (happy_path, edge_cases, error_paths, security_tests, load_tests)
  - `test_cases` (array of objects): Individual test cases with id, name, phase, endpoint, method, inputs, expected_output, assertions
  - `test_dependencies` (array of objects): Ordered test sequences where later tests depend on outputs of earlier tests (e.g., POST before GET)
- `test_code` (string): Executable test code in the specified framework, syntactically valid and runnable without modification
- `test_documentation` (string): Human-readable test plan with coverage matrix, test execution order, and setup/teardown requirements
- `coverage_report` (object): Endpoint coverage %, parameter coverage %, error code coverage %, security test coverage %, gaps and recommendations

---

## Execution Phases

### Phase 1: Parse and Validate Specification

**Entry Criteria:**
- OpenAPI specification file is provided and accessible
- File format is valid JSON or YAML

**Actions:**
1. Parse the OpenAPI specification (JSON or YAML) using a schema-aware parser
2. Validate against OpenAPI 3.0 or Swagger 2.0 schema; collect all validation errors
3. Extract base URL, schemes, and global parameters; flag if base URL is missing or a placeholder
4. Verify all endpoints have required fields: path, HTTP method, and at least one response definition with status code and schema
5. For each endpoint, verify response definitions include status code, content type, and response schema (or note as missing)
6. Extract security schemes (API key, OAuth 2.0, Bearer token, Basic auth) and map to endpoints

**Output:**
- Validated specification object (parsed and normalized)
- List of validation errors (if any) and warnings (deprecated fields, missing descriptions, missing examples)
- Base URL and authentication scheme metadata
- Specification metadata: OpenAPI version, endpoint count, parameter count, error code count

**Quality Gate:**
Specification is valid and parseable, verified by: (1) no critical parsing errors, (2) all endpoints have path, method, and at least one response with status code, (3) base URL is present (or documented as placeholder), (4) security schemes are identified for all protected endpoints. If any gate fails, phase exits with Abort.

---

### Phase 2: Extract Endpoint Metadata and Detect Dependencies

**Entry Criteria:**
- Specification is validated
- No critical parsing errors

**Actions:**
1. Enumerate all endpoints: for each path and HTTP method combination, create an endpoint record
2. For each endpoint, extract: path, HTTP method, operationId, description, parameters (path, query, header, body)
3. Extract response definitions: status codes, content types, response schemas, and required fields
4. Identify authentication requirements: for each endpoint, determine which security scheme(s) apply
5. Extract rate limiting, timeout, or other constraints from specification or x-* extensions; use defaults if missing
6. Build parameter matrix: for each parameter, record name, type, required/optional flag, validation rules (min, max, pattern, enum), and examples
7. Detect data dependencies: identify cases where an endpoint's response field is used as input to another endpoint (e.g., POST /users returns id, GET /users/{id} requires id). Record as ordered test sequence.

**Output:**
- Endpoint registry (array of endpoint objects with all metadata)
- Parameter matrix (map of parameter name → type, constraints, examples, required flag)
- Authentication matrix (endpoint → security scheme)
- Constraints registry (rate limits, timeouts, documented SLAs)
- Dependency graph (array of test sequences: [POST /users, GET /users/{id}, PATCH /users/{id}, DELETE /users/{id}])

**Quality Gate:**
Every endpoint has: (1) path and HTTP method, (2) at least one response definition with status code, (3) parameter matrix entry for all parameters with type and required flag, (4) authentication scheme identified (or marked as public). Dependency graph is acyclic and complete. Verified by: endpoint count matches specification, no missing parameters, no circular dependencies.

---

### Phase 3: Generate Happy-Path Test Scenarios

**Entry Criteria:**
- Endpoint metadata is extracted
- Parameter matrix is complete
- Dependency graph is available

**Actions:**
1. For each endpoint, construct a valid request using required parameters and example values from specification
2. If specification provides examples, use them; otherwise, generate realistic defaults using this algorithm:
   - string: non-empty alphanumeric (e.g., "test-value")
   - integer: positive value within documented range, or 1 if unbounded
   - number: positive decimal within documented range, or 1.0 if unbounded
   - boolean: true
   - array: single-element array with valid element
   - object: object with all required fields populated
   - date-time: current UTC timestamp in ISO 8601 format
   - email: valid format (e.g., "test@example.com")
3. For each endpoint, identify the expected success response: typically 2xx status code (200, 201, 204, or documented success code)
4. Define assertions: (a) response status code matches expected, (b) response schema validates against specification, (c) all required fields present in response
5. Order happy-path tests by dependency graph: if endpoint B depends on endpoint A, test A before B
6. For dependent tests, extract output from A and inject into B's input

**Output:**
- Happy-path test cases (array): one per endpoint, ordered by dependency, with valid inputs and expected 2xx response
- Test setup/teardown requirements (e.g., create resource before testing GET)
- Test count: number of happy-path scenarios
- Dependency-ordered test sequence (list of test IDs in execution order)

**Quality Gate:**
Every endpoint has at least one happy-path test. All happy-path tests use valid, realistic inputs verified by: (1) inputs match parameter types and constraints, (2) examples are from specification or generated by documented algorithm, (3) expected responses match specification success codes. Dependency order is correct: if test B depends on test A, A appears before B in sequence.

---

### Phase 4: Generate Edge-Case and Boundary Test Scenarios

**Entry Criteria:**
- Happy-path tests are defined
- Parameter matrix includes type and constraint information

**Actions:**
1. For each parameter with constraints, generate boundary test cases:
   - **Numeric (integer, number):** minimum value, maximum value, zero, negative (if allowed), decimal precision edge (for numbers)
   - **String:** empty string, minimum length (if specified), maximum length (if specified), special characters (!, @, #, $, %, &), unicode characters (emoji, CJK), whitespace-only
   - **Array:** empty array, single element, maximum size (if specified)
   - **Date-time:** epoch (1970-01-01T00:00:00Z), far future (2099-12-31T23:59:59Z), timezone edge cases (UTC, +12:00, -12:00)
   - **Enum:** all documented enum values
2. For each endpoint with optional parameters, generate test cases for parameter combinations: all present, all absent, each subset of 1-3 optional parameters
3. For endpoints with body parameters, generate tests with: (a) missing required fields, (b) extra undocumented fields, (c) null values for optional fields
4. For endpoints with path parameters, generate tests with: (a) special characters in path, (b) unicode in path, (c) very long path values
5. Add custom edge cases from `custom_edge_cases` input
6. Limit edge-case tests to 3-5 per parameter to avoid explosion; prioritize boundary values over combinations

**Output:**
- Edge-case test cases (array): organized by parameter and boundary type, with inputs and expected behavior (success or specific error)
- Test count: number of edge-case scenarios
- Coverage matrix: parameter → edge cases covered (boundary values, optional combinations, special characters)

**Quality Gate:**
Every parameter with documented constraints has at least one boundary test. Edge cases are specific and testable, verified by: (1) each test case has concrete input values (not "various values"), (2) expected behavior is documented (success or specific error code), (3) no duplicate test cases, (4) total edge-case count is reasonable (< 100 for typical API).

---

### Phase 5: Generate Error-Path and Security Test Scenarios

**Entry Criteria:**
- Endpoint metadata includes documented error responses
- Parameter matrix is complete
- Security schemes are identified

**Actions:**

**Error-Path Tests:**
1. For each documented error response (4xx, 5xx), create a test case that triggers it:
   - **400 Bad Request:** malformed JSON body, missing required parameter, invalid parameter type (e.g., string where number expected), invalid enum value
   - **401 Unauthorized:** missing authentication token, invalid/expired token, wrong token type
   - **403 Forbidden:** valid auth but insufficient permissions (if documented in specification)
   - **404 Not Found:** non-existent resource ID (use ID that doesn't exist, e.g., 999999)
   - **409 Conflict:** duplicate resource (if endpoint creates resources), state conflict (if documented)
   - **429 Too Many Requests:** rate limit exceeded (if rate limiting is documented; generate N+1 requests where N is documented limit)
   - **500 Internal Server Error:** document as unrecoverable; do not generate test (note as assumption)
2. For authentication-required endpoints, generate tests for: missing token, invalid token, expired token (if applicable), insufficient scope (if OAuth 2.0)
3. For endpoints with body parameters, generate tests with: (a) malformed JSON (missing closing brace), (b) missing required fields, (c) invalid field types
4. For endpoints with path parameters, generate tests with: (a) non-existent resource ID, (b) invalid ID format (e.g., non-numeric where numeric expected)

**Security Tests (if include_security_tests is true):**
1. **SQL Injection:** for string parameters, inject SQL payloads (e.g., "' OR '1'='1", "admin'--") and verify API returns 400 or sanitizes input
2. **XSS (Cross-Site Scripting):** for string parameters, inject script payloads (e.g., "<script>alert('xss')</script>") and verify API returns 400 or escapes output
3. **CSRF (Cross-Site Request Forgery):** for state-changing endpoints (POST, PUT, DELETE), verify API requires CSRF token or uses SameSite cookies (if documented)
4. **Broken Authentication:** test with invalid credentials, expired tokens, missing auth headers
5. **Sensitive Data Exposure:** verify API does not return sensitive data (passwords, tokens, PII) in responses or logs
6. **Insecure Deserialization:** for endpoints accepting JSON, inject serialized objects and verify API doesn't deserialize untrusted data
7. **Rate Limiting:** verify API enforces rate limits and returns 429 when exceeded

**Output:**
- Error-path test cases (array): organized by error code, with inputs that trigger each error and expected error response
- Security test cases (array): organized by vulnerability type, with payloads and expected safe behavior
- Test count: number of error and security scenarios
- Error coverage matrix: error code → test case
- Security coverage matrix: vulnerability type → test case

**Quality Gate:**
Every documented error code has at least one test case. Security tests cover at least 5 of 7 vulnerability types (if include_security_tests is true). Error-triggering inputs are specific and testable, verified by: (1) each test has concrete input values, (2) expected error code is documented, (3) error message structure is validated (if applicable), (4) security payloads are standard (OWASP Top 10).

---

### Phase 6: Generate Load and Performance Test Scenarios

**Entry Criteria:**
- `include_load_tests` is true
- Endpoint metadata is available
- Performance SLA is specified (from input or default 5000 ms)

**Actions:**
1. For each endpoint, define load test scenarios:
   - **Concurrent requests:** 10, 50, 100 simultaneous requests with valid inputs
   - **High-volume data:** maximum-size payloads (e.g., max-length strings, large arrays), large request bodies
   - **Sustained load:** requests over 1-5 minute period at constant rate (e.g., 10 requests/second)
2. Identify endpoints likely to be slow or resource-intensive (e.g., search, export, report generation, bulk operations). For these, define stricter performance assertions.
3. For each load test, define performance assertions:
   - **Response time:** p50 < performance_sla_ms, p95 < performance_sla_ms * 1.5, p99 < performance_sla_ms * 2
   - **Error rate:** < 1% of requests fail
   - **Throughput:** minimum requests/second (if documented)
4. If rate limiting is documented, define a test that respects limits and measures throughput under rate-limited conditions
5. Define resource cleanup tests: after load test, delete or reset created resources
6. For endpoints with dependencies, generate load tests on the full sequence (e.g., POST then GET in parallel)

**Output:**
- Load-test scenarios (array): concurrent, high-volume, sustained load, with performance assertions
- Performance assertions (object): response time thresholds (p50, p95, p99), error rate threshold, throughput targets
- Test count: number of load scenarios
- Cleanup procedures (steps to reset state after load tests)

**Quality Gate:**
Load tests are realistic and safe, verified by: (1) concurrent request counts are reasonable (10-100, not 10000), (2) performance thresholds are based on documented SLA or conservative default (5 seconds), (3) error rate threshold is < 1%, (4) cleanup steps are defined and executable, (5) rate limits are respected (if documented).

---

### Phase 7: Compile Test Suite and Generate Code

**Entry Criteria:**
- All test scenarios (happy path, edge cases, error paths, security tests, load tests) are generated
- Test framework is specified and supported

**Actions:**
1. Organize all test cases into a structured test suite:
   - Group by endpoint
   - Order by phase: happy path → edge cases → error paths → security tests → load tests
   - Order within each phase by dependency graph (dependent tests after their dependencies)
   - Assign unique test IDs (e.g., "test_post_users_happy_path", "test_get_users_id_edge_case_empty_string")
2. Define test dependencies and ordering: if test B requires output from test A, mark B as dependent on A and ensure A runs first
3. Generate test code in the specified framework:
   - **pytest:** test functions with fixtures for setup/teardown, parametrized tests for edge cases, assertions using assert statements
   - **jest:** test suites with describe/it blocks, beforeEach/afterEach hooks, async/await for async endpoints
   - **mocha:** test suites with describe/it blocks, hooks, assertions using chai or similar
   - **postman:** collection with requests, tests (assertions), environment variables for base URL and auth tokens
   - **generic:** JSON or YAML test definition with test name, endpoint, method, inputs, expected outputs, assertions
4. Add setup/teardown code: (a) initialize base URL and headers, (b) authenticate (obtain token, set API key), (c) create test data if needed, (d) cleanup after tests
5. Add assertions and error handling: (a) assert response status code, (b) assert response schema, (c) assert required fields, (d) catch and report assertion failures
6. Generate a test execution plan: (a) order of test execution, (b) which tests can run in parallel, (c) skip conditions (e.g., skip load tests if performance_sla_ms is not set)
7. If generated code exceeds 500 lines, split into multiple files by endpoint or test type (happy_path.py, edge_cases.py, error_paths.py, security.py, load.py)

**Output:**
- Test suite object (JSON): all test cases with metadata, dependencies, and execution order
- Test code (string): executable test file(s) in specified framework, syntactically valid and runnable without modification
- Test execution plan (string): documentation on how to run tests (full suite, specific test groups, individual tests), parallelization strategy, skip conditions

**Quality Gate:**
Generated code is syntactically valid and executable, verified by: (1) code parses without syntax errors, (2) all test cases are represented in code, (3) setup/teardown is correct and runs before/after tests, (4) assertions are present and testable, (5) code can be executed without manual edits (e.g., no placeholder values like "YOUR_API_KEY"), (6) if split into multiple files, imports and dependencies are correct.

---

### Phase 8: Generate Documentation and Coverage Report

**Entry Criteria:**
- Test suite is compiled
- Test code is generated

**Actions:**
1. Generate a test plan document:
   - Overview: test scope, strategy, and coverage goals
   - Test case matrix: endpoint × test type (happy path, edge case, error, security, load) with test ID and description
   - Coverage summary: % of endpoints tested (count of endpoints with tests / total endpoints), % of parameters tested, % of error codes tested, % of security vulnerabilities tested
   - Test execution order and dependencies
2. Generate a coverage report:
   - Endpoint coverage: list of endpoints with tests, list of endpoints without tests
   - Parameter coverage: list of parameters tested, list of parameters not tested (with reason)
   - Error code coverage: list of error codes tested, list of error codes not tested
   - Security coverage: list of vulnerability types tested, list of vulnerability types not tested
   - Gaps and recommendations: specific suggestions for improving coverage (e.g., "Add tests for rate limiting", "Add XSS tests for search parameter")
3. Generate a test execution guide:
   - Prerequisites: dependencies (requests library, pytest, etc.), environment setup (base URL, API key, etc.)
   - How to run: full suite, specific test groups (happy path only, security tests only), individual tests
   - How to interpret results: what pass/fail means, how to debug failures
   - How to add new tests: template for adding new test cases, how to update coverage report
   - Performance baseline: expected response times and throughput (from Phase 6)

**Output:**
- Test documentation (string): markdown or HTML with test plan, execution guide, and coverage matrix
- Coverage report (object): coverage percentages (endpoints %, parameters %, error codes %, security %), gaps, and recommendations
- Execution guide (string): step-by-step instructions for running tests and interpreting results

**Quality Gate:**
Documentation is clear and actionable, verified by: (1) test plan is understandable to a developer unfamiliar with the API, (2) coverage report is accurate (counts match test suite), (3) execution guide includes all prerequisites and steps, (4) gaps are specific and actionable (not "improve coverage"), (5) performance baselines are documented.

---

## Exit Criteria

The skill is DONE when:
1. OpenAPI specification is parsed and validated without critical errors
2. All endpoints are extracted and documented with metadata (path, method, parameters, responses, auth)
3. Data dependencies between endpoints are detected and documented
4. Happy-path test cases cover every endpoint, ordered by dependency
5. Edge-case tests cover parameter boundaries (min, max, empty, special characters, unicode) and optional parameter combinations
6. Error-path tests cover all documented error codes (400, 401, 403, 404, 409, 429)
7. Security tests cover at least 5 of 7 vulnerability types (SQL injection, XSS, CSRF, broken auth, sensitive data, insecure deserialization, rate limiting) if include_security_tests is true
8. Load-test scenarios are generated with performance assertions (p50, p95, p99 response times, error rate < 1%) if include_load_tests is true
9. Test code is generated in the specified framework and is syntactically valid and executable without manual modification
10. Test documentation and coverage report are complete with coverage percentages and gap analysis
11. A developer can run the generated tests without manual edits and understand results

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | OpenAPI specification is invalid or unparseable (JSON/YAML syntax error, missing required fields) | **Abort** -- return specific validation errors (line number, field name, expected format) and ask for corrected specification |
| Phase 1 | Specification is missing base URL or endpoints (no paths defined) | **Adjust** -- document missing information, use placeholder base URL (e.g., "https://api.example.com"), ask user to provide correct URL |
| Phase 2 | Endpoint has no response definitions | **Adjust** -- generate generic 200 OK response with empty body; flag as assumption in documentation |
| Phase 2 | Parameter has no type information | **Adjust** -- infer type from example (if provided) or default to string; flag as assumption in documentation |
| Phase 3 | No example values provided for parameters | **Adjust** -- generate realistic defaults using documented algorithm (string: "test-value", integer: 1, etc.); flag as assumption |
| Phase 4 | Parameter constraints are ambiguous or missing (no min/max for numeric, no length for string) | **Adjust** -- use standard boundaries (string: 0-255 chars, integer: -2^31 to 2^31, array: 0-100 elements); flag as assumption |
| Phase 5 | Error responses are not documented in specification | **Adjust** -- generate tests for common HTTP errors (400, 401, 404, 500); flag as assumption |
| Phase 5 | Security schemes are not documented | **Adjust** -- assume public endpoints; skip auth tests; flag as assumption |
| Phase 6 | Performance thresholds are not specified | **Adjust** -- use conservative default (response time < 5000 ms, error rate < 1%); flag as assumption |
| Phase 7 | Test framework is unsupported (not pytest, jest, mocha, postman, or generic) | **Abort** -- list supported frameworks and ask user to choose |
| Phase 7 | Generated code exceeds 500 lines | **Adjust** -- split into multiple test files by endpoint or test type (happy_path.py, edge_cases.py, error_paths.py, security.py, load.py); document file structure |
| Phase 7 | Generated code has syntax errors | **Abort** -- return specific syntax errors and regenerate code |
| ACT | User rejects the generated test suite or requests significant changes | **Adjust** -- incorporate specific feedback (e.g., different edge cases, additional security tests, revised performance thresholds) and regenerate the affected test categories; do not restart from Phase 1 unless the OpenAPI specification itself was wrong |
| ACT | User rejects final output | **Targeted revision** -- ask which test category, endpoint, or edge case fell short and regenerate only that section. Do not regenerate the full test suite. |

---

## Reference Section

### Domain Knowledge: API Testing Strategy

**Happy-Path Testing:**
- Tests the "golden path" where all inputs are valid and the API behaves as documented
- Validates that the API returns the correct response structure and status code
- Typically one test per endpoint, ordered by dependency
- Example: POST /users with valid name and email, expect 201 Created with user ID

**Edge-Case Testing:**
- Tests boundary conditions and unusual but valid inputs
- Examples: empty strings, maximum-length strings, zero values, null values, empty arrays, unicode characters
- Ensures the API handles edge cases gracefully without crashing or returning incorrect data
- Limit to 3-5 edge cases per parameter to avoid test explosion

**Error-Path Testing:**
- Tests invalid inputs and error conditions
- Validates that the API returns the correct error code and error message
- Examples: missing required parameters, invalid types, unauthorized access, resource not found
- Critical for security and reliability
- Cover all documented error codes (400, 401, 403, 404, 409, 429)

**Security Testing:**
- Tests for common API vulnerabilities (OWASP Top 10)
- Examples: SQL injection, XSS, CSRF, broken authentication, sensitive data exposure, insecure deserialization, rate limiting
- Validates that API sanitizes inputs and enforces security controls
- Use standard payloads (e.g., "' OR '1'='1" for SQL injection)

**Load Testing:**
- Tests the API under high concurrency or high-volume data
- Validates performance, stability, and resource usage
- Identifies bottlenecks and capacity limits
- Measure response time percentiles (p50, p95, p99), error rate, and throughput

### OpenAPI Parameter Types and Boundaries

| Type | Boundary Tests | Examples |
|---|---|---|
| string | empty, max length, min length, special chars, unicode | "", "a"*255, "@#$%", "你好" |
| integer | min, max, zero, negative | -2147483648, 0, 2147483647 |
| number | min, max, zero, decimal precision | 0.0, 1.5, 1e10 |
| boolean | true, false | true, false |
| array | empty, single element, max size | [], [1], [1,2,...,100] |
| object | empty, required fields, extra fields | {}, {"id": 1}, {"id": 1, "extra": "field"} |
| date-time | epoch, far future, timezone | 1970-01-01T00:00:00Z, 2099-12-31T23:59:59Z |

### Common HTTP Error Codes and Triggers

| Code | Meaning | Test Trigger |
|---|---|---|
| 400 | Bad Request | Malformed JSON, missing required param, invalid type, invalid enum value |
| 401 | Unauthorized | Missing or invalid auth token, expired token |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Non-existent resource ID (e.g., GET /users/999999) |
| 409 | Conflict | Duplicate resource, state conflict |
| 429 | Too Many Requests | Rate limit exceeded (N+1 requests where N is limit) |
| 500 | Internal Server Error | Unrecoverable server error (document, don't test) |

### Security Vulnerability Types and Payloads

| Vulnerability | Payload Examples | Expected Safe Behavior |
|---|---|---|
| SQL Injection | "' OR '1'='1", "admin'--", "1' UNION SELECT * FROM users--" | Return 400 or sanitize input |
| XSS | "<script>alert('xss')</script>", "<img src=x onerror=alert('xss')>" | Return 400 or escape output |
| CSRF | Missing CSRF token on state-changing request | Return 403 or require token |
| Broken Auth | Invalid token, expired token, missing auth header | Return 401 |
| Sensitive Data | Request response with passwords, tokens, PII | Do not return sensitive data |
| Insecure Deserialization | Serialized object payloads | Do not deserialize untrusted data |
| Rate Limiting | N+1 requests where N is documented limit | Return 429 after limit exceeded |

### Test Framework Mapping

- **pytest**: Python, parametrized tests, fixtures, assertions, good for API testing
- **jest**: JavaScript/Node.js, describe/it blocks, mocking, async support, good for Node.js APIs
- **mocha**: JavaScript/Node.js, flexible, requires assertion library (chai), good for Node.js APIs
- **postman**: API-first, visual, built-in assertions, environment variables, good for quick testing
- **generic**: JSON/YAML test definition, framework-agnostic, good for documentation

### Data Dependency Detection

Data dependencies occur when one endpoint's output is required as input to another endpoint:
- Example: POST /users returns {"id": 123}, GET /users/{id} requires id in path
- Dependency order: POST /users → GET /users/{id} → PATCH /users/{id} → DELETE /users/{id}
- Test sequence: create resource, read resource, update resource, delete resource
- Extract output from POST response and inject into subsequent tests

---

## State Persistence (Optional)

If the workflow runs repeatedly on evolving APIs:
- Store test results and coverage metrics over time in a test results database
- Track which tests are flaky (fail intermittently): flag tests that fail > 10% of the time
- Maintain a registry of previously discovered edge cases and security vulnerabilities
- Detect API changes: compare current specification to previous version, identify new endpoints, new parameters, removed endpoints
- Suggest new tests based on API changes: if new endpoint added, generate tests for it; if parameter added, generate edge-case tests
- Generate performance regression reports: compare current response times to historical baseline, flag tests that exceed baseline by > 20%
