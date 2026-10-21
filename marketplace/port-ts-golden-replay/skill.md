# Port TypeScript Golden Replay

**One-line description:** Builds a Vitest replay harness in the TypeScript target that loads the frozen golden JSON Lines corpus, decodes typed values (`$int` to `bigint` or `number`, `$f64` by bit pattern, `$bytes`, `$badstr`), calls the ported function, compares under the schema's rules with `Object.is` semantics for doubles, and runs one named test per record so failures point at a record id.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `target_repo` (string, required): Path to the TypeScript project.
- `golden_corpus` (object, required): Output of `port-golden-corpus-freeze`.
- `corpus_schema` (object, required): Output of `port-golden-corpus-schema`.

---

## Outputs

- `ts_replay_command` (object): The exact commands: full replay, replay filtered to one behavior, checksum check, and the type check, plus the harness file paths.

---

## Phase 1: Copy and Verify the Corpus

### Entry Criteria
- `golden_corpus.tag` exists in the source repository.

### Actions
1. Copy the tagged corpus, not the working tree: `git -C <source_repo> archive golden-v1 golden | tar -x -C <target_repo>/test/` (creates `test/golden/`).
2. Verify: `(cd test/golden && sha256sum -c SHA256SUMS)`. Every line must say `OK`.
3. Install Vitest if absent: `npm install --save-dev vitest`. Confirm `npx vitest --version` prints a version.

### Output
`test/golden/` in the target.

### Quality Gate
- `sha256sum -c SHA256SUMS` exits 0.

---

## Phase 2: Write the Harness

### Entry Criteria
- Corpus in place.

### Actions
1. Create `test/golden/codec.ts` with:
   - `decode(v, hint)`: `$int` to `bigint` (`BigInt(s)`) when `hint` says the ported function takes `bigint`, else `Number(s)` with a check `Number.isSafeInteger` that throws if precision would be lost. `$f64`: `const dv = new DataView(new ArrayBuffer(8)); dv.setBigUint64(0, BigInt("0x" + h)); return dv.getFloat64(0);`, `"nan"` to `NaN`. `$bytes`: `Uint8Array.from(Buffer.from(b, "base64"))`. `$badstr` with `utf-16-surrogatepass`: read the base64 bytes as UTF-16LE code units with `String.fromCharCode` per pair. `$map`: `new Map(...)`. `$set`: `new Set(...)`. `$undefined`: `undefined`.
   - `encode(v, hint)`: the reverse, so actual results are compared in encoded form (one comparison path for everything). `number` results: use `hint` (integer or float) from the behavior's declared return type; integers to `$int`, floats to `$f64` by bit pattern (keeps `-0`).
2. Create `test/golden/golden.test.ts`:
   - Read each `B-*.jsonl` with `readFileSync`, split on `\n`, drop the last empty line, `JSON.parse` each.
   - Import a registry `test/golden/registry.ts` that maps each `call` string to the ported function and its type hints. A `call` with no registry entry yields `test.todo(id)`, so unported behaviors are visible as todo, not as passing.
   - `describe.each` per behavior and `test.each(records)("$id", ...)`; inside: decode input, call (await if a Promise), catch thrown errors, map `err.name` through `categories.json`, encode the result, apply the rule from `rules.json` (`exact`: `expect(actual).toEqual(expected)` on encoded JSON; `unordered`: sort both by canonical JSON text first; `mask:<regex>`: replace matches on both; `category_only`: compare `category` only).
   - `ub` records: assert the call does not crash the process and returns either an error or a value; the user's expectation in the record's `note` overrides this.
3. Add `test/golden/checksum.test.ts` that runs `sha256sum -c` logic in TypeScript (`createHash("sha256")` per file vs `SHA256SUMS`), so a modified corpus fails the suite.
4. Add scripts to `package.json`: `"test:golden": "vitest run test/golden"`.

### Output
Harness files.

### Quality Gate
- `npx tsc --noEmit -p .` exits 0 with the harness included.
- With an empty registry, `npx vitest run test/golden` reports every record as todo and zero failures (proves loading and decoding work).
- Editing one byte of a copied corpus file makes `checksum.test.ts` fail; revert the edit afterward (`git checkout -- test/golden`).

---

## Phase 3: Prove the Comparator

### Entry Criteria
- Harness runs.

### Actions
1. Register one already-ported function (or a deliberately wrong stub in a scratch branch) and confirm:
   - A correct implementation passes its records.
   - A stub returning `-0` where the record expects `0` fails (proves `-0` is distinguished).
   - A stub returning `1` instead of `1n` for an `$int` above 2^53 fails or throws on decode.
2. Delete the scratch branch. Record the commands.

### Output
`ts_replay_command`.

### Quality Gate
- The three checks above produced the expected pass or fail, with output attached.

---

## Worked Example

Illustrative.
```
$ git -C ../slugkit archive golden-v1 golden | tar -x -C test/
$ (cd test/golden && sha256sum -c SHA256SUMS | tail -n 1)
SHA256SUMS: OK
$ npx vitest run test/golden
 ✓ test/golden/checksum.test.ts (1 test)
 ↓ test/golden/golden.test.ts (312 tests | 312 todo)
$ npx vitest run test/golden -t "B-001"
 ✓ test/golden/golden.test.ts (98 tests | 69 passed | 29 failed)
   × B-001 > B-001/0044  expected "strasse" received "straße"
```
`ts_replay_command`:
```
{"full": "npx vitest run test/golden",
 "one_behavior": "npx vitest run test/golden -t \"B-001\"",
 "checksum": "(cd test/golden && sha256sum -c SHA256SUMS)",
 "typecheck": "npx tsc --noEmit -p ."}
```

---

## Exit Criteria

DONE when the tagged corpus is copied and verified, every record becomes a named Vitest test (todo until registered), the comparator distinguishes `-0`, `NaN` and large integers, and the commands are recorded.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `sha256sum -c` fails after copy | **Stop**: re-copy from the tag; never regenerate checksums in the target. |
| Phase 2 | Decoding an `$int` above 2^53 into `number` | **Adjust**: the ported function must take `bigint`; fix the registry hint, do not round. |
| Phase 2 | Vitest runs too many tests to read | **Adjust**: filter by behavior with `-t`; the full run stays in CI. |
| Phase 3 | A wrong stub passes | **Stop**: the comparator is too loose; fix it before any port relies on it. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
