# CMake Build Profiles for Safety Verification

**One-line description:** Sets up separate CMake build directories (target release, host unit test, coverage, sanitizer) with a compile_commands.json for each, so analysis, coverage and sanitizer runs never contaminate the build that goes into the vehicle ECU.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `codebase_dir` (string, required): Source tree root containing the top-level `CMakeLists.txt`.
- `stack` (string, required): Compiler family for host verification builds, "gcc" or "clang".
- `language` (string, required): "c" or "cpp". Selects `CMAKE_C_FLAGS` or `CMAKE_CXX_FLAGS` (both when the project mixes languages) for the added profile flags.
- `toolchain_file` (string, optional): Path to the cross-compilation CMake toolchain file for the target (for example `cmake/arm-none-eabi.cmake`). Absent means the project has no cross build yet.

---

## Outputs

- `build_profiles` (object): For each profile (target, host-test, coverage, sanitizer): the build directory, the exact configure command, the compiler and version, the flags added, and the path to its `compile_commands.json`.

---

## Phase 1: Inspect the Existing Build

### Entry Criteria
- `codebase_dir/CMakeLists.txt` exists.
- `cmake --version` prints a version (record it).

### Actions
1. Run `cmake --version`, `gcc --version` or `clang --version` (matching `stack`), and, if `toolchain_file` is set, the cross compiler named in it with `--version`. Record each first line.
2. Read the top-level `CMakeLists.txt` and list: `project()` languages, `CMAKE_C_STANDARD`/`CMAKE_CXX_STANDARD`, any `add_compile_options`, `target_compile_options`, and `option()` switches.
3. Check for `CMakePresets.json`. If it exists, do not rewrite it; add new presets only after showing the user the diff.
4. Do NOT edit compiler flags of the target build in this flow. The target profile reproduces the existing release build exactly.

### Output
Inventory of the current build and tool versions.

### Quality Gate
- Tool versions are recorded from command output, not guessed.
- The existing release flags are listed exactly as they appear in the CMake files.

---

## Phase 2: Create the Four Profiles

### Entry Criteria
- Inventory complete.

### Actions
1. Create one build directory per profile, outside the source tree or under `build/`: `build/target`, `build/host-test`, `build/coverage`, `build/sanitizer`. Never reuse one directory for two profiles; CMake caches flags.
2. Configure each with `-DCMAKE_EXPORT_COMPILE_COMMANDS=ON`:
   - target: `cmake -S . -B build/target -DCMAKE_TOOLCHAIN_FILE=<toolchain_file> -DCMAKE_BUILD_TYPE=Release -DCMAKE_EXPORT_COMPILE_COMMANDS=ON` (skip when `toolchain_file` is absent and record that).
   - host-test: `cmake -S . -B build/host-test -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON` with `CC`/`CXX` set to the `stack` compiler.
   - coverage (gcc): add `-DCMAKE_C_FLAGS="--coverage -O0" -DCMAKE_CXX_FLAGS="--coverage -O0" -DCMAKE_EXE_LINKER_FLAGS=--coverage`.
   - coverage (clang): add `-DCMAKE_C_FLAGS="-fprofile-instr-generate -fcoverage-mapping -O0"` and the same for `CMAKE_CXX_FLAGS` and `CMAKE_EXE_LINKER_FLAGS=-fprofile-instr-generate`.
   - sanitizer: add `-DCMAKE_C_FLAGS="-fsanitize=address,undefined -fno-omit-frame-pointer -fno-sanitize-recover=all -g -O1"` (same for C++ and linker flags).
3. If the project has a `BUILD_TESTING` option or uses `include(CTest)`, pass `-DBUILD_TESTING=ON` to the three host profiles and `OFF` to target.
4. Build each: `cmake --build build/<profile> -j`. Record the exit code.

### Output
Four configured and built directories.

### Quality Gate
- `build/<profile>/compile_commands.json` exists for every configured profile (`ls build/*/compile_commands.json`).
- `grep -c -- "--coverage\|-fprofile-instr-generate" build/target/compile_commands.json` prints 0.
- `grep -c -- "-fsanitize" build/target/compile_commands.json` prints 0.

---

## Phase 3: Record the Profiles

### Entry Criteria
- All builds attempted.

### Actions
1. Write `build_profiles` with directory, configure command, compiler version, added flags and compile database path per profile.
2. For any profile that failed to build, record the first compiler error line verbatim and the file it names. Do not change source code to make a verification profile build.
3. Add `build/` to `.gitignore` only if the user approves; do not commit build directories.

### Output
`build_profiles`.

### Quality Gate
- Each profile entry contains a configure command that can be pasted and rerun.
- Failed profiles list a verbatim error line.

---

## Worked Example

Illustrative only. A body controller ECU with `toolchain_file` = `cmake/arm-none-eabi.cmake`, `stack` = "gcc".

```
$ cmake -S . -B build/coverage -DCMAKE_BUILD_TYPE=Debug -DCMAKE_EXPORT_COMPILE_COMMANDS=ON \
    -DCMAKE_C_FLAGS="--coverage -O0" -DCMAKE_EXE_LINKER_FLAGS=--coverage -DBUILD_TESTING=ON
-- The C compiler identification is GNU 13.2.0
-- Build files have been written to: /home/dev/body-ctrl/build/coverage
$ grep -c -- "--coverage" build/target/compile_commands.json
0
```

`build_profiles.coverage.compile_db` = `build/coverage/compile_commands.json`.

---

## Exit Criteria

DONE when every applicable profile has its own build directory and compile database, and the target profile contains no coverage or sanitizer flags.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Project uses plain Makefiles, not CMake | **Adjust**: generate `compile_commands.json` with `bear -- make` and create one make invocation per profile with `CFLAGS` overrides; record the commands. |
| Phase 2 | Host build fails because code includes target-only headers (vendor HAL) | **Return**: report the header; host builds need a hardware abstraction stub supplied by the unit test flows, not edits to production code. |
| Phase 2 | Sanitizer link fails with missing `libasan` | **Adjust**: install the compiler's sanitizer runtime package or switch the sanitizer profile to clang; record which. |
| Phase 3 | Target build output differs from the known release binary | **Stop**: the target profile must reproduce the release build; report the flag difference before continuing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
