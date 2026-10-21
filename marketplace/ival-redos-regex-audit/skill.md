# ReDoS Audit and Fix for Regexes on User Input

**One-line description:** Finds regular expressions applied to user-controlled strings, detects catastrophic backtracking with real analyzers (`recheck`, `eslint-plugin-regexp` rule `regexp/no-super-linear-backtracking`, `regexploit`, Semgrep), and fixes each one by switching to a linear-time engine (RE2 bindings, Go `regexp`), rewriting the pattern, or capping input length first, then proves it with a timed attack-string test.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node`, `go`, `java` or `dotnet`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; rows with `class` = `redos`.

---

## Outputs

- `redos_fixes` (object): `patterns` (file, line, pattern, analyzer verdict, fix method), `test_file`, `test_run`.

---

## Phase 1: Collect Patterns and Run Analyzers

### Entry Criteria
- `sink_map` exists.

### Actions
1. Keep only regexes whose subject string can come from a user (request field, header, uploaded text, queue message). Constant subjects are out of scope.
2. Also collect patterns that are themselves user-supplied (`re.compile(user_value)`, `new RegExp(req.query.q)`): those are a separate finding. Fix: `re.escape(v)` / escape the string (Node: `RegExp.escape` where available, otherwise a vetted escape such as lodash `escapeRegExp`) or do a plain substring search instead.
3. Run the analyzer for the stack:

| `stack` | Analyzer | Command |
|---|---|---|
| node | eslint-plugin-regexp | `npm i -D eslint-plugin-regexp`, enable rule `regexp/no-super-linear-backtracking` (and `regexp/no-super-linear-move`) in the ESLint config, run `npx eslint . --rule '{"regexp/no-super-linear-backtracking":"error"}'` (flat config users: add the plugin in `eslint.config.js`; check the plugin README) |
| node, python, java | recheck (npm package `recheck`) | `npm i -D recheck`, then `node -e 'require("recheck").check(process.argv[1], "").then(d => console.log(d.status, d.complexity && d.complexity.type, d.attack && d.attack.pattern))' '^(a+)+$'`. It prints `vulnerable` with an attack string, or `safe`. Pass the pattern source without slashes and the flags as the second argument. Check the package README for the current API before relying on field names. |
| python | regexploit | `pip install regexploit`, then `regexploit-py <src_dir>` (check `regexploit --help` for the entry point names in your version) |
| any | Semgrep | `semgrep scan --config p/javascript --config p/python` and look for `check_id` containing `redos` or `regex` |
| go | none needed for stdlib `regexp` | Go's `regexp` guarantees linear-time matching (RE2 syntax); only `github.com/dlclark/regexp2` backtracks |
| dotnet | n/a | every `new Regex(...)` without a `matchTimeout` argument is a finding |

4. Record each pattern with the analyzer's verdict and, when given, its attack string.

### Output
Pattern table with verdicts.

### Quality Gate
- Every in-scope pattern has a verdict from a named analyzer run (output saved), or `go-stdlib-linear`.

---

## Phase 2: Fix Each Vulnerable Pattern

### Entry Criteria
- Pattern table exists with at least one `vulnerable` verdict, user-supplied pattern, or .NET pattern without timeout.

### Actions
1. Pick the fix with the first matching row:

| Situation | Fix |
|---|---|
| Pattern uses only RE2-compatible syntax (no backreferences, no lookaround) | linear engine: Python `pip install google-re2`, `import re2 as re` (API mirrors `re`); Node `npm i re2`, `new RE2(pattern)`; Java `com.google.re2j.Pattern`; Go stdlib already linear |
| Pattern needs lookaround or backreferences | rewrite to remove the ambiguity: no nested quantifiers like `(a+)+`, no alternations whose branches match the same text inside a repeat like `(a\|aa)*`, no adjacent quantified groups that overlap like `\s*\w*\s*` on the same characters |
| Python 3.11 or later and the overlap is local | atomic group `(?>...)` or possessive quantifier `a*+`, which forbid backtracking into the group |
| .NET | add `matchTimeout`: `new Regex(p, RegexOptions.None, TimeSpan.FromMilliseconds(T))` where T is an owner-provided budget, or `RegexOptions.NonBacktracking` (.NET 7 and later) |
| Validation of a well-known format (email, URL) | replace the hand-written regex with the schema library's validator (`EmailStr`, `z.string().email()` or `z.email()`, `validate:"email"`) |

2. In every case, cap the subject length before matching using the field's max length from the schema flow. The cap reduces impact; it does not replace the fix for exponential patterns.
3. Rerun the Phase 1 analyzer on the changed pattern and record `safe`.
4. One pattern per commit.

### Output
Fixed patterns.

### Quality Gate
- Analyzer rerun reports `safe` (or no finding) for every changed pattern.
- `.NET`: `rg -n "new Regex\(" --type cs` hits all carry a timeout or `NonBacktracking`.

---

## Phase 3: Timed Attack-String Tests

### Entry Criteria
- Patterns fixed.

### Actions
1. For each fixed pattern, write a test that runs the function using it on the analyzer's attack string, sized up to the field's max length, under a hard timeout. The timeout value is the test framework's per-test timeout the project already uses, or an owner-provided budget; do not make one up.

```python
@pytest.mark.timeout(TEST_TIMEOUT_S)          # pytest-timeout plugin
def test_slug_regex_linear():
    attack = "a" * MAX_SLUG_LEN + "!"
    assert is_valid_slug(attack) is False
```
```ts
test("slug regex linear", () => {
  const attack = "a".repeat(MAX_SLUG_LEN) + "!";
  expect(isValidSlug(attack)).toBe(false);
}, TEST_TIMEOUT_MS);
```
2. Include a positive case so the fix did not change accepted inputs. If the old regex had tests, all must still pass unchanged.
3. Run, record summary. Mutation check: restore the old pattern, run the attack test, confirm it times out or fails, revert.

### Output
`redos_fixes`.

### Quality Gate
- Test summary shows 0 failed and 0 timeouts.
- Mutation run shows a timeout or failure; reverted run passes.

---

## Worked Example

Illustrative. `stack` = `node`. `src/validate.ts:8`: `/^([a-z0-9]+-?)+$/` checks a slug from `req.body.slug`.

Phase 1:
```
$ node -e '...check(process.argv[1], "")...' '^([a-z0-9]+-?)+$'
vulnerable exponential '0'.repeat(31) + '\x00'
```
Phase 2: rewritten to `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` (each repetition must start with `-`, so no overlap); recheck reports `safe`. Length capped at the column limit 64 by the Zod schema.

Phase 3: `Tests  3 passed (3)`. Mutation with the old pattern: `Error: Test timed out`.

---

## Exit Criteria

DONE when every regex on user input has a recorded analyzer verdict, every vulnerable or user-supplied pattern is fixed by a linear engine, rewrite, atomic construct or timeout, input lengths are capped first, and timed attack tests pass and fail under mutation.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Analyzer cannot parse the pattern (engine-specific syntax) | **Adjust**: try the other analyzer in the table; if none parse it, mark `needs_review` and apply Phase 2 length cap plus a timeout test. |
| Phase 2 | `google-re2` or `re2` npm fails to build on the platform | **Adjust**: rewrite the pattern instead; record the build failure. |
| Phase 2 | Rewrite changes which inputs match | **Stop**: old tests failing means a behavior change; restore and try another rewrite. |
| Phase 3 | Test runner has no timeout support | **Adjust**: run the match in a worker or subprocess with a timeout. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
