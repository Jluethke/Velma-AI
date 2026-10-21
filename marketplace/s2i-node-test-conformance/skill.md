# Node node:test Conformance Suite

**One-line description:** Implements the conformance test plan with the built-in `node:test` runner, encodes requirement IDs in test names so they appear in the JUnit report, drives vector tests from `testdata/vectors.json`, and writes `reports/conformance-junit.xml` with the built-in reporter.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `conformance_test_plan` (object[], required): From `s2i-conformance-test-design`.
- `test_vectors` (object, required): From `s2i-test-vectors-extract`.
- `project_dir` (string, required): Node project root.

---

## Outputs

- `conformance_tests` (string): Path to `test/conformance/`.
- `junit_report` (string): Path to `reports/conformance-junit.xml`.

---

## Phase 1: Check the Runner

### Entry Criteria
- `node --version` prints a version.

### Actions
1. Confirm the runner and reporters your Node version has: run `node --help | grep -i test` and read the Node docs page "Test runner" for your major version. You need `--test`, `--test-reporter`, and `--test-reporter-destination`, and the `junit` reporter.
2. If the installed Node has no `junit` reporter, **Adjust**: upgrade Node, or use the `tap` reporter and convert with a TAP-to-JUnit tool, recording which.
3. Create `test/conformance/helpers.js` exporting `loadVectors(prefix)` that reads `testdata/vectors.json` with `fs.readFileSync` and filters by `id` prefix, and `hex(s)` returning `Buffer.from(s, 'hex')`.

### Output
Confirmed reporter options and helpers.

### Quality Gate
- The `node --help` output lines for `--test-reporter` and `--test-reporter-destination` are saved in the run notes.
- `node -e "require('./test/conformance/helpers.js')"` (or the ESM `import()` form) exits 0.

---

## Phase 2: Write Tests from the Plan

### Entry Criteria
- Helpers load.

### Actions
1. One file per spec section: `test/conformance/sec-5.1.test.js`. Finish and run one file before starting another.
2. Use `import { describe, it, before, after } from 'node:test'` and `import assert from 'node:assert/strict'`.
3. Name every test `<test_id> [<req ids>] <short text>`, for example `it('T-5.1-02-01 [REQ-5.1-02] unmasked client frame closes connection', ...)`. The bracketed IDs are what the traceability flow reads from the JUnit `name` attribute.
4. Vector groups: `for (const v of loadVectors('V-5.7')) it(\`${v.id} [${v.req_ids.join(',')}]\`, () => {...})`.
5. Start the server under test on port 0 in `before()`, read the assigned port from `server.address().port`, and close it in `after()`. Use `net.connect` to send raw bytes for protocol tests.
6. Use `assert.deepStrictEqual` for byte comparisons on `Buffer`s; `assert.equal` on Buffers compares references.
7. Never change an expected value to match output; never wrap a failing assertion in `try/catch`.

### Output
`conformance_tests`.

### Quality Gate
- Every plan `test_id` appears in a test name: `grep -rhoE 'T-[0-9A-Za-z.-]+' test/conformance | sort -u` matches the plan list.
- `node --test test/conformance/` runs with zero load errors.

---

## Phase 3: Run and Report

### Entry Criteria
- Tests written.

### Actions
1. Run with two reporters (human and JUnit):
   `mkdir -p reports && node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=reports/conformance-junit.xml test/conformance/`
   Reporter and destination flags pair up in order.
2. Read the totals block (`# tests`, `# pass`, `# fail`) from the spec output.
3. Confirm IDs reached the XML: `grep -c '\[REQ-' reports/conformance-junit.xml`.
4. Rerun one test while fixing: `node --test --test-name-pattern='T-5.1-02' test/conformance/`.

### Output
`junit_report`.

### Quality Gate
- `reports/conformance-junit.xml` exists and parses as XML (`node -e` with a parser, or `xmllint --noout reports/conformance-junit.xml`).
- Totals are copied into the run notes as printed.

---

## Worked Example

Illustrative. RFC 6455 server in Node.

Phase 2:
```js
it('T-5.1-03-01 [REQ-5.1-03] server frames are not masked', async () => {
  const sock = await connectAndHandshake(port);
  app.broadcast('hi');
  const frame = await readFrame(sock);
  assert.equal(frame[1] & 0x80, 0);
});
```
Phase 3:
```
$ node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination=reports/conformance-junit.xml test/conformance/
✔ T-5.1-03-01 [REQ-5.1-03] server frames are not masked (4.1ms)
...
ℹ tests 61
ℹ pass 61
ℹ fail 0
```

---

## Exit Criteria

DONE when every plan row is a `node:test` test whose name carries its requirement IDs, the run completes, and the JUnit file at `reports/conformance-junit.xml` contains those names.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `junit` reporter unknown | **Adjust**: upgrade Node or use `tap` plus a converter; record the choice. |
| Phase 2 | Test hangs waiting for bytes | **Adjust**: set a socket timeout from the spec or a user input and fail with a message; never leave an open handle. |
| Phase 3 | Process does not exit after tests | **Adjust**: a server or socket is still open; close it in `after()`. |
| Phase 3 | Test failure in implementation | **Return** the failing test ID and requirement to the implementer; keep the test unchanged. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
