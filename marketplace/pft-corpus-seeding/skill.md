# Seed Corpus and Dictionary

**One-line description:** Collects valid and edge-case sample inputs for each fuzz target, places them in the exact directory layout the stack's fuzzer reads (libFuzzer corpus dirs, `fuzz/corpus/<target>/`, `testdata/fuzz/<FuzzName>/` with the `go test fuzz v1` header, Jazzer `Inputs` dirs), minimizes the set with the fuzzer's own merge, and writes a token dictionary in the AFL/libFuzzer dictionary format.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fuzz_targets` (object[], required): Targets with input shape from `pft-fuzz-target-selection`.
- `stack` (string, required): `cpp`, `rust`, `go`, `python` or `jvm`.
- `repo_path` (string, required): Project root.
- `sample_inputs` (string, optional): Directory of real sample files supplied by the user.

---

## Outputs

- `seed_corpus` (object[]): One row per target: corpus directory, file count before and after minimization, sources used.
- `fuzz_dictionary` (object[]): One row per target: dictionary file path, token count, token sources. Empty for Go (native Go fuzzing has no dictionary option).

---

## Phase 1: Collect Seeds

### Entry Criteria
- `fuzz_targets` has rows with an input shape.

### Actions
1. Gather candidate seeds from these sources in order, keeping a note of each source:

| Source | How |
|---|---|
| `sample_inputs` | copy files as given |
| Existing test fixtures | `git ls-files \| grep -iE "fixtures\|testdata\|samples"` filtered by the target's format extension |
| Format specification examples | copy the examples from the spec or RFC by hand into files |
| Edge cases from the catalog | empty input, one byte, maximum documented field values, every documented error case |
| Upstream project corpora | only with a license that allows it; record the license |

2. Never add secrets, personal data or customer files to a committed corpus. If a sample contains them, leave it out.
3. Remove exact duplicates: `sha1sum * | sort | uniq -w40 -d` lists duplicates to delete.
4. Leave out files larger than the target's realistic input size. If no size is documented, keep all and let the fuzzer's `-max_len` default handle it; record the open question.

### Output
Raw seed directory per target.

### Quality Gate
- Every seed has a recorded source.
- `grep -rlE "BEGIN (RSA\|OPENSSH) PRIVATE KEY\|password=" <seed dir>` prints nothing.

---

## Phase 2: Place Seeds in the Fuzzer's Layout

### Entry Criteria
- Raw seeds exist.

### Actions
1. Copy seeds into the layout the stack expects:

| `stack` | Seed corpus location | Notes |
|---|---|---|
| cpp | `fuzz/corpus/<target>/` (any directory passed as a positional argument) | libFuzzer reads all files in each directory argument and writes new inputs to the first one |
| rust | `fuzz/corpus/<target>/` | cargo-fuzz default corpus for `cargo fuzz run <target>` |
| python | `fuzz/corpus/<target>/` passed as a positional argument | Atheris uses libFuzzer arguments |
| go | `testdata/fuzz/<FuzzName>/<any name>` with the corpus file format, and `f.Add(...)` calls in the test | each file starts with the line `go test fuzz v1` followed by one Go literal per fuzz argument, for example `[]byte("GIF89a")` |
| jvm | `src/test/resources/<package path>/<ClassName>Inputs/<methodName>/` for `@FuzzTest` | files there also run as regression inputs on plain `mvn test` |

2. Convert files for Go with a tiny script that writes the header and a `[]byte(...)` literal using `strconv.Quote`-style escaping, or use `f.Add(data)` for short seeds. Check one converted file by running `go test -run=<FuzzName> ./<pkg>`; malformed files fail with a parse error.

### Output
Seeds in place.

### Quality Gate
- cpp, rust, python: `ls fuzz/corpus/<target> | wc -l` matches the raw count.
- go: `go test -run=<FuzzName> ./<pkg>` exits 0 and runs each seed (`-v` shows a subtest per file).
- jvm: plain `mvn test -Dtest=<Class>` runs the inputs without fuzzing and exits 0.

---

## Phase 3: Minimize and Write the Dictionary

### Entry Criteria
- Seeds placed.

### Actions
1. Minimize to the inputs that add coverage, using the fuzzer's own tool:

| `stack` | Minimize |
|---|---|
| cpp, python | `mkdir corpus_min && ./fuzz_target -merge=1 corpus_min fuzz/corpus/<target>` (python: `python fuzz_x.py -merge=1 corpus_min fuzz/corpus/<target>`), then replace the corpus with `corpus_min` |
| rust | `cargo +nightly fuzz cmin <target>` |
| go | no built-in minimizer; keep seeds small and few |
| jvm | Jazzer passes libFuzzer flags in standalone mode; check its docs before using `-merge=1` |

2. Read the merge summary line, for example `MERGE-OUTER: 12 new files with 340 new features added; 340 new coverage edges`, and record before and after counts.
3. Write a dictionary for formats with keywords or magic values, one entry per line in the AFL/libFuzzer format:

```text
# fuzz/png.dict
magic="\x89PNG\x0d\x0a\x1a\x0a"
ihdr="IHDR"
idat="IDAT"
iend="IEND"
```

Take tokens from the spec, from `#define` and `enum` constants in the parser (`grep -rnE "case '|== \"" src/parser*`), and from libFuzzer's `###### Recommended dictionary. ######` block printed at the end of a run.
4. Check the dictionary parses: `./fuzz_target -dict=fuzz/png.dict -runs=1 fuzz/corpus/png` prints `Dictionary: N entries` with no `ParseDictionaryFile` error.

### Output
`seed_corpus`, `fuzz_dictionary`.

### Quality Gate
- The merge or cmin step finished with a summary line recorded.
- Every dictionary loads with the `Dictionary: N entries` line and N equals the token count.

---

## Worked Example

Illustrative. `stack` = `go`, target `FuzzParseHeader`, 9 fixture files under `internal/hdr/fixtures/`.

```text
$ head -2 internal/hdr/testdata/fuzz/FuzzParseHeader/seed-01
go test fuzz v1
[]byte("Content-Type: text/plain; charset=utf-8\r\n")
$ go test -run=FuzzParseHeader -v ./internal/hdr
=== RUN   FuzzParseHeader
=== RUN   FuzzParseHeader/seed-01
...
--- PASS: FuzzParseHeader (0.00s)
ok      example.com/svc/internal/hdr  0.012s
```

`seed_corpus`: 9 files from fixtures, no minimization (Go). `fuzz_dictionary`: empty with the note "go native fuzzing has no dictionary option".

---

## Exit Criteria

DONE when each target has a minimized, secret-free seed corpus in its fuzzer's layout and, where the fuzzer supports it, a dictionary that loads.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No samples anywhere | **Adjust**: write seeds by hand from the spec examples and catalog edge cases; an empty corpus also works but starts slower. |
| Phase 1 | Samples contain personal data | **Stop**: exclude them and report; never commit them. |
| Phase 2 | Go corpus file fails to parse | **Retry**: regenerate with exact header `go test fuzz v1` and one literal per argument in order. |
| Phase 3 | Merge crashes on a seed | **Return**: a seed already triggers a bug; send it to `pft-crash-triage-dedup`, remove it from the corpus, rerun the merge. |
| Phase 3 | Dictionary parse error | **Adjust**: escape non-printable bytes as `\xNN` and quote every value. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
