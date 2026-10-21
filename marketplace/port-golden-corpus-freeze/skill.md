# Port Golden Corpus Freeze

**One-line description:** Validates the captured golden corpus against the schema (valid JSON per line, required keys, unique ids, typed encodings only), writes a manifest and SHA-256 checksums, commits and tags it, and makes it read-only so no later step can quietly rewrite expected outputs to match the port.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.
- `py_corpus` (object, optional): Output of `port-py-golden-capture` when the source is Python.
- `js_corpus` (object, optional): Output of `port-js-golden-capture` when the source is JavaScript.
- `java_corpus` (object, optional): Output of `port-java-golden-capture` when the source is Java.
- `c_corpus` (object, optional): Output of `port-c-golden-capture` when the source is C.

---

## Outputs

- `golden_corpus` (object): Path to the frozen `golden/` directory, the git tag, total record count, and counts by `expect.kind`.
- `corpus_manifest` (object): Contents of `golden/MANIFEST.json`: schema version, reference commit, environment, per-file record count and SHA-256.

---

## Phase 1: Validate

### Entry Criteria
- Exactly one of `py_corpus`, `js_corpus`, `java_corpus`, `c_corpus` is present. If zero or more than one, stop.

### Actions
1. Every line is JSON: `for f in golden/B-*.jsonl; do jq -c . "$f" > /dev/null || echo "BAD $f"; done`. No output means pass.
2. Required keys on every record: `jq -c 'select((has("id") and has("behavior") and has("call") and has("input") and has("expect") and has("tags")) | not) | .id' golden/B-*.jsonl` must print nothing.
3. Unique ids: `jq -r .id golden/B-*.jsonl | sort | uniq -d` must print nothing.
4. Allowed kinds: `jq -r .expect.kind golden/B-*.jsonl | sort | uniq -c` shows only `ok`, `error`, `process`, `ub`.
5. No raw JSON numbers anywhere (every number must be typed; `exit_code` in `process` records is the only allowed number): `jq -r 'select(del(.expect.exit_code) | [paths(numbers)] | length > 0) | .id' golden/B-*.jsonl` must print nothing.
6. Every error category exists in `golden/categories.json`: `jq -r 'select(.expect.kind=="error") | .expect.category' golden/B-*.jsonl | sort -u` is a subset of the category list.
7. Every in-scope behavior has a file: compare `ls golden/B-*.jsonl` with the in-scope ids.

### Output
Validation log with each command and its output.

### Quality Gate
- Commands 1, 2, 3 and 5 print nothing; command 4 prints only allowed kinds; command 6's output is a subset of the categories; command 7 finds no missing behavior.

---

## Phase 2: Checksum and Manifest

### Entry Criteria
- Validation passed.

### Actions
1. Write checksums: `(cd golden && sha256sum B-*.jsonl rules.json categories.json SCHEMA.md ENV.json > SHA256SUMS)`. On macOS use `shasum -a 256`.
2. Verify immediately: `(cd golden && sha256sum -c SHA256SUMS)` prints `OK` for every file.
3. Write `golden/MANIFEST.json` with: schema version (start at `1`), reference commit (from `ENV.json`), source language, capture command, per-file record count (`wc -l`), per-file SHA-256, and counts by kind.
4. Validate: `jq . golden/MANIFEST.json` exits 0.

### Output
`golden/SHA256SUMS`, `golden/MANIFEST.json`.

### Quality Gate
- `sha256sum -c SHA256SUMS` reports `OK` for every line and exit status 0.
- Sum of per-file counts in the manifest equals `cat golden/B-*.jsonl | wc -l`.

---

## Phase 3: Commit, Tag, Lock

### Entry Criteria
- Manifest written.

### Actions
1. Commit only the corpus: `git add golden/ && git commit -m "golden: freeze corpus v1 (<N> records)"`. Do not include harness changes in the same commit.
2. Tag: `git tag golden-v1`. Later regenerations get `golden-v2` with a written reason; never move a tag.
3. Remove write permission locally: `chmod -R a-w golden/` (POSIX) or `attrib +R golden\* /S` (Windows). This stops editors and agents from overwriting files by accident; it is not security.
4. Add a check the target repo's CI runs on every build, after copying: `sha256sum -c SHA256SUMS` from the golden directory. A failing checksum fails the build.
5. Write the corpus rule into the target repo's contributor notes: expected outputs change only by recapturing from the source at a new tag, never by editing a line or by recording the port's output.

### Output
`golden_corpus`, `corpus_manifest`.

### Quality Gate
- `git tag --list golden-v1` prints `golden-v1`.
- `git show --stat golden-v1` lists only files under `golden/`.
- Writing to a corpus file fails: `touch golden/B-001.jsonl` returns "Permission denied" on POSIX.

---

## Worked Example

Illustrative. Python source, 312 records.
```
$ jq -r .id golden/B-*.jsonl | sort | uniq -d
$ jq -r .expect.kind golden/B-*.jsonl | sort | uniq -c
    287 ok
     25 error
$ (cd golden && sha256sum B-*.jsonl rules.json categories.json SCHEMA.md ENV.json > SHA256SUMS && sha256sum -c SHA256SUMS)
B-001.jsonl: OK
B-002.jsonl: OK
...
ENV.json: OK
$ git commit -qm "golden: freeze corpus v1 (312 records)" && git tag golden-v1
$ git show --stat golden-v1 | tail -n 1
 12 files changed, 330 insertions(+)
```
`golden_corpus`: `{"path": "golden/", "tag": "golden-v1", "records": 312, "kinds": {"ok": 287, "error": 25}}`.

---

## Exit Criteria

DONE when every record passes validation, checksums verify, the manifest matches the files, the corpus is committed and tagged by itself, and files are write-protected.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | More than one capture input present | **Stop**: one source language per corpus; ask which is the reference. |
| Phase 1 | Raw JSON numbers found | **Return**: to the capture flow; its `encode` missed a type. |
| Phase 1 | Duplicate ids | **Return**: to the capture flow; ids must be unique per record. |
| Phase 2 | `sha256sum -c` fails right after writing | **Retry**: a process is still writing; rerun capture to completion before checksumming. |
| Phase 3 | Someone asks to "update the golden" to make a port test pass | **Stop**: refuse; route the failure to `port-parity-diff-triage`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
