# Write a Meson Cross File and Build for aarch64

**One-line description:** Writes a Meson cross file with the `[binaries]`, `[host_machine]` and `[properties]` sections for an aarch64 Linux target, sets `sys_root` and `pkg_config_libdir` so pkg-config reads the sysroot, then configures and compiles with `meson setup --cross-file` and verifies the artifact.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_triple` (string, required): Output of `xarch-target-triple-select`, for example `aarch64-linux-gnu`.
- `toolchain_prefix` (string, required): Output of `xarch-gcc-toolchain-select`, for example `aarch64-linux-gnu-`.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, holding the sysroot path.
- `project_dir` (string, required): Path to the Meson project root that holds `meson.build`.

---

## Outputs

- `meson_cross_file` (string): Path to the written cross file.
- `meson_report` (object): The configured build dir, the detected host machine, and the artifact verification result.

---

## Phase 1: Write the Cross File

### Entry Criteria
- `target_triple`, `toolchain_prefix`, `sysroot.path` and `project_dir` are present.

### Actions
1. Write `aarch64-cross.ini` with these sections:

```
[binaries]
c = 'aarch64-linux-gnu-gcc'
cpp = 'aarch64-linux-gnu-g++'
ar = 'aarch64-linux-gnu-ar'
strip = 'aarch64-linux-gnu-strip'
pkg-config = 'pkg-config'

[host_machine]
system = 'linux'
cpu_family = 'aarch64'
cpu = 'aarch64'
endian = 'little'

[properties]
sys_root = '/opt/sysroots/aarch64-bookworm'
pkg_config_libdir = '/opt/sysroots/aarch64-bookworm/usr/lib/aarch64-linux-gnu/pkgconfig:/opt/sysroots/aarch64-bookworm/usr/lib/pkgconfig'
```

Substitute the prefix and sysroot path. `cpu_family` must be `aarch64`, one of Meson's known values; a wrong family makes `host_machine.cpu_family()` checks in `meson.build` take the wrong branch.
2. `[host_machine]` describes the machine the output runs on. Do not fill `[build_machine]`; Meson infers the build host. Setting the host section is what makes `meson.is_cross_build()` return true.
3. Set `sys_root` in `[properties]`; Meson passes it as `--sysroot` to the compiler. Set `pkg_config_libdir` so the per-build pkg-config reads the sysroot `.pc` files.
4. Do not put the cross settings in `meson.build`; they belong in the cross file passed at setup time.

### Output
`meson_cross_file` path.

### Quality Gate
- The file has `[binaries]`, `[host_machine]` and `[properties]` sections.
- `cpu_family` is exactly `aarch64` and `endian` is `little`.

---

## Phase 2: Setup, Compile, Verify

### Entry Criteria
- `meson_cross_file` is written.

### Actions
1. Configure a fresh build dir: `meson setup build-aarch64 --cross-file "$meson_cross_file" "$project_dir"`. Use a new dir; a build dir configured for the host cannot be switched to cross.
2. Read the setup summary. It must print a `Host machine cpu family: aarch64` line and `Build type: cross build`. If it says native build, the `[host_machine]` section is missing or malformed.
3. Compile: `meson compile -C build-aarch64`.
4. Verify an artifact: `readelf -h build-aarch64/<target> | grep Machine` must print `AArch64`.
5. Do not add `-Dc_args` with a hardcoded host include path to fix a missing header; add the `-dev` package to the sysroot instead.

### Output
`meson_cross_file`, `meson_report`.

### Quality Gate
- `meson setup` summary shows `cpu family: aarch64` and a cross build.
- `readelf -h` on a built target shows `Machine: AArch64`.

---

## Worked Example

Illustrative. `project_dir` = `~/src/tool`, prefix `aarch64-linux-gnu-`, sysroot `/opt/sysroots/aarch64-bookworm`.

```
$ meson setup build-aarch64 --cross-file aarch64-cross.ini ~/src/tool
Host machine cpu family: aarch64
Host machine cpu: aarch64
Build type: cross build
$ meson compile -C build-aarch64
$ readelf -h build-aarch64/tool | grep Machine
  Machine:                           AArch64
```

`meson_report` = `{ "build_dir": "build-aarch64", "cross": true, "machine": "AArch64" }`.

---

## Exit Criteria

DONE when `meson setup` reports a cross build with cpu family aarch64, compile succeeds, and the artifact is an `AArch64` ELF.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Unsure of a valid `cpu_family` value | **Adjust**: `aarch64` is in Meson's known cpu-family table; confirm in the official Meson cross-compilation reference rather than inventing one. |
| Phase 2 | Setup reports a native build | **Adjust**: the `[host_machine]` section is missing or has a typo; fix it and re-run setup on a clean dir. |
| Phase 2 | pkg-config finds host libraries | **Adjust**: set `pkg_config_libdir` in `[properties]` to the sysroot dirs. |
| Phase 2 | Artifact is X86-64 | **Stop**: the `[binaries] c` entry points at the host gcc; set it to the cross compiler. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
