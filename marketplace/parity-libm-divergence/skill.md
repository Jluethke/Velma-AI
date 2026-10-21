# Parity libm Divergence Measurement

**One-line description:** Measures how far each platform's math library (glibc, musl, Apple libm, Microsoft UCRT, NumPy's own SIMD loops) is from the correctly rounded result for every transcendental function the algorithm calls, using mpmath as a high-precision oracle, and picks a mitigation per function.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `parity_contract` (object, required): Output of `parity-contract-scope`.
- `env_fingerprint` (object, required): Output of `parity-env-fingerprint` for each machine in the parity matrix.

---

## Outputs

- `libm_findings` (object[]): Per function and per platform: maximum ULP error measured against the oracle on the contract domain, the platform's documented bound if one exists, and the chosen mitigation.

---

## Phase 1: List the Functions

### Entry Criteria
- `parity_contract` names the entry points and domains.

### Actions
1. List every elementary function the reference calls: `grep -rnoE "(math|numpy|np)\.(exp|expm1|log|log1p|log2|log10|pow|sqrt|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|hypot|cbrt|erf|erfc|gamma|lgamma)\b" <reference_repo>` (path from `parity_contract`).
2. List every elementary function the port calls: `grep -rnoE "std::(exp|expm1|log|log1p|log2|log10|pow|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|hypot|cbrt|erf|erfc|tgamma|lgamma)\b|\b(exp|log|pow|sin|cos|atan2)f?\(" <port_repo>`.
3. Separate them by IEEE 754-2019 status: `sqrt` and `fma` are required to be correctly rounded (clause 5.4), so they must match bit for bit on any conforming platform. All others are only recommended to be correctly rounded (clause 9.2), and common libm implementations are not.
4. Note which reference calls go to the C library and which do not: Python `math.*` calls the platform C library; NumPy ufuncs can dispatch to NumPy's own SIMD implementations depending on CPU features (see `numpy.show_runtime()`). The reference and port may therefore use different libraries on the same machine.

### Output
Function list with source library per side.

### Quality Gate
- Every function from both greps is in the list with its library per side.

---

## Phase 2: Measure Against the Oracle

### Entry Criteria
- Function list exists.

### Actions
1. Install mpmath: `pip install mpmath`. Set `mpmath.mp.prec = 200` (bits), well above binary64's 53, so rounding the oracle to `float64` gives the correctly rounded value for practically all inputs.
2. For each function, sample inputs from the contract domain plus the golden inputs. For each input compute the oracle `float(mpmath.exp(mpmath.mpf(x)))` and the library result.
3. ULP error per input: convert both to ordered integers (see `parity-ulp-compare`) and take the absolute difference.
4. Run the same sampling on each platform in the parity matrix (the C++ side via a small driver that calls the same `std::` functions with the same flags).
5. Record the maximum ULP error per function per platform. Record the documented bound where the vendor publishes one (glibc manual section "Known Maximum Errors in Math Functions"); otherwise write "undocumented".

### Output
Measured error table.

### Quality Gate
- Every function has a measured maximum per platform with the sample count.
- Every documented bound cites its document and version.

---

## Phase 3: Choose Mitigation

### Entry Criteria
- Error table complete.

### Actions
1. Apply this table per function:

| Measured result | Mitigation |
|---|---|
| 0 ULP on every platform for all samples | bit-exact comparison allowed for this function; keep measuring in CI |
| Nonzero on some platform, bit-exact required by the contract | ship one implementation on every platform: link a correctly rounded library (for example the CORE-MATH project) or a vendored portable libm (for example OpenLibm) into the port, and call the same one from the reference through a binding |
| Nonzero, tolerance allowed by the contract | pass the measured and documented bounds to `parity-ulp-tolerance-policy`; never a guessed number |

2. Emit `libm_findings`.

### Output
`libm_findings`.

### Quality Gate
- Every function has exactly one mitigation row.

---

## Worked Example

Illustrative. Functions: `math.exp`, `math.atan2`. Platforms: glibc 2.39 x86_64, glibc 2.39 aarch64, macOS arm64.

```
$ python tests/parity/libm_oracle.py --fn exp --domain -20,20 --n 200000
exp  glibc-2.39-x86_64  max_ulp=0  samples=200000
exp  macos-14-arm64     max_ulp=1  samples=200000  worst_x=0x1.62e42fefa39efp+3
```

Mitigation for `exp`: contract requires bit-exact, so a single correctly rounded `exp` is linked into the port and exposed to the reference.

---

## Exit Criteria

DONE when every elementary function on both sides has a measured error per platform and one mitigation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Reference uses SciPy special functions | **Adjust**: add them to the list; mpmath has most of them under the same name. |
| Phase 2 | mpmath slow on large samples | **Adjust**: measure on the golden inputs first, then grow samples; record the count used. |
| Phase 3 | No single library is allowed in production | **Return**: report bit-exact parity for that function as an open question. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
