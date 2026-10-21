# Python pytest Conformance Suite

**One-line description:** Implements the conformance test plan in pytest with a registered `req` marker on every test, parametrizes vector tests from `testdata/vectors.json`, records requirement IDs into the JUnit XML with `record_property`, and produces `reports/conformance-junit.xml` for the traceability matrix.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `conformance_test_plan` (object[], required): From `s2i-conformance-test-design`.
- `test_vectors` (object, required): From `s2i-test-vectors-extract`.
- `project_dir` (string, required): Python project root.

---

## Outputs

- `conformance_tests` (string): Path to `tests/conformance/`.
- `junit_report` (string): Path to `reports/conformance-junit.xml`.

---

## Phase 1: Scaffold Markers and Fixtures

### Entry Criteria
- `spec/test_plan.json` and `testdata/vectors.json` exist.
- `python -m pytest --version` works.

### Actions
1. Register the marker so typos fail the run. In `pyproject.toml`:
   ```toml
   [tool.pytest.ini_options]
   markers = ["req(*ids): normative requirement IDs this test covers"]
   addopts = "--strict-markers"
   ```
2. In `tests/conformance/conftest.py`, add an autouse fixture that copies marker IDs into the report:
   ```python
   @pytest.fixture(autouse=True)
   def _req_ids(request, record_property):
       m = request.node.get_closest_marker("req")
       if m:
           record_property("req_ids", ",".join(m.args))
   ```
   `record_property` writes `<property name="req_ids" .../>` into the JUnit XML for that test case.
3. Add a session fixture `vectors` that loads `testdata/vectors.json` once and a helper `by_group(prefix)` returning a list for `parametrize`.
4. Set `junit_family = "xunit2"` only if your CI reader needs it; `record_property` output is documented for the default `xunit1` family, and pytest warns when it is combined with `xunit2`. Check the pytest docs for your version before changing it.

### Output
Marker registration and fixtures.

### Quality Gate
- `python -m pytest --markers | grep req` prints the marker line.
- `python -m pytest tests/conformance --collect-only -q` exits 0.

---

## Phase 2: Write Tests from the Plan

### Entry Criteria
- Scaffold collects.

### Actions
1. One file per spec section: `tests/conformance/test_sec_5_1.py`. Work on one file at a time; run it before starting the next.
2. One test function per plan row, named from `test_id` with `.` and `-` replaced by `_`: `T-5.1-02-01` becomes `test_T_5_1_02_01`. Decorate with `@pytest.mark.req("REQ-5.1-02")`.
3. Each test body follows the plan row: `setup`, then `stimulus`, then assert the `oracle` exactly. Use the public API of your implementation; do not import private helpers for black_box rows.
4. Vector groups: `@pytest.mark.parametrize("v", by_group("V-5.7"), ids=lambda v: v["id"])` and decode `input`/`expected` per the vector's `encoding`.
5. Ambiguity tests: put the `AMB-` ID in the docstring.
6. Do not call real network services. For protocol tests, start your server on `127.0.0.1` with port 0 (OS-assigned) in a fixture and connect a raw `socket` client that you control byte by byte.
7. Do not weaken an assertion to pass. If the implementation fails, the test stays failing and the implementation is fixed in a separate change.

### Output
`conformance_tests`.

### Quality Gate
- Every plan row has exactly one test or one parametrized test: compare `pytest --collect-only -q` IDs against the plan's `test_id` list.
- `grep -L "mark.req" tests/conformance/test_*.py` prints nothing (every file uses the marker).

---

## Phase 3: Run and Report

### Entry Criteria
- Tests written.

### Actions
1. Run: `mkdir -p reports && python -m pytest tests/conformance -q --junitxml=reports/conformance-junit.xml -rA`.
2. Read the short summary at the end (`-rA` lists every outcome). Count passed, failed, skipped, xfailed.
3. Check the IDs reached the report: `grep -c 'name="req_ids"' reports/conformance-junit.xml` must equal the number of executed test cases that carry the marker.
4. For each failure, open an issue or a fix task naming the requirement ID; do not edit the test.
5. Run only one requirement while fixing: `python -m pytest tests/conformance -m req -k T_5_1_02`.

### Output
`junit_report`.

### Quality Gate
- `reports/conformance-junit.xml` exists and parses: `python -c "import xml.etree.ElementTree as E;E.parse('reports/conformance-junit.xml')"`.
- The summary line counts are copied into the run notes as printed.

---

## Worked Example

Illustrative. RFC 6455 server package `wsd`.

Phase 2 (`tests/conformance/test_sec_5_1.py`):
```python
@pytest.mark.req("REQ-5.1-02")
def test_T_5_1_02_01(server_addr):
    s = socket.create_connection(server_addr)
    do_handshake(s)
    s.sendall(bytes.fromhex("810548656c6c6f"))   # unmasked text "Hello"
    data = s.recv(16)
    assert data == b"" or data[:2] == b"\x88\x02" and data[2:4] == (1002).to_bytes(2, "big")
```
Phase 3:
```
$ python -m pytest tests/conformance -q --junitxml=reports/conformance-junit.xml -rA
...
PASSED tests/conformance/test_sec_5_1.py::test_T_5_1_02_01
FAILED tests/conformance/test_sec_5_5.py::test_T_AMB_004_01 - assert b'\x88\x02\x03\xe8' ...
1 failed, 57 passed in 2.10s
$ grep -c 'name="req_ids"' reports/conformance-junit.xml
58
```
The failure shows the server answered a 1-byte Close payload with 1000 instead of 1002; the fix goes into the server, not the test.

---

## Exit Criteria

DONE when every plan row is a pytest test carrying its requirement IDs, the suite runs to completion, and `reports/conformance-junit.xml` contains a `req_ids` property for every marked test.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `PytestUnknownMarkWarning` or strict marker error | **Adjust**: the marker is not registered or misspelled; fix `pyproject.toml`. |
| Phase 2 | Test needs a private helper | **Adjust**: reclassify as white_box in the plan first, then write it as a unit test. |
| Phase 3 | `req_ids` count lower than test count | **Adjust**: some tests lack the marker; add it. |
| Phase 3 | Port conflicts or hangs | **Adjust**: use port 0 and a socket timeout from the spec or a user input; never sleep-loop. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
