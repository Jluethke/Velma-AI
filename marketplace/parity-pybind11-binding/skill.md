# Parity pybind11 Binding

**One-line description:** Exposes the C++ port to Python with pybind11 so the reference and the port run in one process for differential testing, while making sure the binding links the same production library and flags instead of recompiling the port with Python's own compiler flags.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `port_repo` (string, required): Path to the C++ port using CMake.
- `parity_contract` (object, required): Output of `parity-contract-scope`.
- `fp_flags` (string[], required): Output of `parity-fp-flag-baseline`.

---

## Outputs

- `py_binding` (string): Importable module name and the build command, for example `parity_port` built by `pip install ./tests/parity/binding`.

---

## Phase 1: Write the Binding

### Entry Criteria
- The port builds as a CMake library target.

### Actions
1. Add pybind11 with `find_package(pybind11 CONFIG REQUIRED)` (installed with `pip install pybind11` and located with `-Dpybind11_DIR=$(python -m pybind11 --cmakedir)`), or with `FetchContent` pinned to a release tag.
2. Create `tests/parity/binding/binding.cpp`:
   ```cpp
   #include <pybind11/pybind11.h>
   #include <pybind11/stl.h>
   #include "lp/lp.hpp"
   PYBIND11_MODULE(parity_port, m) {
     m.def("step", [](double x, std::array<double,2> s) { double y = lp::step(x, s); return std::make_tuple(y, s); });
   }
   ```
   Return carried state explicitly; Python cannot see writes through a C++ reference.
3. Bind one function per contract entry point. Match argument order to the reference so the differential test can call both with `*args`.
4. Do NOT reimplement any port logic in the lambda; it only adapts types.

### Output
Binding source.

### Quality Gate
- One `m.def` per entry point in `parity_contract`.
- Each lambda body calls a port symbol and contains no arithmetic on the values.

---

## Phase 2: Build Against the Production Library

### Entry Criteria
- Binding source exists.

### Actions
1. In CMake: `pybind11_add_module(parity_port tests/parity/binding/binding.cpp)` and `target_link_libraries(parity_port PRIVATE <port_target>)`. The port target carries `fp_flags`; the binding adds no float flags of its own.
2. The port library must be built with `CMAKE_POSITION_INDEPENDENT_CODE ON` to link into a Python extension; this does not change floating-point results.
3. Do NOT build the port sources through `setuptools.Extension`; that path compiles with the flags from `sysconfig.get_config_var("CFLAGS")`, which differ from production.
4. Build and import: `cmake --build build --target parity_port` then `PYTHONPATH=build python -c "import parity_port; print(parity_port.step(0.1, [0.0, 0.0]))"`.
5. Re-run the subnormal probe from `parity-denormal-ftz-daz` after `import parity_port` to confirm the import does not change FTZ or DAZ.

### Output
`py_binding`.

### Quality Gate
- `compile_commands.json` shows the port sources compiled once, with `fp_flags`, and linked into `parity_port`.
- For 100 golden cases, `parity_port` outputs are bit-identical to `parity_harness` outputs on the same machine.

---

## Worked Example

Illustrative.

```
$ cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -Dpybind11_DIR=$(python -m pybind11 --cmakedir)
$ cmake --build build --target parity_port
$ PYTHONPATH=build python -c "import parity_port; print(parity_port.step(0.1, [0.0, 0.0]))"
(0.1, [0.1, 0.0])
$ PYTHONPATH=build python tests/parity/binding_vs_harness.py --n 100
100/100 bit-identical between parity_port and parity_harness
```

---

## Exit Criteria

DONE when the module imports, wraps every entry point without logic, and matches the standalone harness bit for bit.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 2 | Link error about relocation `R_X86_64_32` | **Adjust**: set `POSITION_INDEPENDENT_CODE ON` on the port target. |
| Phase 2 | Binding and harness disagree | **Stop**: the binding is compiled differently or alters types (for example `float` vs `double` overload); fix before differential testing. |
| Phase 2 | Import changes FTZ or DAZ | **Return**: route to `parity-fast-math-audit`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
