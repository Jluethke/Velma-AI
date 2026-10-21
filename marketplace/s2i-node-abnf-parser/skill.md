# Node ABNF Parser with Peggy

**One-line description:** Translates the validated ABNF grammar into a Peggy (PEG) grammar for Node.js or TypeScript, handling the three places where PEG and ABNF differ (ordered choice, greedy repetition, case-insensitive literals), generates the parser with the `peggy` CLI, and proves it with `node --test` cases from the spec examples.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `grammar_file` (string, required): From `s2i-abnf-extract-validate`.
- `start_rule` (string, required): The ABNF rule a complete input must match.
- `project_dir` (string, required): Node project root with `package.json`.

---

## Outputs

- `parser_module` (string): Path to the generated parser, for example `src/grammar.js`, plus the source `src/grammar.peggy`.
- `parser_tests` (string): Path to `test/grammar.test.js`.

---

## Phase 1: Translate ABNF to Peggy

### Entry Criteria
- `grammar_file` passed its validators.

### Actions
1. Install: `npm install --save-dev peggy`. Confirm the CLI options with `npx peggy --help` (look for `-o`/`--output`, `--format`, `--allowed-start-rules`).
2. Create `src/grammar.peggy`. Translate one ABNF rule at a time, in file order, using this table:

   | ABNF (RFC 5234 / 7405) | Peggy |
   |---|---|
   | `a = b c` | `a = b c` |
   | `b / c` (unordered alternation) | `b / c` (ORDERED: first match wins; see step 3) |
   | `*x`, `1*x`, `x`, `[x]` | `x*`, `x+`, `x`, `x?` |
   | `n*m x` (bounded repeat) | `x\|n..m\|` (Peggy repetition operator; confirm syntax in the Peggy docs for your version) |
   | `"abc"` (case-insensitive by RFC 5234) | `"abc"i` |
   | `%s"abc"` (case-sensitive, RFC 7405) | `"abc"` |
   | `%x41-5A` | `[\x41-\x5A]` |
   | `%x0D.0A` | `"\r\n"` |
   | rule names with `-` | replace `-` with `_` (Peggy identifiers cannot contain `-`); keep a comment with the ABNF name |

3. Ordered choice fix: ABNF `IPv4address / reg-name` accepts either; in PEG the first alternative that matches a prefix wins and the parser never backtracks into the second. For every alternation, if one alternative can match a prefix of another (for example `"a" / "ab"`, or `IPv4address` matching the start of a `reg-name` like `1.2.3.4.example`), put the longer alternative first or add a lookahead: `IPv4address !reg_name_char`.
4. Greedy repetition fix: `*x y` where `y` can start with something `x` accepts never matches in PEG (the `*` consumes it). Rewrite as `(!y x)* y` and comment the rule.
5. Write the start rule as `start = <start_rule> !.` so trailing input fails.

### Output
`src/grammar.peggy`.

### Quality Gate
- Every ABNF rule name has a Peggy rule (count both files).
- Every alternation is annotated with `// order checked` after step 3.

---

## Phase 2: Generate the Parser

### Entry Criteria
- Peggy grammar written.

### Actions
1. Generate: `npx peggy --format es -o src/grammar.js src/grammar.peggy` (use `--format commonjs` for CommonJS projects; check `"type"` in `package.json`).
2. Add an npm script so the parser is rebuilt and never hand-edited: `"build:grammar": "peggy --format es -o src/grammar.js src/grammar.peggy"`.
3. Wrap it in `src/parse.js` exporting `parse(text)` that calls the generated `parse` and converts `peg$SyntaxError` (exported as `SyntaxError` by the generated module) into your own `GrammarViolation` with `location.start.offset`.
4. For octet-oriented grammars, decode `Buffer` input with `buffer.toString('latin1')` before parsing.

### Output
`parser_module`.

### Quality Gate
- `npm run build:grammar` exits 0.
- `node -e "import('./src/parse.js').then(m=>console.log(m.parse('<valid spec example>')))"` prints a result.

---

## Phase 3: Spec Example Tests

### Entry Criteria
- Parser generated.

### Actions
1. Create `test/grammar.test.js` with `import { test } from 'node:test'` and `import assert from 'node:assert/strict'`.
2. One `test()` per spec example named `<section> <short name>`, asserting no throw. One per negative case asserting `assert.throws(() => parse(x), GrammarViolation)`.
3. Add PEG-specific negative and positive cases for each alternation reordered in Phase 1 step 3 (the input that the wrong order would have mis-parsed).
4. Run `node --test test/`. Fix one failure at a time in `src/grammar.peggy`, rebuild, rerun.
5. Never edit `src/grammar.js` by hand and never delete a failing spec example. A spec example that conflicts with the grammar goes to the ambiguity log and stays as `test.todo('AMB-nnn ...')`.

### Output
`parser_tests`.

### Quality Gate
- `node --test test/` exits 0 with zero failures.
- `git diff --stat src/grammar.js` after `npm run build:grammar` shows no change (generated file matches the grammar source).

---

## Worked Example

Illustrative. RFC 3986 host rule, `start_rule` = `URI-reference`.

Phase 1: ABNF `host = IP-literal / IPv4address / reg-name`. In Peggy, `IPv4address` would match `1.2.3.4` inside `1.2.3.4.example` and then the URI would fail at `.example`. Fix: `host = IP_literal / IPv4address &host_end / reg_name` with `host_end = [:/?#] / !.` (comment: order checked).

Phase 2:
```
$ npx peggy --format es -o src/grammar.js src/grammar.peggy
$ node -e "import('./src/parse.js').then(m=>console.log(!!m.parse('http://1.2.3.4.example/')))"
true
```
Phase 3:
```
$ node --test test/
# tests 31
# pass 31
# fail 0
```

---

## Exit Criteria

DONE when the Peggy grammar mirrors every ABNF rule with PEG ordering and greediness handled, the generated parser is reproducible from an npm script, and all spec example tests pass.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | ABNF rule is left-recursive | **Adjust**: rewrite as repetition (`a = a "x" / "y"` becomes `a = "y" "x"*`); PEG cannot do left recursion. |
| Phase 2 | Peggy reports "Possible infinite loop" | **Adjust**: a `*` wraps an expression that can match empty; make the inner expression non-empty. |
| Phase 3 | Valid input rejected | **Adjust**: check the alternation order and greedy repetition rules first; these cause most PEG/ABNF mismatches. |
| Phase 3 | Same input accepted that ABNF rejects | **Return** to Phase 1: a lookahead or end anchor is missing. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
