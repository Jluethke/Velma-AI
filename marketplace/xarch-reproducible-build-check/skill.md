# Make an aarch64 Cross Build Reproducible

**One-line description:** Removes build-path and timestamp nondeterminism from an aarch64 cross build with `SOURCE_DATE_EPOCH`, `-ffile-prefix-map` and sorted inputs, then proves reproducibility by building twice in different directories and comparing the stripped binaries byte for byte.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `project_dir` (string, required): Path to the project root to build reproducibly.
- `build_command` (string, required): The exact command that produces the artifact, for example `cmake --build build-aarch64` or `make`.

---

## Outputs

- `repro_verdict` (string): One of `reproducible` or `not-reproducible`.
- `repro_report` (object): The flags added, the diff tool output, and the differing sections if any.

---

## Phase 1: Remove the Known Nondeterminism Sources

### Entry Criteria
- `project_dir` and `build_command` are present.
- The build currently succeeds.

### Actions
1. Set a fixed timestamp: `export SOURCE_DATE_EPOCH=$(git -C "$project_dir" log -1 --pretty=%ct)`. GCC and many tools embed this instead of the wall clock in `__DATE__`, archive member times, and some debug records. Record the value used.
2. Map the build path out of the binary: add `-ffile-prefix-map=$PWD=.` to the compile flags (it covers `-fdebug-prefix-map` and `-fmacro-prefix-map`). Without it, the absolute source path is embedded in debug info and `__FILE__`, so a build in `/home/a` differs from `/home/b`.
3. Make archives deterministic: use `ar` with the `D` modifier (GNU `ar` defaults to deterministic mode, which zeroes member timestamps, UIDs and modes). Confirm with `aarch64-linux-gnu-ar --help | grep -A1 'D '`.
4. Sort inputs: ensure globbed source lists are sorted (`LC_ALL=C sort`) so link order does not vary with directory read order.
5. Do not set `SOURCE_DATE_EPOCH=0` if the toolchain rejects a zero timestamp; use a real commit time. Do not strip debug info just to hide the path difference; map the path instead.

### Output
The reproducibility flags applied.

### Quality Gate
- `SOURCE_DATE_EPOCH` is exported to a fixed integer.
- The compile flags include `-ffile-prefix-map`.

---

## Phase 2: Build Twice and Compare

### Entry Criteria
- The flags from Phase 1 are applied.

### Actions
1. Build once in a path and copy out the artifact: build under `/tmp/r1/<project>` with the same `SOURCE_DATE_EPOCH`, run `build_command`, save the artifact as `a1`.
2. Build again in a different path `/tmp/r2/<project>` with the identical environment, save the artifact as `a2`. Using a different path is the test; the prefix-map should make the result identical anyway.
3. Compare: `cmp a1 a2`. If they match, set `repro_verdict` to `reproducible`. If not, run `diffoscope a1 a2` (or compare section by section with `readelf -S` and `objdump -s`) to find the differing section.
4. Common remaining differences and their cause: `.comment` ordering (multiple compiler invocations), `.note.gnu.build-id` (a hash of the content, so it differs only if something else did), and `.debug_*` paths (prefix-map not applied to every TU). Record which section differed.
5. Do not declare reproducible after a single build. The proof is two independent builds comparing equal; one build proves nothing.

### Output
`repro_verdict`, `repro_report`.

### Quality Gate
- Two builds in different directories were produced.
- `cmp a1 a2` prints nothing and returns 0 for a `reproducible` verdict, or the differing section is named for `not-reproducible`.

---

## Worked Example

Illustrative. `project_dir` = `~/src/app`, `build_command` = `make`.

```
$ export SOURCE_DATE_EPOCH=$(git -C ~/src/app log -1 --pretty=%ct)
$ export CFLAGS="$CFLAGS -ffile-prefix-map=$PWD=."
$ ( cp -r ~/src/app /tmp/r1 && cd /tmp/r1 && make && cp app /tmp/a1 )
$ ( cp -r ~/src/app /tmp/r2 && cd /tmp/r2 && make && cp app /tmp/a2 )
$ cmp /tmp/a1 /tmp/a2 && echo IDENTICAL
IDENTICAL
```

`repro_verdict` = `reproducible`. `repro_report` records `SOURCE_DATE_EPOCH` and the `-ffile-prefix-map` flag.

---

## Exit Criteria

DONE when two builds in different directories compare byte-identical (`reproducible`), or the differing section is named with its cause (`not-reproducible`).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Not a git repo for the timestamp | **Adjust**: set `SOURCE_DATE_EPOCH` to a fixed integer chosen by the user and record it. |
| Phase 2 | Only `.debug_*` paths differ | **Adjust**: `-ffile-prefix-map` missed a translation unit; apply it to every compile, including generated sources. |
| Phase 2 | `.note.gnu.build-id` differs | **Adjust**: the build-id is derived from content; something upstream still differs, so keep bisecting sections. |
| Phase 2 | `diffoscope` unavailable | **Adjust**: compare with `readelf -S` section lists and `objdump -s` dumps of the differing section. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
