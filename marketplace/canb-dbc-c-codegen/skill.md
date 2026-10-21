# Generate C Pack/Unpack Code from a DBC with cantools

**One-line description:** Generates C source and header from a DBC with `cantools generate_c_source`, compiles it with warnings as errors, and proves the generated pack/unpack functions agree byte for byte with the Python cantools encoder.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dbc_file` (string, required): DBC file that passed `canb-dbc-lint-load`.
- `dbc_report` (object, required): From `canb-dbc-lint-load`; lists messages to test.
- `project_dir` (string, required): C project root; generated files go in `<project_dir>/generated/`.

---

## Outputs

- `c_codec` (object): Paths of the generated .h and .c, the cantools version and options used, compiler command, and the result of the cross-check against Python.

---

## Phase 1: Generate

### Entry Criteria
- cantools installed; the DBC loads strictly.

### Actions
1. Run `python3 -m cantools generate_c_source --help` and read the options your version offers (for example `--database-name`, `-o/--output-directory`, `--no-floating-point-numbers`, `--bit-fields`, `--generate-fuzzer`). Use only listed options.
2. Generate: `python3 -m cantools generate_c_source --database-name bench -o <project_dir>/generated <dbc_file>`. Output: `bench.h` and `bench.c`.
3. Read the header. For a message `MotorStatus` it declares `struct bench_motor_status_t` with one integer member per signal (raw values), `bench_motor_status_pack(uint8_t *dst_p, const struct bench_motor_status_t *src_p, size_t size)`, `bench_motor_status_unpack(struct bench_motor_status_t *dst_p, const uint8_t *src_p, size_t size)`, and per signal `_encode(double)`, `_decode(raw)` and `_is_in_range(raw)`. Confirm the exact names in the generated header; do not assume them.
4. Never hand-edit the generated files. Regenerate when the DBC changes and keep the command in the build (for example a Makefile or CMake custom command).

### Output
Generated .h and .c.

### Quality Gate
- Both files exist and the header names one pack and one unpack function per message.

---

## Phase 2: Compile Strictly

### Entry Criteria
- Files generated.

### Actions
1. `gcc -std=c99 -Wall -Wextra -Werror -c <project_dir>/generated/bench.c -o /tmp/bench.o`.
2. If the code base uses `-Wconversion` or similar, add them here too and record any warnings in generated code instead of disabling them globally.
3. Check return values: pack returns the number of bytes written or a negative errno-style value when `size` is too small; unpack returns 0 or a negative value. Any caller that ignores them is a defect.

### Output
Object file.

### Quality Gate
- The compile command exits 0 with `-Werror`.

---

## Phase 3: Cross-Check with Python

### Entry Criteria
- Compiles.

### Actions
1. For each message in `dbc_report`, choose test values: minimum, maximum and one middle value per signal (from the DBC range).
2. In Python, encode them with `msg.encode(values, strict=True)` and print the hex payload.
3. Write one small C test program `test_codec.c` that fills the struct with the raw values (use the generated `_encode()` for each physical value), calls `_pack`, and prints the hex payload.
4. Compare C and Python hex strings. Then call `_unpack` on the payload and check each raw member equals the input.
5. For signed signals include a negative value; for Motorola signals include a value that spans two bytes.

### Output
`c_codec` with the cross-check table.

### Quality Gate
- Every C payload equals the Python payload for every test vector.
- Every unpack returns the original raw values.

---

## Worked Example

Illustrative. DBC with `MotorStatus` (0x210): `Rpm : 7|16@0+ (1,0)`, `Current : 23|12@0- (0.1,0)`.

- Phase 1: `bench.h`, `bench.c` generated; header shows `bench_motor_status_pack` and `bench_motor_status_unpack`.
- Phase 2: `gcc -std=c99 -Wall -Wextra -Werror -c bench.c` exits 0.
- Phase 3: Rpm=1500, Current=-12.5: Python `05dcf83000000000`, C `05dcf83000000000`; unpack returns rpm 1500, current raw -125.

---

## Exit Criteria

DONE when the generated code compiles with `-Werror` and matches Python cantools payloads for every test vector.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Option not recognized | **Adjust**: remove it; use the help text list. |
| Phase 1 | Generation error on a signal | **Return**: fix the DBC defect via its owner; do not edit generated code. |
| Phase 2 | Warning in generated code | **Return**: report it with the cantools version; do not silence it globally. |
| Phase 3 | C and Python payloads differ | **Stop**: record the vector; check struct member raw vs physical value use first. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
