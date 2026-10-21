# Configure pkg-config for aarch64 Cross Builds

**One-line description:** Sets `PKG_CONFIG_LIBDIR`, `PKG_CONFIG_SYSROOT_DIR` and `PKG_CONFIG_PATH` so pkg-config reads the target `.pc` files from the sysroot and prefixes every returned path with the sysroot, instead of returning host library and include paths that break the cross link.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, holding the sysroot path.
- `target_triple` (string, required): Output of `xarch-target-triple-select`, for example `aarch64-linux-gnu`.

---

## Outputs

- `pkgconfig_env` (object): The three environment variables to export and the wrapper name if one exists.
- `pkgconfig_report` (object): A sample query for one library showing sysroot-prefixed `--cflags` and `--libs`.

---

## Phase 1: Point pkg-config at the Sysroot

### Entry Criteria
- `sysroot.path` and `target_triple` are present.
- The sysroot holds `.pc` files (check `find "$sysroot/path" -name '*.pc' | head`).

### Actions
1. Find the `.pc` directories in the sysroot. They are usually `<sysroot>/usr/lib/<target_triple>/pkgconfig` and `<sysroot>/usr/lib/pkgconfig` and `<sysroot>/usr/share/pkgconfig`.
2. Set `PKG_CONFIG_LIBDIR` to those dirs joined by `:`. Use `LIBDIR`, not `PKG_CONFIG_PATH` alone, because `PKG_CONFIG_PATH` only adds to the default host search path, so host `.pc` files still win. `PKG_CONFIG_LIBDIR` replaces the default set.
3. Set `PKG_CONFIG_SYSROOT_DIR=<sysroot.path>`. This prefix is prepended to the `-I` and `-L` paths that the `.pc` files contain as absolute target paths, turning `/usr/include` into `<sysroot>/usr/include`.
4. If a per-triple wrapper exists (`aarch64-linux-gnu-pkg-config`), prefer it; it sets `PKG_CONFIG_LIBDIR` to the triple dir itself. Record its name.
5. Do not set `PKG_CONFIG_SYSROOT_DIR` without `PKG_CONFIG_LIBDIR`; the wrapper would then still read host `.pc` files and only rewrite their paths, mixing host metadata with sysroot locations.

### Output
`pkgconfig_env` with the three variables.

### Quality Gate
- `PKG_CONFIG_LIBDIR` lists only paths under `sysroot.path`.
- `PKG_CONFIG_SYSROOT_DIR` equals `sysroot.path`.

---

## Phase 2: Verify a Query Returns Sysroot Paths

### Entry Criteria
- `pkgconfig_env` is set.

### Actions
1. Pick one library present in the sysroot, for example `zlib`. Export the three variables, then run `pkg-config --cflags --libs zlib`.
2. Confirm every `-I` and `-L` path it prints begins with `sysroot.path`. If any path is a bare `/usr/include` or `/usr/lib/x86_64-linux-gnu`, the sysroot prefixing is not applied; re-check `PKG_CONFIG_SYSROOT_DIR`.
3. Confirm `pkg-config --exists zlib; echo $?` prints `0` under the cross environment.
4. Record the sample query output in `pkgconfig_report`.
5. Do not hardcode `-I/usr/include` in the build to work around a failed query; fix the environment so the build stays relocatable.

### Output
`pkgconfig_env`, `pkgconfig_report`.

### Quality Gate
- `pkg-config --cflags --libs zlib` prints paths that all start with `sysroot.path`.
- `pkg-config --exists zlib` returns 0.

---

## Worked Example

Illustrative. `sysroot.path` = `/opt/sysroots/aarch64-bookworm`, `target_triple` = `aarch64-linux-gnu`.

```
$ export PKG_CONFIG_LIBDIR=/opt/sysroots/aarch64-bookworm/usr/lib/aarch64-linux-gnu/pkgconfig:/opt/sysroots/aarch64-bookworm/usr/lib/pkgconfig:/opt/sysroots/aarch64-bookworm/usr/share/pkgconfig
$ export PKG_CONFIG_SYSROOT_DIR=/opt/sysroots/aarch64-bookworm
$ pkg-config --cflags --libs zlib
-I/opt/sysroots/aarch64-bookworm/usr/include -L/opt/sysroots/aarch64-bookworm/usr/lib/aarch64-linux-gnu -lz
```

Every path begins with the sysroot, so the gate passes.

---

## Exit Criteria

DONE when a sample `pkg-config` query returns only sysroot-prefixed paths and `--exists` returns 0 under the exported cross environment.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No `.pc` files in the sysroot | **Adjust**: install the target `-dev` packages into the sysroot, or return to `xarch-sysroot-from-image` to copy `/usr/lib/<triple>/pkgconfig`. |
| Phase 2 | Query returns host `/usr` paths | **Adjust**: `PKG_CONFIG_PATH` was set instead of `PKG_CONFIG_LIBDIR`; unset `PKG_CONFIG_PATH` and set `LIBDIR`. |
| Phase 2 | Paths lack the sysroot prefix | **Adjust**: set `PKG_CONFIG_SYSROOT_DIR` and confirm pkg-config is at least version 0.28. |
| Phase 2 | `--exists` returns nonzero | **Return**: the `.pc` requires a module not in the sysroot; install it or pick a library that is present. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
