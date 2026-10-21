# Parity Cross-Architecture aarch64 Run

**One-line description:** Cross-compiles the parity harness for aarch64 Linux, runs it on the x86_64-generated goldens under QEMU user mode for fast iteration and then on real aarch64 hardware for the result of record, and compares outputs under the same policy.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the C++ port.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.
- `golden_manifest` (string, required): Output of `parity-golden-manifest-lock`.
- `comparison_policy` (object, required): Output of `parity-ulp-tolerance-policy`.

---

## Outputs

- `cross_arch_results` (object): Per run environment (QEMU, real hardware): toolchain, C library version, mismatch count, max ULP, and the comparison result file.

---

## Phase 1: Cross-Build

### Entry Criteria
- The harness passes on x86_64.

### Actions
1. Install the cross toolchain and emulator on Debian or Ubuntu: `sudo apt-get install g++-aarch64-linux-gnu qemu-user`. Package names differ on other distributions; check the distribution's package search.
2. Write `cmake/aarch64-linux-gnu.cmake`:
   ```cmake
   set(CMAKE_SYSTEM_NAME Linux)
   set(CMAKE_SYSTEM_PROCESSOR aarch64)
   set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)
   set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)
   set(CMAKE_FIND_ROOT_PATH /usr/aarch64-linux-gnu)
   set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
   set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
   set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
   ```
3. Configure and build: `cmake -S . -B build-a64 -DCMAKE_TOOLCHAIN_FILE=cmake/aarch64-linux-gnu.cmake -DCMAKE_BUILD_TYPE=Release && cmake --build build-a64 --target parity_harness`.
4. Confirm the binary architecture: `file build-a64/parity_harness` must say `ARM aarch64`.
5. Confirm no FMA slipped in: `aarch64-linux-gnu-objdump -d --no-show-raw-insn -C build-a64/parity_harness | grep -cE "\bfn?m(add|sub)\b"` returns `0` inside port functions (see `parity-gcc-fp-contract`). aarch64 always has FMA, so this is the most common cross-arch failure.

### Output
aarch64 harness binary.

### Quality Gate
- `file` reports `ARM aarch64`.
- The FMA grep is zero for port functions.

---

## Phase 2: Run and Compare

### Entry Criteria
- aarch64 harness built.

### Actions
1. QEMU user mode run: `qemu-aarch64 -L /usr/aarch64-linux-gnu ./build-a64/parity_harness <entry> golden/<entry>.jsonl port_out_a64/<entry>.jsonl`. `-L` points at the cross sysroot so the aarch64 glibc and libm are used.
2. Compare with `parity-ulp-compare` and the same `comparison_policy`.
3. Treat the QEMU result as a fast pre-check only. QEMU emulates floating point in software; the result of record comes from real hardware.
4. Real hardware run: on an aarch64 Linux machine (a board, a cloud instance, or a hosted CI runner), build natively with the same flags and run the same command without `qemu-aarch64`.
5. Record the C library version on each environment (`ldd --version` on hardware; the cross sysroot's glibc version for QEMU). A libm version difference between x86_64 and aarch64 is a separate cause from the architecture; route those mismatches to `parity-libm-divergence`.
6. Emit `cross_arch_results`.

### Output
`cross_arch_results`.

### Quality Gate
- `cross_arch_results` contains a real-hardware entry, not only QEMU.
- Mismatch counts come from `parity-ulp-compare` exit status and result files, not from reading output by eye.

---

## Worked Example

Illustrative.

```
$ file build-a64/parity_harness
build-a64/parity_harness: ELF 64-bit LSB pie executable, ARM aarch64, ...
$ qemu-aarch64 -L /usr/aarch64-linux-gnu ./build-a64/parity_harness lowpass_step golden/lowpass_step.jsonl port_out_a64/lowpass_step.jsonl
read 5832 cases, wrote 5832
$ python tests/parity/compare.py --golden golden --port port_out_a64 --policy policy.json --out a64.json
lowpass.step  y  cases=5832 mismatches=0 max_ulp=0
```

Real hardware run on an aarch64 board with glibc 2.39 gives the same zero.

---

## Exit Criteria

DONE when the aarch64 harness runs on real hardware against the same goldens and its comparison result is recorded alongside the QEMU pre-check.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Linker cannot find aarch64 libraries | **Adjust**: check `CMAKE_FIND_ROOT_PATH` points at the installed sysroot. |
| Phase 2 | QEMU passes, hardware fails | **Adjust**: compare C library versions first, then FTZ state (FPCR.FZ) with `parity-denormal-ftz-daz`. |
| Phase 2 | No aarch64 hardware available | **Return**: report the QEMU result as provisional and list hardware access as an open item. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
