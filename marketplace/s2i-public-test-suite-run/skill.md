# Public Conformance Suite Run

**One-line description:** Finds the established public conformance suite for the spec (h2spec, Autobahn|Testsuite, JSONTestSuite, JSON-Schema-Test-Suite, CommonMark spec tests, toml-test, yaml-test-suite, Wycheproof, web-platform-tests), runs it against your implementation with the suite's own harness, and maps each failing case to a requirement ID.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `spec_bundle` (object, required): From `s2i-spec-acquire-pin`.
- `implementation_command` (string, required): How to start or invoke your implementation: a server start command with its port, or a CLI that reads input from a file or stdin.
- `project_dir` (string, required): Repository root; results go to `project_dir/reports/suites/`.

---

## Outputs

- `suite_results` (object[]): One row per suite: `{ "suite", "version_or_sha", "command", "total", "passed", "failed", "non_strict", "failures": [{"case","req_ids","detail"}] }`.

---

## Phase 1: Pick the Suite

### Entry Criteria
- `spec_bundle.id` known.

### Actions
1. Select every suite that matches the spec:

   | Spec | Suite | Harness and how to run |
   |---|---|---|
   | HTTP/2 (RFC 9113, RFC 7541) | h2spec | `h2spec -h 127.0.0.1 -p <port>`; add `-t -k` for TLS with a self-signed cert; `-j <file>` writes JUnit. Confirm flags with `h2spec --help`. |
   | WebSocket (RFC 6455, RFC 7692) | Autobahn\|Testsuite | Docker image `crossbario/autobahn-testsuite`; `wstest -m fuzzingclient -s fuzzingclient.json` tests your server, `-m fuzzingserver` tests your client. Report in `reports/servers/index.json` and HTML. |
   | JSON (RFC 8259) | JSONTestSuite (`github.com/nst/JSONTestSuite`) | Files in `test_parsing/`: `y_*` must be accepted, `n_*` must be rejected, `i_*` are implementation-defined (record your behavior). |
   | JSON Schema | JSON-Schema-Test-Suite (`github.com/json-schema-org/JSON-Schema-Test-Suite`) | `tests/<draft>/*.json` with `valid` booleans per case. |
   | CommonMark | `spec.txt` + `test/spec_tests.py` in `github.com/commonmark/commonmark-spec` | `python3 test/spec_tests.py --spec spec.txt --program '<your command>'`. |
   | TOML | toml-test (`github.com/toml-lang/toml-test`) | `toml-test <your-decoder>`; decoder reads TOML on stdin, writes tagged JSON. Check README for the encoder mode. |
   | YAML 1.2 | yaml-test-suite (`github.com/yaml/yaml-test-suite`, `data` branch) | each case dir has `in.yaml`, `in.json`, and an `error` file for must-fail cases. |
   | Cryptographic primitives | Wycheproof (`github.com/C2SP/wycheproof`) | JSON vectors; `result` is `valid`, `invalid`, or `acceptable`. |
   | Web platform APIs (WHATWG, W3C) | web-platform-tests (`github.com/web-platform-tests/wpt`) | `./wpt run <product> <path>`; for non-browser libraries, port the relevant `*.any.js` data files (for example `url/resources/urltestdata.json`). |
   | QUIC (RFC 9000) | quic-interop-runner | Docker-based; see `s2i-interop-reference-impl`. |

2. If no suite matches, **Return** empty `suite_results` with the note "no public suite found" and the searches done (GitHub search "<spec> test suite", the spec's own "Implementation Status" or WG wiki).
3. Pin the suite version: record the release tag or `git rev-parse HEAD` of the cloned suite.

### Output
Selected suites with pinned versions.

### Quality Gate
- Every selected suite has a version tag or commit SHA.
- The harness `--help` or README invocation section was read and the exact command is written down.

---

## Phase 2: Run

### Entry Criteria
- Suite and command chosen.

### Actions
1. Start your implementation with `implementation_command` in a separate terminal or as a background process, and confirm it is listening (`curl -sv http://127.0.0.1:<port>/` or `nc -z 127.0.0.1 <port>`).
2. Run the suite command and save all output: `... 2>&1 | tee reports/suites/<suite>.log`.
3. For file-based suites (JSONTestSuite, yaml-test-suite), write a small loop that runs your parser per file and records exit code, then compare with the expected class (`y_`/`n_`/`i_`, presence of `error`).
4. Save the native report files (JUnit, Autobahn `index.json`, HTML) under `reports/suites/<suite>/`.

### Output
Raw suite results.

### Quality Gate
- The suite log ends with its own summary line (h2spec prints a final count; Autobahn writes `index.json`; loops print totals).
- Total case count equals the suite's case count for the selected sections.

---

## Phase 3: Map Failures to Requirements

### Entry Criteria
- Raw results.

### Actions
1. For each failing case, read the case description: h2spec prints the RFC section with each test (for example "6.5.3"); Autobahn case IDs group by topic (1.x framing, 5.x fragmentation, 6.x UTF-8, 7.x close handling) and the HTML report shows expected and observed behavior.
2. Map the case to `REQ-` IDs by its section. If no requirement exists, add one via `s2i-requirements-table` (you missed it) or record why the case does not apply.
3. Autobahn reports `NON-STRICT` and `INFORMATIONAL` outcomes; treat `NON-STRICT` as a deviation to log, not a pass, and `INFORMATIONAL` as recorded behavior only.
4. Fix implementation failures one at a time, then rerun the whole suite. Never exclude a failing case from the run to raise the pass count; exclusions must be listed with a reason.

### Output
`suite_results`.

### Quality Gate
- Every failure row has `req_ids` or a written non-applicability reason.
- `reports/suites/` contains the native report for every suite run.

---

## Worked Example

Illustrative. HTTP/2 server.

Phase 1: h2spec, release tag recorded.

Phase 2:
```
$ ./server --port 8080 &
$ h2spec -h 127.0.0.1 -p 8080 -j reports/suites/h2spec/junit.xml 2>&1 | tee reports/suites/h2spec.log
...
  6.5.3. Settings Synchronization
    × 1: Sends multiple values of SETTINGS_INITIAL_WINDOW_SIZE
      -> The endpoint MUST process the values in the settings in the order they appear.
...
Finished in 3.2 seconds
146 tests, 145 passed, 0 skipped, 1 failed
```
Phase 3: Case 6.5.3/1 maps to `REQ-6.5.3-01` (RFC 9113 Section 6.5.3 ordering). Fix the SETTINGS loop to apply values in order; rerun: 146 passed.

---

## Exit Criteria

DONE when every applicable public suite has been run at a pinned version, native reports are saved, and every failing or non-strict case is mapped to a requirement or excluded with a written reason.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Suite targets a different spec version (for example RFC 7540 vs RFC 9113) | **Adjust**: run it, and map cases whose text changed between versions to the ambiguity log. |
| Phase 2 | Implementation not listening | **Stop**: fix startup first; a suite against a dead port reports meaningless failures. |
| Phase 2 | Docker unavailable for Autobahn | **Adjust**: install `autobahntestsuite` per its README, or run Docker on another host and record it. |
| Phase 3 | Case cannot be mapped to any section | **Return** it to the ambiguity log with the case text. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
