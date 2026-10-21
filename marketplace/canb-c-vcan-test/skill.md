# C Unit and Integration Tests for CAN Code on vcan

**One-line description:** Tests C CAN code in two layers: host unit tests of the DBC-generated pack/unpack functions with fixed vectors, and integration tests that send frames through a vcan interface to the raw receiver, wired into `make test` or CTest, with a deliberate-fault check.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): C project root.
- `c_codec` (object, required): From `canb-dbc-c-codegen`; generated sources and cross-checked vectors.
- `c_receiver` (object, required): From `canb-c-raw-socket-filters`.
- `vcan_setup` (object, required): From `canb-vcan-setup`.

---

## Outputs

- `c_test_report` (object): Test sources, build and run commands, pass/fail counts, sanitizer result, and the deliberate-fault result.

---

## Phase 1: Unit Tests of the Codec

### Entry Criteria
- Generated codec compiles.

### Actions
1. Create `tests/test_codec.c`. Use the cross-check vectors from `c_codec` (payload hex produced by Python cantools) as expected values.
2. For each vector: fill the struct, call `_pack`, `memcmp` against the expected bytes; call `_unpack` and compare members. Exit non-zero on the first failure with a message naming the vector.
3. Use plain `assert`-style checks or a small framework already used in the project (Unity, CMocka, or similar). Do not add a new framework if one exists.
4. Build with sanitizers: `gcc -std=c11 -Wall -Wextra -Werror -fsanitize=address,undefined -g tests/test_codec.c generated/bench.c -Igenerated -o test_codec`.
5. Add a `test` target (Makefile) or `add_test()` (CMake) so `make test` or `ctest` runs it.

### Output
Codec tests.

### Quality Gate
- `./test_codec` exits 0 with no sanitizer report.

---

## Phase 2: Integration Test over vcan

### Entry Criteria
- vcan interface up.

### Actions
1. Create `tests/test_vcan.sh` that: checks `/sys/class/net/vcan0` exists (exit 77 to signal "skipped" to automake-style harnesses, or print SKIP for CTest with `SKIP_RETURN_CODE 77`); starts `./raw_rx vcan0` in the background writing to a temp file; sends frames with `cansend`; waits briefly with a bounded loop checking the file; kills the receiver; asserts expected lines with `grep -c`.
2. Expected results come from the filter design in `c_receiver` (matching ID present, non-matching ID absent, FD frame present).
3. Register it as a test with the skip code configured.
4. Run the whole suite: `ctest --output-on-failure` or `make test`.

### Output
Integration test.

### Quality Gate
- Suite passes, or vcan tests report SKIP with the reason when vcan is missing.

---

## Phase 3: Prove the Tests Can Fail

### Entry Criteria
- Suite green.

### Actions
1. Introduce one deliberate fault: change one expected byte in a copy of a vector, or change the receiver's filter mask in a scratch build. Never edit the generated code to do this.
2. Run the suite: a test must fail and name the vector or the frame.
3. Revert and rerun: green.

### Output
`c_test_report`.

### Quality Gate
- Failing output with the fault and passing output after revert are both recorded.

---

## Worked Example

Illustrative. Codec for `bench.dbc`, receiver with filter 123:7FF.

- Phase 1: 12 vectors; `./test_codec` prints `12/12 vectors ok`; ASan and UBSan silent.
- Phase 2: `ctest --output-on-failure` shows `test_codec ... Passed`, `test_vcan ... Passed`.
- Phase 3: mask changed to 0x700 in a scratch build; `test_vcan` fails with `expected 0 lines for 124, got 1`; reverted, all pass.

---

## Exit Criteria

DONE when codec and vcan tests run from one command, pass with sanitizers, skip cleanly without vcan, and a deliberate fault makes a test fail.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sanitizer reports out-of-bounds in pack | **Return**: check the `size` argument passed; report a generator defect only with a minimal reproducer. |
| Phase 2 | Test flaky due to timing | **Adjust**: replace fixed sleeps with a bounded poll on the output file. |
| Phase 2 | vcan missing in CI | **Adjust**: load vcan on the CI host or keep the skip; record coverage lost. |
| Phase 3 | No failure with the fault | **Adjust**: strengthen the assertion, then repeat. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
