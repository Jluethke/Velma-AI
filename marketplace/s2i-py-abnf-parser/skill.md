# Python ABNF Parser

**One-line description:** Builds a Python parser for the validated ABNF grammar with the `abnf` package from PyPI (which parses ABNF directly, so the grammar file stays the single source of truth), wraps it in a typed `parse()` function, and proves it with pytest cases taken from the spec's own examples.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `grammar_file` (string, required): From `s2i-abnf-extract-validate`.
- `start_rule` (string, required): The rule a complete input must match, for example `URI-reference`.
- `project_dir` (string, required): Python project root with a `pyproject.toml`.

---

## Outputs

- `parser_module` (string): Path to the module, for example `src/<pkg>/grammar.py`.
- `parser_tests` (string): Path to `tests/test_grammar.py`.

---

## Phase 1: Install and Confirm the API

### Entry Criteria
- `grammar_file` exists and passed its validators.

### Actions
1. Install into the project environment: `python -m pip install abnf` and add `abnf` to `[project] dependencies` in `pyproject.toml`.
2. Confirm the installed API before writing code. Do not rely on memory:
   `python -c "import abnf; print(abnf.__file__); print([n for n in dir(abnf.Rule) if not n.startswith('_')])"`
   You need a class method that loads rules from a file or string (look for `from_file`, `create`, `load_grammar`) and a method that parses a whole string (look for `parse_all`). Read the package README on PyPI for the exact signatures.
3. Check for a bundled grammar first: `python -c "import abnf.grammars, pkgutil; print([m.name for m in pkgutil.iter_modules(abnf.grammars.__path__)])"`. If your RFC is listed (for example `rfc3986`, `rfc9110`), prefer it and compare it with your `grammar_file`; any difference goes in the ambiguity log.

### Output
Confirmed method names.

### Quality Gate
- The two `python -c` commands run and their output is saved in the run notes.
- The loader and whole-string parse method names used in code appear in that output.

---

## Phase 2: Write the Parser Module

### Entry Criteria
- API confirmed.

### Actions
1. Copy `grammar_file` into the package as data: `src/<pkg>/grammar.abnf`. Load it with `importlib.resources.files(__package__).joinpath("grammar.abnf")` so it ships in the wheel.
2. Create `src/<pkg>/grammar.py` with one subclass of `abnf.Rule` (the package stores rules per subclass, so a subclass keeps your rules separate from bundled ones), load the grammar into it once at import, and expose:
   ```python
   def parse(text: str) -> "abnf.Node":
       """Parse text against START_RULE; raise GrammarViolation on failure."""
   ```
3. Catch the package's parse exception (check its name in `dir(abnf)`, typically `ParseError`) and re-raise your own `GrammarViolation(ValueError)` carrying the input offset, so callers never depend on the library type.
4. ABNF works on octets, but `abnf` works on `str`. If the spec defines octets above 0x7F (`%x80-FF`), decode input with `latin-1` (one char per byte) before parsing, never `utf-8`, and say so in the docstring.
5. Do not edit the grammar text inside Python code to make tests pass. Grammar changes go back to `s2i-abnf-extract-validate`.

### Output
`parser_module`.

### Quality Gate
- `python -c "from <pkg>.grammar import parse; print(parse('<one valid example from the spec>'))"` prints a node and exits 0.
- `python -m pyflakes src/<pkg>/grammar.py` (or `ruff check`) reports nothing.

---

## Phase 3: Spec Example Tests

### Entry Criteria
- `parse()` works on one example.

### Actions
1. Collect every literal example from the spec text for the start rule and its main sub-rules (examples sections, figure text). Each becomes a positive case.
2. Write negative cases by breaking one ABNF constraint each: a forbidden character from the rule's `%x` range, a missing required element, an extra trailing character (proves the parse is anchored to the whole input).
3. Write `tests/test_grammar.py` with `@pytest.mark.parametrize` lists `VALID` and `INVALID`, each item a `pytest.param(text, id="<section>-<short name>")`.
4. Add one case per `case_sensitive_literals` entry from the grammar report (upper and lower case variants with the expected result).
5. Run `python -m pytest tests/test_grammar.py -q`. Every failure means either a grammar transcription error or a misread example. Fix one at a time, rerun after each fix.
6. Never delete or invert a failing case to get a green run. If a spec example truly fails the spec's grammar, that is an ambiguity log entry, and the case stays with `pytest.mark.xfail(reason="AMB-nnn", strict=True)`.

### Output
`parser_tests`.

### Quality Gate
- `python -m pytest tests/test_grammar.py -q` exits 0.
- Number of `VALID` cases is at least the number of spec examples counted in step 1.
- Every `xfail` has `strict=True` and an `AMB-` reason.

---

## Worked Example

Illustrative. RFC 3986, `start_rule` = `URI-reference`, package `uriparse`.

Phase 1:
```
$ python -c "import abnf; print([n for n in dir(abnf.Rule) if not n.startswith('_')])"
[... 'create', 'from_file', ..., 'parse', 'parse_all', ...]
```
Phase 2: `parse("http://a/b/c/d;p?q")` returns a node named `URI-reference`.

Phase 3: RFC 3986 Section 5.4 examples give positives (`g;x?y#s`, `../../g`, `//g`). Negatives: `http://a/b c` (space not allowed), `http://[::1` (unclosed IP-literal).
```
$ python -m pytest tests/test_grammar.py -q
.........................                                         [100%]
25 passed in 0.31s
```

---

## Exit Criteria

DONE when the parser loads the unmodified grammar file, exposes one `parse()` with a project-owned exception, and passes every spec example and negative case.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Loader method name differs from this flow | **Adjust**: use the name shown by `dir(abnf.Rule)` and the README; never call a method that is not listed. |
| Phase 2 | Grammar fails to load (left recursion or syntax) | **Return** to `s2i-abnf-extract-validate` with the error text. |
| Phase 2 | Parse is very slow on long inputs | **Adjust**: record input size and time; consider a hand-written parser for the hot rule, tested against this one. |
| Phase 3 | Spec example rejected | **Stop** and check transcription first; only then log an ambiguity and mark strict xfail. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
