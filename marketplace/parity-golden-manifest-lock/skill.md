# Parity Golden Manifest Lock

**One-line description:** Stores golden vectors under version control with a SHA-256 manifest, Git LFS for large binaries, and a written regeneration rule, so any change to an expected value is visible in review and never happens to make a test pass.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `golden_vectors` (string, required): Directory produced by `parity-py-golden-vectors`.
- `serialization_spec` (object, required): Output of `parity-canonical-serialization`.

---

## Outputs

- `golden_manifest` (string): Path to `golden.sha256` plus `GOLDEN_POLICY.md`, committed beside the vectors.

---

## Phase 1: Hash and Track

### Entry Criteria
- `golden_vectors` contains vector files and `generator_info.json`.

### Actions
1. From inside the vector directory run `sha256sum *.jsonl *.bin generator_info.json > golden.sha256` (on macOS use `shasum -a 256`). Only include files that exist.
2. If any file is larger than your Git host's file size limit or you store `.bin` files, run `git lfs install` once, then `git lfs track "golden/*.bin"`, and commit `.gitattributes`. Check the host's limit in its documentation; do not assume one.
3. Add a `.gitattributes` line `golden/*.jsonl -text` so Git never rewrites line endings on Windows checkouts (`core.autocrlf` would change the bytes and break the hashes).
4. Commit vectors, `golden.sha256`, and `.gitattributes` in one commit whose message names the generator commit and seed.

### Output
Committed vectors with a hash manifest.

### Quality Gate
- `sha256sum -c golden.sha256` prints `OK` for every line on a fresh clone.
- `git lfs ls-files` lists every `.bin` file when LFS is used.

---

## Phase 2: Write the Regeneration Rule

### Entry Criteria
- Manifest committed.

### Actions
1. Write `GOLDEN_POLICY.md` beside the vectors with these rules:
   - Goldens change only when the reference implementation changes on purpose. The commit that changes goldens names the reference change.
   - Regenerate only with the recorded command in `generator_info.json`.
   - A diff of old vs new goldens is attached to the review: count of cases changed, and for each changed case the old and new bit patterns.
   - Never regenerate goldens from the port's output.
   - Never regenerate goldens to make a failing parity check pass.
2. Add a CODEOWNERS entry (for example `golden/ @numerics-owner`) if the host supports it, so golden changes need a named reviewer.

### Output
`golden_manifest`.

### Quality Gate
- `GOLDEN_POLICY.md` contains all five rules.
- `git log --oneline -- golden/` shows one commit per golden change, each naming a reference commit.

---

## Worked Example

Illustrative.

```
$ cd golden && sha256sum lowpass_step.jsonl generator_info.json > golden.sha256 && cat golden.sha256
9c1e0f...  lowpass_step.jsonl
44ab73...  generator_info.json
$ echo 'golden/*.jsonl -text' >> ../.gitattributes
$ git add . ../.gitattributes && git commit -m "golden: lowpass vectors from ref 3f2c9a1 seed 2718281"
$ git clone ../ /tmp/c && cd /tmp/c/golden && sha256sum -c golden.sha256
lowpass_step.jsonl: OK
generator_info.json: OK
```

---

## Exit Criteria

DONE when a fresh clone verifies every golden file by hash and the regeneration rule is committed.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `sha256sum -c` fails on a fresh clone | **Stop**: check line-ending conversion and LFS smudge (`git lfs pull`) before anything else. |
| Phase 1 | Git LFS not available on the host | **Adjust**: store large vectors in an artifact store and commit only the manifest with hashes and download URL. |
| Phase 2 | Someone proposes regenerating to fix a failing check | **Stop**: route to `parity-divergence-triage`; the golden stays. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
