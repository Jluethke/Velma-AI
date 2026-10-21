# Statically Link an aarch64 Binary with musl

**One-line description:** Rebuilds a C or C++ program for aarch64 against the musl cross toolchain with `-static` so it carries no glibc dependency, which sidesteps the `GLIBC_2.XX not found` class of runtime errors on older targets, and verifies the result has no dynamic interpreter.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `link_mode` (string, required): Link strategy. This flow runs when it is `static-musl`.
- `target_triple` (string, required): Output of `xarch-target-triple-select`, used to confirm an aarch64 musl target.
- `project_dir` (string, required): Path to the project root to rebuild.
- `missing_libs` (object[], required): Output of `xarch-ldd-shared-deps-audit`. The glibc or shared dependency problems this static build is meant to avoid. May be empty.

---

## Outputs

- `static_binary` (object): The output path, the linkage check, and the confirmation that no interpreter is present.
- `static_report` (object): The musl toolchain used, the static flags, and the size before and after strip.

---

## Phase 1: Install the musl Cross Toolchain

### Entry Criteria
- `link_mode` is `static-musl`.
- The project is C or C++ (Rust and Go have their own musl paths).

### Actions
1. Get an aarch64 musl cross toolchain. Options: the distro `musl-cross` style package if present, or a prebuilt `aarch64-linux-musl-cross` toolchain. Record the prefix, for example `aarch64-linux-musl-`.
2. Confirm it is musl and aarch64: `aarch64-linux-musl-gcc -dumpmachine` prints an `aarch64-*-musl` triple. Compile a probe and check `readelf -h` shows `AArch64`.
3. A static glibc build (`-static` with `aarch64-linux-gnu-gcc`) is possible but glibc warns that functions like `getaddrinfo` still dlopen NSS modules at runtime, so it is not truly self-contained. musl static has no such caveat, which is why it is preferred for a portable single file. Record this reason.
4. Do not mix musl headers with a glibc sysroot; use the musl toolchain's own sysroot, which it carries.

### Output
The musl toolchain prefix.

### Quality Gate
- `aarch64-linux-musl-gcc -dumpmachine` prints an `aarch64-*-musl` triple.
- A probe compiles and `readelf -h` shows `Machine: AArch64`.

---

## Phase 2: Build Static and Verify

### Entry Criteria
- The musl toolchain is confirmed.

### Actions
1. Rebuild with static linking. For a plain build: `aarch64-linux-musl-gcc -static -O2 main.c -o app-static`. For CMake, pass `-DCMAKE_EXE_LINKER_FLAGS=-static` and set the musl compiler in the toolchain file. For a `Makefile`, add `-static` to `LDFLAGS`.
2. For C++ add `-static-libstdc++ -static-libgcc` as well, or rely on `-static` pulling them in; confirm no `libstdc++.so` remains in the NEEDED list.
3. Verify there is no interpreter: `readelf -l app-static | grep -i interp` prints nothing, and `readelf -d app-static` prints `There is no dynamic section in this file` (or no NEEDED lines). `file app-static` reports `statically linked`.
4. Strip and record size: `aarch64-linux-musl-strip app-static`; record `ls -l` size before and after.
5. Do not keep partial dynamic linking (for example `-Wl,-Bstatic` on only one library) if the goal is a self-contained file; confirm the final NEEDED list is empty.

### Output
`static_binary`, `static_report`.

### Quality Gate
- `readelf -l app-static | grep -i interp` prints nothing.
- `file app-static` reports `statically linked` and `readelf -h` shows `Machine: AArch64`.

---

## Worked Example

Illustrative. `link_mode` = `static-musl`, `project_dir` = `~/src/tool`, `missing_libs` listed `libstdc++.so.6` not in the glibc sysroot.

```
$ aarch64-linux-musl-gcc -dumpmachine
aarch64-linux-musl
$ aarch64-linux-musl-g++ -static -static-libstdc++ -O2 tool.cpp -o tool-static
$ readelf -l tool-static | grep -i interp
(no output)
$ file tool-static
tool-static: ELF 64-bit LSB executable, ARM aarch64, statically linked, ...
```

`static_binary` = `{ "path": "tool-static", "interpreter": null, "machine": "AArch64", "linkage": "static" }`. The glibc version error the audit reported no longer applies.

---

## Exit Criteria

DONE when the binary is an `AArch64` ELF with no interpreter and an empty NEEDED list, confirmed by `readelf`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `link_mode` is not `static-musl` | **Skip**: this flow does not apply; emit empty outputs. |
| Phase 1 | No musl cross toolchain available | **Return**: fetch a prebuilt `aarch64-linux-musl-cross` and set its prefix; confirm its download source with the user. |
| Phase 2 | `-static` fails with `undefined reference` | **Adjust**: a dependency has no static archive (`.a`); install the static dev package or keep that one dynamic and document it. |
| Phase 2 | Interpreter still present | **Adjust**: `-static` was dropped by a later flag; check the final link line, not just `CFLAGS`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
