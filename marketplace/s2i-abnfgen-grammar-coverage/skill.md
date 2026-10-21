# Grammar Coverage with abnfgen

**One-line description:** Generates valid sample inputs directly from the ABNF grammar with `abnfgen` (including its branch-coverage mode), feeds every sample to your parser through a command-line harness, and derives invalid samples by single-byte mutation, so the parser is tested against the grammar itself rather than only the handful of examples printed in the spec.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `grammar_file` (string, required): From `s2i-abnf-extract-validate`.
- `start_rule` (string, required): The ABNF start rule.
- `parse_command` (string, required): A shell command that reads one input from a file path given as its last argument and exits 0 if the parser accepts it, non-zero if it rejects it. Example: `python -m uriparse.cli`, `node bin/parse.js`, `./target/release/parse`.

---

## Outputs

- `grammar_coverage_report` (object): `{ "generated": N, "accepted": N, "rejected_valid": [paths], "mutants": N, "accepted_invalid": [paths], "rules_never_generated": [] }`.

---

## Phase 1: Generate Valid Samples

### Entry Criteria
- `grammar_file` passed its validators.
- `abnfgen` installed (source at `http://www.quut.com/abnfgen/`; build with `./configure && make`).

### Actions
1. Read the options of your build first: `abnfgen -h` (or the man page `abnfgen.1` in the source tree). Identify: the output directory option, the count option, the start rule option, and the coverage ("cover all branches") option. Do not use an option that does not appear in that help text.
2. Generate a coverage set first (the mode that tries to exercise every alternative), into `spec/gen/cover/`.
3. Generate a random set of a size the user chooses into `spec/gen/random/`.
4. ABNF grammars with unbounded repetition (`*x`) can produce huge outputs. If your build has an option that limits repetition or prefers short productions, use it; otherwise record the largest file size: `ls -S spec/gen/random | head -1`.
5. Note the RFC 5234 case-insensitivity of quoted strings: abnfgen may emit any case for `"abc"`. That is correct; your parser must accept it.

### Output
Sample files under `spec/gen/`.

### Quality Gate
- `ls spec/gen/cover | wc -l` and `ls spec/gen/random | wc -l` are both greater than zero.
- The exact `abnfgen` command lines used are saved in `spec/gen/COMMANDS.txt`.

---

## Phase 2: Run the Parser on Valid Samples

### Entry Criteria
- Samples exist.

### Actions
1. Run every sample and log failures:
   ```sh
   for f in spec/gen/cover/* spec/gen/random/*; do
     $PARSE_COMMAND "$f" >/dev/null 2>&1 || echo "$f" >> spec/gen/rejected_valid.txt
   done
   ```
2. Every line in `rejected_valid.txt` is a parser bug or a grammar transcription difference (the generator used `grammar_file`, the parser was written from it). Open each file, find the rule involved, and fix the parser, not the sample.
3. Typical causes, in order of frequency: case-insensitive literal treated as case-sensitive; PEG or `alt` first-match picked the wrong alternative; greedy repetition swallowed a delimiter; trailing-input anchor missing on a sub-rule.
4. Rerun the loop after each single fix until `rejected_valid.txt` is empty.
5. To find rules never generated, grep the coverage set for each rule's distinctive literal; list rules with zero hits in `rules_never_generated` and add hand-written samples for them.

### Output
Clean valid-sample run.

### Quality Gate
- `spec/gen/rejected_valid.txt` is empty or does not exist after the final run.
- `rules_never_generated` is recorded (empty list allowed).

---

## Phase 3: Mutate for Invalid Samples

### Entry Criteria
- All valid samples accepted.

### Actions
1. For each coverage sample, create mutants that are certainly invalid by the grammar: insert one byte that no rule allows anywhere (find such a byte by checking which octets never appear in any terminal range of the grammar, for example a control byte in most text grammars), or truncate the file before a required closing delimiter.
2. Do not use random byte flips as "invalid": a random flip often produces another valid string. Only use mutations you can show are invalid from the grammar.
3. Run the parser on mutants; collect any accepted ones in `spec/gen/accepted_invalid.txt`.
4. Every accepted invalid input is a parser bug (too permissive). Fix one at a time and rerun.
5. Write `grammar_coverage_report` to `spec/gen/report.json`.

### Output
`grammar_coverage_report`.

### Quality Gate
- `spec/gen/accepted_invalid.txt` is empty after the final run.
- `python -m json.tool spec/gen/report.json` exits 0.

---

## Worked Example

Illustrative. RFC 3986 grammar, `start_rule` `URI-reference`, `parse_command` = `python -m uriparse.cli`.

Phase 1: After reading `abnfgen -h`, the coverage run writes a few hundred files to `spec/gen/cover/`.

Phase 2:
```
$ wc -l spec/gen/rejected_valid.txt
3 spec/gen/rejected_valid.txt
$ cat spec/gen/cover/000117
HTTP://[V7.Z]/
```
Cause: the parser compared the `"v"` in `IPvFuture = "v" 1*HEXDIG "." ...` case-sensitively. Fix to case-insensitive; rerun; file empty.

Phase 3: Inserting byte 0x20 (space, not allowed anywhere in RFC 3986 URI syntax) into each sample yields mutants; all rejected.

---

## Exit Criteria

DONE when every grammar-generated valid sample is accepted, every provably invalid mutant is rejected, the commands are recorded, and the report lists any rules the generator never reached.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | `abnfgen` rejects the grammar | **Return** to `s2i-abnf-extract-validate`; the grammar has a syntax issue the other validators missed or uses an extension. |
| Phase 1 | Generated files are extremely large | **Adjust**: use a repetition-limiting option from `abnfgen -h`, or delete outliers and record that you did. |
| Phase 2 | `parse_command` exit codes do not distinguish accept and reject | **Stop**: fix the harness first; this flow depends on exit codes. |
| Phase 3 | Cannot find a byte that is invalid everywhere | **Adjust**: use truncation mutants only and record that byte insertion was not possible. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
