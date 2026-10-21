# pytest Unit Tests for CAN Code on vcan and the python-can Virtual Bus

**One-line description:** Writes pytest tests for Python CAN code that run against python-can's in-process `virtual` interface for pure logic and against a Linux vcan interface for SocketCAN behavior, with fixtures that always shut buses down, and proves the tests can fail.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Python project root with `tests/`.
- `py_receiver` (object, required): From `canb-py-bus-notifier`; the module under test.
- `vcan_setup` (object, required): From `canb-vcan-setup`; the vcan interface name.
- `dbc_file` (string, required): DBC used by the code under test.

---

## Outputs

- `py_test_report` (object): Test file paths, pytest command, pass/fail counts, the mutation check result, and which tests need vcan.

---

## Phase 1: Choose the Bus per Test

### Entry Criteria
- pytest installed (`python3 -m pytest --version`).

### Actions
1. Decision table:

| Behavior under test | Bus |
|---|---|
| Encode/decode, counters, checksums, listener logic | `can.Bus(interface="virtual", channel="t1")` (no kernel needed, runs anywhere) |
| Kernel filters, FD MTU, socketcan options, BCM periodic timing | `can.Bus(interface="socketcan", channel=<vcan>)` |
| Bit timing, error frames, bus-off, ACK | Not testable on vcan or virtual; hardware bench only |

2. Two python-can virtual buses on the same channel name see each other's frames; one bus does not receive its own frames unless `receive_own_messages=True`.

### Output
Test plan mapping each test to a bus.

### Quality Gate
- Every planned test has a bus from the table; hardware-only behaviors are listed as not covered.

---

## Phase 2: Write Fixtures and Tests

### Entry Criteria
- Plan ready.

### Actions
1. In `tests/conftest.py` write a fixture that yields a pair of virtual buses and calls `shutdown()` on both in teardown (use `yield`, then shutdown after it).
2. Write a vcan fixture that skips cleanly when the interface is missing: check `os.path.exists("/sys/class/net/vcan0")` and call `pytest.skip("vcan0 not present")`. Mark these tests with a custom marker (`@pytest.mark.vcan`) registered in `pytest.ini` or `pyproject.toml`.
3. Tests:
   - round-trip: encode with cantools from `dbc_file`, send on bus A, `bus_b.recv(timeout=1.0)`, decode, assert equal values;
   - filter test (vcan): open with `can_filters`, send a matching and a non-matching ID, assert only the matching one arrives and `recv(timeout=0.2)` returns None for the other;
   - listener test: feed messages into the listener from `py_receiver` and assert its output.
4. Always pass a `timeout` to `recv`; a missing timeout hangs the test run forever.
5. Edit one test file at a time and run pytest after each file.

### Output
Test files.

### Quality Gate
- `python3 -m pytest -q` exits 0.
- `python3 -m pytest -q -m vcan` either passes or reports skips with the reason "vcan0 not present".

---

## Phase 3: Prove the Tests Can Fail

### Entry Criteria
- Suite green.

### Actions
1. Make one deliberate fault in a copy of the code under test or with monkeypatch (for example swap two bytes in the encoder output). Do not edit tests to do this.
2. Run pytest: at least one test must fail.
3. Revert the fault and rerun: green again.
4. Never delete or weaken a test to get green; if a test is wrong, explain why and fix the assertion to the specified behavior.

### Output
`py_test_report`.

### Quality Gate
- Recorded: failing run output with the fault, passing run output after revert.

---

## Worked Example

Illustrative. Project with `can_rx.py` and `bench.dbc`.

- Phase 1: 5 tests on virtual bus, 2 on vcan0; bus-off behavior listed as hardware-only.
- Phase 2: `python3 -m pytest -q` prints `7 passed in 0.84s`.
- Phase 3: byte swap via monkeypatch: `1 failed, 6 passed`; after revert `7 passed`.

---

## Exit Criteria

DONE when the suite passes, vcan tests pass or skip with a reason, a deliberate fault makes a test fail, and uncovered hardware behaviors are listed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Test hangs | **Adjust**: add `timeout` to every `recv`; check the notifier is stopped in teardown. |
| Phase 2 | `OSError: No such device` on vcan | **Adjust**: the skip check is missing; add it. |
| Phase 3 | No test fails with the fault | **Adjust**: add an assertion on the faulted behavior, then repeat. |
| Phase 3 | Temptation to delete a failing test | **Stop**: fix the code or the assertion to the specification; never delete. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
