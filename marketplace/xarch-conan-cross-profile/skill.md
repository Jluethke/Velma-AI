# Write a Conan Cross Profile for aarch64

**One-line description:** Writes a Conan 2 host profile for aarch64 Linux with the `[settings]`, `[buildenv]` and `[conf]` blocks pointing at the cross compiler, keeps a separate build profile for the host, and runs `conan install` with both profiles so dependencies are built or fetched for the target.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_triple` (string, required): Output of `xarch-target-triple-select`, for example `aarch64-linux-gnu`.
- `toolchain_prefix` (string, required): Output of `xarch-gcc-toolchain-select`, for example `aarch64-linux-gnu-`.
- `sysroot` (object, required): Output of `xarch-sysroot-from-image`, holding the sysroot path.
- `project_dir` (string, required): Path to the project root that holds `conanfile.txt` or `conanfile.py`.

---

## Outputs

- `conan_profile` (string): Path to the written aarch64 host profile.
- `conan_report` (object): The settings chosen, the install result, and whether dependencies were built from source or fetched.

---

## Phase 1: Write the Host Profile

### Entry Criteria
- `conan` version 2 is installed (`conan --version`).
- `project_dir` holds a conanfile.

### Actions
1. Write a host profile `aarch64-linux` with these blocks:

```
[settings]
os=Linux
arch=armv8
compiler=gcc
compiler.version=11
compiler.cppstd=17
compiler.libcxx=libstdc++11
build_type=Release

[buildenv]
CC=aarch64-linux-gnu-gcc
CXX=aarch64-linux-gnu-g++
AR=aarch64-linux-gnu-ar
STRIP=aarch64-linux-gnu-strip

[conf]
tools.build:sysroot=/opt/sysroots/aarch64-bookworm
```

Substitute `toolchain_prefix` and `sysroot.path`. Conan's `arch` value for AArch64 is `armv8`, not `aarch64`; using `aarch64` makes Conan reject the profile.
2. Set `compiler.version` to match the installed cross gcc major version (`aarch64-linux-gnu-gcc -dumpversion`). A mismatch changes the package ID and can pull an incompatible prebuilt.
3. Keep the default build profile for the host; do not put cross settings in it. Conan uses two profiles: build (tools that run during the build, on the host) and host (the target).
4. Do not edit the global `~/.conan2/profiles/default`; write a named profile so the default stays usable for native builds.

### Output
`conan_profile` path.

### Quality Gate
- `conan profile show -pr:h aarch64-linux` prints without error and shows `arch=armv8`.
- The `[buildenv]` block names the prefixed cross compilers.

---

## Phase 2: Install with Both Profiles

### Entry Criteria
- The host profile exists.

### Actions
1. Install: `conan install "$project_dir" -pr:b default -pr:h aarch64-linux --build=missing`. `-pr:b` is the build profile (host), `-pr:h` is the host profile (aarch64). `--build=missing` builds from source any dependency with no matching prebuilt.
2. Read the output. Conan prints each dependency with its package ID; confirm the dependencies show `arch=armv8`. If one shows `arch=x86_64`, it was resolved with the build profile; re-check the `-pr:h` flag.
3. If a dependency fails to cross-build, read its error; often it needs the sysroot path passed through `tools.build:sysroot`, which the profile sets. Record which dependencies built from source.
4. Do not pass `--build=never` to force prebuilts; aarch64 prebuilts may not exist and you would get a resolve error, not a build.

### Output
`conan_profile`, `conan_report`.

### Quality Gate
- `conan install` exits 0.
- The install graph shows the target dependencies with `arch=armv8`.

---

## Worked Example

Illustrative. `project_dir` = `~/src/app`, cross gcc 11.

```
$ conan profile show -pr:h aarch64-linux | grep arch
arch=armv8
$ conan install ~/src/app -pr:b default -pr:h aarch64-linux --build=missing
...
zlib/1.3: Building from source
Install finished successfully
```

`conan_report` = `{ "arch": "armv8", "built_from_source": ["zlib/1.3"], "result": "ok" }`.

---

## Exit Criteria

DONE when the host profile shows `arch=armv8` with the cross compilers, `conan install` exits 0, and the dependency graph is for the target arch.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Conan rejects `arch=aarch64` | **Adjust**: Conan's AArch64 value is `armv8`; set it and confirm with the official Conan settings reference. |
| Phase 1 | `compiler.version` mismatch warning | **Adjust**: set it to the cross gcc major from `-dumpversion`. |
| Phase 2 | Dependency resolves to x86_64 | **Adjust**: the host profile was not passed with `-pr:h`; re-run with both profiles. |
| Phase 2 | Prebuilt not found and build fails | **Return**: add the dependency's target `-dev` prerequisite to the sysroot, then re-run `--build=missing`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
