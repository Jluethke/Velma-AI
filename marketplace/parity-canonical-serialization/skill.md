# Parity Canonical Serialization

**One-line description:** Defines one lossless, byte-stable encoding for every parity input and output so the reference and the port read and write identical bits, with floats stored as IEEE 754 bit patterns and explicit rules for -0.0, NaN, endianness, and array shape.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `parity_contract` (object, required): Output of `parity-contract-scope`.

---

## Outputs

- `serialization_spec` (object): File format, field encoding per type, NaN policy, byte order, and the round-trip test both sides must pass.

---

## Phase 1: Choose the Container

### Entry Criteria
- `parity_contract` exists and lists every argument with an explicit width.

### Actions
1. Use this decision table for the container format:

| Condition | Container |
|---|---|
| Fewer than about one million values per case set, humans must diff it | JSON Lines (`.jsonl`), one test case per line |
| Large arrays, size matters more than diffing | Raw little-endian binary (`.bin`) plus a JSON sidecar giving dtype, shape, and offset |

2. Fix byte order as little-endian for every binary field. Both x86_64 and aarch64 Linux are little-endian, but write it in the spec so a big-endian target is caught.
3. Do NOT use `numpy.save` `.npy` as the only format if the port must read it without a NumPy-format parser; if used, the spec must name the `.npy` format version.

### Output
Container choice and byte order.

### Quality Gate
- The spec names one container and one byte order.

---

## Phase 2: Encode Each Type

### Entry Criteria
- Container chosen.

### Actions
1. Encode every `float64` as its 64-bit pattern in 16 lowercase hex digits, for example `1.0` is `"3ff0000000000000"`. Encode `float32` as 8 hex digits. In Python: `struct.pack('<d', x).hex()` gives little-endian byte order, so use `format(struct.unpack('<Q', struct.pack('<d', x))[0], '016x')` to get the integer pattern. In C++: `std::bit_cast<std::uint64_t>(x)` (C++20) or `std::memcpy` into a `uint64_t`, printed with `"%016" PRIx64`.
2. Optionally add a human-readable field next to each pattern using Python `float.hex()` (for example `0x1.999999999999ap-4`) or C `printf("%a")`. Mark it informational; comparison reads only the bit pattern.
3. Do NOT encode floats with decimal text from `str()`, `%f`, `%g`, or default `std::cout`. Default `std::cout` precision is 6 significant digits and loses bits. Standard JSON has no NaN or infinity, and Python `json.dumps` writes the non-standard token `NaN` by default.
4. Encode integers as decimal JSON numbers only when the value fits in 53 bits; otherwise as decimal strings. Record signedness and width.
5. Encode arrays as `{"dtype": "float64", "shape": [n, m], "order": "C", "data": [patterns...]}`.
6. NaN policy: state whether NaN payload bits are compared. Default rule: compare NaN by class only (any NaN equals any NaN), because x87 loads and some conversions quiet signaling NaNs and IEEE 754-2019 does not require payload preservation through arithmetic. Keep `-0.0` distinct from `+0.0` (patterns `8000000000000000` and `0000000000000000`).

### Output
Per-type encoding rules.

### Quality Gate
- Every type in `parity_contract` has an encoding rule.
- The NaN policy and the signed-zero rule are written explicitly.

---

## Phase 3: Round-Trip Test

### Entry Criteria
- Encoding rules written.

### Actions
1. Build a round-trip set: `0.0`, `-0.0`, `1.0`, `0.1`, `5e-324` (smallest subnormal), `2.2250738585072014e-308` (smallest normal), `1.7976931348623157e308`, `inf`, `-inf`, `nan`.
2. Write the set from Python, read it in the port's language, write it back, and read it in Python. Compare bit patterns.
3. Run the reverse direction: write from the port, read in Python, write, read in the port.
4. Emit `serialization_spec` with the rules and the round-trip result.

### Output
`serialization_spec`.

### Quality Gate
- Both round-trip directions report zero bit differences on all ten values (NaN compared by class per the policy).
- The spec contains the exact Python and C++ expressions used to encode and decode.

---

## Worked Example

Illustrative. Contract has `x: float64` and `state: float64[2]`.

Phase 1 picks JSON Lines. Phase 2 writes one case as:

```json
{"case": 17, "x": "3fb999999999999a", "x_hex": "0x1.999999999999ap-4", "state": {"dtype": "float64", "shape": [2], "data": ["0000000000000000", "8000000000000000"]}}
```

Phase 3 round-trip output:

```
$ python roundtrip.py --write rt.jsonl && ./rt_cpp rt.jsonl rt_back.jsonl && python roundtrip.py --check rt_back.jsonl
10/10 values bit-identical (nan compared by class)
```

---

## Exit Criteria

DONE when every contract type has a lossless encoding and both round-trip directions are bit-identical.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Port toolchain lacks `std::bit_cast` | **Adjust**: use `std::memcpy` into a `uint64_t`; it is well-defined in C++. |
| Phase 3 | `-0.0` comes back as `0.0` | **Stop**: a decimal or integer conversion is in the path; find it before any golden vector is written. |
| Phase 3 | NaN comes back as a number or a parse error | **Retry**: confirm NaN goes through the bit-pattern field, not a JSON number. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
