# Parity MSVC Floating-Point Model Check

**One-line description:** Proves an MSVC-built port uses a non-contracting, non-fast floating-point model by checking `/fp` and `/arch` options on every compile line, the `float_control` and `fp_contract` pragmas, and `dumpbin` disassembly for FMA instructions.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the port built with MSVC (`cl.exe`).
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `contraction_findings` (object[]): Each function containing an FMA instruction or a TU compiled with a contracting or fast model, with the option or pragma responsible.

---

## Phase 1: Check Options and Pragmas

### Entry Criteria
- The port is built with MSVC and `fp_flags` applied.

### Actions
1. Read every port compile line. With CMake and the Ninja generator, use `build/compile_commands.json`. With the Visual Studio generator, open each `.vcxproj` and read `<FloatingPointModel>` and `<EnableEnhancedInstructionSet>`, or build with `msbuild /v:detailed` and search the log for `cl.exe`.
2. For each TU record the `/fp:` option (`precise`, `strict`, `fast`, `contract`) and `/arch:` option. `/fp:fast` and `/fp:contract` both allow fusion. FMA instructions can only appear on x64 when `/arch:AVX2` or higher is set.
3. Read the Microsoft documentation page "/fp (Specify floating-point behavior)" for your Visual Studio version and record what it says about contraction under `/fp:precise`. Do not rely on memory; the behavior changed between Visual Studio versions.
4. Search for local overrides: `findstr /S /N /C:"#pragma float_control" /C:"#pragma fp_contract" /C:"#pragma fenv_access" *.cpp *.h` from the port root.

### Output
Per-TU `/fp` and `/arch` table plus pragma list.

### Quality Gate
- Every port TU has a recorded `/fp:` value; none is `fast` or `contract`.
- The documentation statement from step 3 is quoted with the Visual Studio version.

---

## Phase 2: Disassemble for FMA

### Entry Criteria
- Options recorded.

### Actions
1. From a Developer Command Prompt, disassemble: `dumpbin /DISASM /OUT:port.dis build\Release\port.lib` (or the `.dll` or `.exe`).
2. Search: `findstr /R /N "vfmadd vfmsub vfnmadd vfnmsub" port.dis`.
3. Map each hit to a function by the nearest preceding symbol line in `port.dis`.
4. Check the source for explicit `std::fma` or `fma(`; mark it intended only if the reference fuses at the same point.
5. Emit `contraction_findings`.

### Output
`contraction_findings`.

### Quality Gate
- `findstr` ran on the full disassembly of every port binary.
- Every hit is mapped to a function.

---

## Worked Example

Illustrative, Visual Studio 2022, x64.

```
> findstr /C:"/fp:" /C:"/arch:" build\compile_commands.json
"command": "cl.exe ... /O2 /fp:precise /arch:AVX2 ... src\\lp.cpp"
> dumpbin /DISASM /OUT:lp.dis build\Release\lp.lib
> findstr /R /N "vfmadd" lp.dis
(no output)
```

`/arch:AVX2` makes FMA available, `/fp:precise` is set, and the disassembly has no FMA, so `contraction_findings` is empty.

---

## Exit Criteria

DONE when every TU is on a non-fast, non-contract `/fp` model, pragmas are accounted for, and the disassembly has no unexplained FMA.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Mixed `/fp` models across TUs | **Adjust**: set `/fp:precise` on the target in CMake with `target_compile_options` and rebuild. |
| Phase 1 | `.vcxproj` overrides CMake settings per file | **Return**: report the file-level override to the user; do not edit generated project files. |
| Phase 2 | `dumpbin` not on PATH | **Retry**: open "x64 Native Tools Command Prompt" from the Visual Studio install. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
