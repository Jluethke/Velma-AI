# Custom Semgrep Taint Rules for Fixed Sink Classes

**One-line description:** Writes repository-specific Semgrep rules in taint mode (`pattern-sources`, `pattern-sinks`, `pattern-sanitizers`) that encode each fix made by the class flows, so a reintroduced f-string query, `shell=True`, unguarded fetch or unchecked path fails CI; each rule ships with an annotated test file (`# ruleid:` and `# ok:`) that passes `semgrep --test`, and is run alongside the registry rulesets.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `node` or `go`.
- `sink_map` (object, required): Output of `ival-sink-class-map`; one rule per class in `classes`.

---

## Outputs

- `semgrep_rules` (object): `rules_dir` (`.semgrep/`), `rule_ids`, `test_run` (`semgrep --test` output), `scan_command`, `baseline_findings` (count on current code, expected 0).

---

## Phase 1: Install and Run Registry Rules First

### Entry Criteria
- `semgrep --version` prints a version (install: `pipx install semgrep`, `brew install semgrep`, or Docker image `semgrep/semgrep`).

### Actions
1. Run registry rules for the stack and save JSON:
   `semgrep scan --config p/owasp-top-ten --config p/<lang> --json -o semgrep-registry.json` where `<lang>` is `python`, `javascript` (add `p/typescript` for TS) or `golang`.
2. For each finding: if it is a real issue not covered by a class flow, add it to the report as a finding; if it is a false positive, record why. Do NOT add `# nosemgrep` comments in this phase.
3. Note which `sink_map` classes have no registry rule finding the original bug (check by temporarily reverting one fix in a scratch branch). Those are the gaps your custom rules must cover; registry rules cannot know your helper names (the guarded HTTP client, `safe_path`, the redirect helper).

### Output
Registry results and gap list.

### Quality Gate
- `semgrep-registry.json` exists; every finding is classified.

---

## Phase 2: Write Taint Rules With Tests

### Entry Criteria
- Gap list exists.

### Actions
1. Directory layout (Semgrep pairs a rule file with a test file of the same base name):

```
.semgrep/
  ival-py-sql-fstring.yaml
  ival-py-sql-fstring.py        # test file with annotations
  ival-py-ssrf-unguarded.yaml
  ival-py-ssrf-unguarded.py
```
2. Taint rule template (Python SSRF example; adapt names to your helpers):

```yaml
rules:
  - id: ival-py-ssrf-unguarded
    mode: taint
    languages: [python]
    severity: ERROR
    message: User-controlled URL reaches an HTTP client outside the SSRF guard. Use guard.session().
    pattern-sources:
      - pattern: flask.request.$ATTR
      - pattern: request.$ATTR.get(...)
    pattern-sanitizers:
      - pattern: guard.check_url(...)
    pattern-sinks:
      - patterns:
          - pattern-either:
              - pattern: requests.$METHOD($URL, ...)
              - pattern: httpx.$METHOD($URL, ...)
          - focus-metavariable: $URL
```
3. Rule list to write, one per class in `sink_map.classes`:

| Class | Sink pattern idea | Sanitizer |
|---|---|---|
| sql | `$CUR.execute(f"...")`, `$CUR.execute("..." % ...)`, `` pool.query(`...${$X}...`) ``, `db.Query(fmt.Sprintf(...))` | none (any tainted string formatting into the query string is a finding) |
| command | `subprocess.$F(..., shell=True)`, `child_process.exec(...)`, `exec.Command("sh", "-c", ...)` | none |
| path | `open($P)`, `fs.readFile($P)`, `os.Open($P)` | your `safe_path(...)` helper |
| ssrf | as template | your guard |
| xss | `Markup($X)`, `mark_safe($X)`, `dangerouslySetInnerHTML={{__html: $X}}`, `template.HTML($X)` | `nh3.clean(...)`, `DOMPurify.sanitize(...)` |
| deserialization | `pickle.loads(...)`, `yaml.load(...)` without SafeLoader | none |
| xxe | `lxml.etree.fromstring($X)` with no parser argument | none |
| header | `redirect($X)`, `res.redirect($X)` | your redirect-check helper |
| redos | `re.compile($X)` / `new RegExp($X)` with tainted `$X` | `re.escape(...)` |

4. Test file annotations: put `# ruleid: <id>` (or `// ruleid: <id>` in JS and Go) on the line above each line that must match, and `# ok: <id>` above each line that must not. Include at least one true positive copied from the original bug and one negative copied from the fixed code.
5. Validate syntax: `semgrep --validate --config .semgrep/`.
6. Run tests: `semgrep --test .semgrep/`. Every rule must report all annotations matched.

### Output
Rules and tests.

### Quality Gate
- `semgrep --validate --config .semgrep/` exits 0.
- `semgrep --test .semgrep/` reports every test passed and no missed or unexpected matches.

---

## Phase 3: Run on the Codebase and Prove Detection

### Entry Criteria
- Rule tests pass.

### Actions
1. `semgrep scan --config .semgrep/ --error --metrics=off`. Exit code 0 means no findings. Record `baseline_findings`.
2. If there are findings on fixed code: either the fix is incomplete (go back to the class flow) or the rule lacks a sanitizer for a valid pattern (add it, plus an `# ok:` test line). Do NOT add `# nosemgrep` to make it pass unless the line is a reviewed exception, and then write `# nosemgrep: <rule-id> -- <reason>`.
3. Detection proof: in a scratch branch, revert one fix per class, run step 1, confirm exit code 1 and the expected rule ID, then discard the branch.
4. Record the CI command: `semgrep scan --config .semgrep/ --config p/owasp-top-ten --error --metrics=off --sarif -o semgrep.sarif`.

### Output
`semgrep_rules`.

### Quality Gate
- Step 1 exits 0 on the fixed code.
- Step 3 exits 1 with the expected rule ID for every class.

---

## Worked Example

Illustrative. `stack` = `python`, classes `["sql", "ssrf", "path"]`.

Phase 2:
```
$ semgrep --test .semgrep/
3/3: ✓ All tests passed
```
Phase 3 detection proof after reverting `shop/hooks.py` to `requests.post(sub.url, ...)`:
```
$ semgrep scan --config .semgrep/ --error --metrics=off
  shop/hooks.py
    ival-py-ssrf-unguarded
      User-controlled URL reaches an HTTP client outside the SSRF guard. Use guard.session().
       30┆ requests.post(sub.url, json=payload, timeout=TIMEOUT_S)
$ echo $?
1
```

---

## Exit Criteria

DONE when every class in the sink map has a custom taint or pattern rule with passing annotated tests, the fixed codebase scans clean, and reverting any fix makes the scan fail with the matching rule.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Registry config download blocked (offline CI) | **Adjust**: vendor the registry rules into `.semgrep/vendor/` with their license notes, or run custom rules only and record that. |
| Phase 2 | Taint does not flow through your framework's request object | **Adjust**: add the framework's accessor to `pattern-sources` (for example FastAPI parameters need `pattern-sources` on function parameters with `focus-metavariable`). Check the Semgrep taint mode docs. |
| Phase 2 | `semgrep --test` reports a missed match | **Adjust** the rule, not the annotation. |
| Phase 3 | Detection proof does not fire | **Stop**: the rule does not cover the real bug shape; add the original buggy line to the test file as `ruleid` and fix the rule. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
