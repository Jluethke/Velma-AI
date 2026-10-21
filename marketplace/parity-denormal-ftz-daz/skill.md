# Parity Denormal FTZ and DAZ Check

**One-line description:** Tests whether the reference process and the port process handle subnormal numbers the same way, by reading the x86 MXCSR flush-to-zero and denormals-are-zero bits or the aarch64 FPCR FZ bit at run time and running a subnormal probe on both sides.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the port.
- `reference_repo` (string, required): Path to the Python reference.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `denormal_findings` (object[]): For each process (reference, port harness, port loaded in Python), the FTZ and DAZ state and the probe result.

---

## Phase 1: Probe Values

### Entry Criteria
- Both sides run on the same machine.

### Actions
1. Use these probes. Each has an exact IEEE 754 binary64 result when subnormals are preserved:

| Probe | What it detects | Expected with subnormals preserved | Flushed result |
|---|---|---|---|
| `2.2250738585072014e-308 / 3.0` | output flushing (x86 FTZ, aarch64 FZ): the result is tiny and inexact | `7.41691286169067e-309` (pattern `0005555555555555`) | `0.0` (pattern `0000000000000000`) |
| `5e-324 * 2.0` | input flushing (x86 DAZ, aarch64 FZ): the input is subnormal | `1e-323` (pattern `0000000000000002`) | `0.0` |

2. In Python: `python -c "import struct; f=lambda x: format(struct.unpack('<Q',struct.pack('<d',x))[0],'016x'); print(f(2.2250738585072014e-308/3.0), f(5e-324*2.0))"`. Expected `0005555555555555 0000000000000002`.
3. In the port harness, compute the same probes from values read at run time (from argv or a file) so the compiler cannot fold them at compile time, and print the bit patterns.
4. Run the reference probe again after importing every native module the reference imports (NumPy, SciPy, PyTorch, your binding). A module built with fast-math can set FTZ/DAZ for the whole process on import. With PyTorch also check `torch.set_flush_denormal` is not called.

### Output
Probe results per process.

### Quality Gate
- Probe patterns are printed for: plain Python, Python after all imports, and the port harness.

---

## Phase 2: Read Control Registers

### Entry Criteria
- Probe results recorded.

### Actions
1. x86_64: in the port harness print `_MM_GET_FLUSH_ZERO_MODE()` (from `<xmmintrin.h>`) and `_MM_GET_DENORMALS_ZERO_MODE()` (from `<pmmintrin.h>`). Nonzero means on. In MXCSR, FTZ is bit 15 and DAZ is bit 6 (Intel 64 and IA-32 Architectures Software Developer's Manual, MXCSR register).
2. aarch64: read FPCR with inline assembly `uint64_t r; asm volatile("mrs %0, fpcr" : "=r"(r));` and test bit 24 (FZ), per the Arm Architecture Reference Manual.
3. Read the registers at harness start and again just before the computation. A change between the two means something in initialization (a library, a thread pool) set it.
4. Decision rule: parity requires the same setting on both sides. If the reference preserves subnormals and the port flushes, record a finding naming the code or link object that set the bit (see `parity-fast-math-audit` for `crtfastmath.o`).
5. Emit `denormal_findings`.

### Output
`denormal_findings`.

### Quality Gate
- Every process has a recorded FTZ and DAZ (or FZ) value and a probe result.
- Any process whose probe differs from plain Python has a named cause or an open question.

---

## Worked Example

Illustrative, x86_64.

```
$ python -c "..."             # plain
0005555555555555 0000000000000002
$ python -c "import mylib; ..."   # after importing a binding
0000000000000000 0000000000000000
$ ./harness_probe 2.2250738585072014e-308
ftz=1 daz=1 at start
```

Finding: `mylib` was linked with `-ffast-math`, pulling in startup code that sets FTZ and DAZ for the whole Python process. The reference itself is now running with flushed subnormals, so goldens generated after that import are wrong.

---

## Exit Criteria

DONE when both sides show the same subnormal handling, or every difference has a named cause.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Harness probe always preserves subnormals even with FTZ set | **Adjust**: the compiler folded the constant; read the inputs at run time. |
| Phase 2 | Register differs between start and computation | **Return**: report the initialization step that changed it. |
| Phase 2 | Goldens were generated in a flushed process | **Stop**: mark the goldens invalid and regenerate under `parity-golden-manifest-lock` rules. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
