# Parity C++ Vector Harness

**One-line description:** Builds a standalone C++ harness that reads golden vectors in the canonical encoding, calls the port with the production floating-point flags, and writes port outputs as bit patterns, so the same binary can run on any target architecture without Python.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the C++ port.
- `serialization_spec` (object, required): Output of `parity-canonical-serialization`.
- `golden_manifest` (string, required): Output of `parity-golden-manifest-lock`.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `harness_binary` (string): Path to the built harness and the command line that writes `port_out/<entry>.jsonl` from `golden/<entry>.jsonl`.

---

## Phase 1: Write the Harness

### Entry Criteria
- `sha256sum -c golden.sha256` passes.

### Actions
1. Create `tests/parity/harness.cpp` in `port_repo`. One harness serves every entry point; the first argument names the entry point.
2. Decode each input field exactly as `serialization_spec` says: parse 16 hex digits with `std::strtoull(s, nullptr, 16)`, then `std::bit_cast<double>(u)` (C++20) or `std::memcpy`.
3. Call the port through its public header, the same symbol production calls. Do not copy port code into the harness.
4. For stateful entry points, replay the sequence in order and carry the state exactly as the contract says.
5. Encode outputs with `std::bit_cast<std::uint64_t>(y)` and `std::snprintf(buf, sizeof buf, "%016" PRIx64, u)`. Never write outputs with `std::cout << y`.
6. If the port signals an error (exception, error code, `std::optional` empty), write `{"raises": "<class>"}` using the mapping table in the contract.
7. Echo the case id from each input line so the comparison step pairs lines by id, not by line number.

### Output
`tests/parity/harness.cpp`.

### Quality Gate
- `grep -n "cout <<" tests/parity/harness.cpp` returns no line that prints a floating-point value.
- The harness includes the port's public header and links the port library target.

---

## Phase 2: Build With Production Flags

### Entry Criteria
- Harness source exists.

### Actions
1. Add to CMake: `add_executable(parity_harness tests/parity/harness.cpp)`, `target_link_libraries(parity_harness PRIVATE <port_target>)`, `target_compile_options(parity_harness PRIVATE <fp_flags>)`.
2. The port library itself must already carry `fp_flags` (from `parity-fp-flag-baseline`). The harness flags matter only for the decode and encode code; the arithmetic under test is in the port library.
3. Build in the same configuration production ships (for example `Release`). A parity pass in `Debug` says nothing about `-O2` code.
4. Run once on the golden inputs: `./parity_harness lowpass_step golden/lowpass_step.jsonl port_out/lowpass_step.jsonl`.

### Output
`harness_binary`.

### Quality Gate
- The output file has the same number of lines as the input file: `wc -l golden/lowpass_step.jsonl port_out/lowpass_step.jsonl`.
- Every output line parses as JSON and every float field is 16 hex digits.

---

## Worked Example

Illustrative.

```
$ cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_EXPORT_COMPILE_COMMANDS=ON && cmake --build build --target parity_harness
$ ./build/parity_harness lowpass_step golden/lowpass_step.jsonl port_out/lowpass_step.jsonl
read 5832 cases, wrote 5832
$ head -c 120 port_out/lowpass_step.jsonl
{"case": 0, "y": "3fb999999999999a", "state": ["3fb999999999999a", "0000000000000000"]}
```

---

## Exit Criteria

DONE when the harness builds in the production configuration, links the real port target, and writes one bit-pattern output line per golden case.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Port has no public header for the entry point | **Return**: ask the port owner to expose it; do not include private sources into the harness. |
| Phase 2 | Line count differs | **Stop**: a case crashed or was skipped; run under `parity-cpp-sanitizer-sweep`. |
| Phase 2 | Toolchain lacks C++20 | **Adjust**: use `std::memcpy` instead of `std::bit_cast`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
