# Semgrep Swallowed Catch Scan

**One-line description:** Writes a small, tested Semgrep rule file that finds swallowed errors, log-and-rethrow and cause-dropping patterns structurally (ignoring formatting and comments), runs it with JSON output, and reconciles the findings with the ripgrep inventory.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Repository root.
- `stack` (string, required): `python`, `go`, `rust` or `typescript`.
- `catch_inventory` (object[], required): From `errh-rg-swallowed-catch-inventory`.

---

## Outputs

- `semgrep_findings` (object[]): `{ rule_id, file, line, end_line, matched_code, also_in_inventory }` per finding, plus the rule file path `.semgrep/errh.yml`.

---

## Phase 1: Write and Test the Rules

### Entry Criteria
- `semgrep --version` prints a version. If not: `python -m pip install semgrep` or `brew install semgrep`.

### Actions
1. Create `.semgrep/errh.yml` in the repo with only the rules for `stack`. Rule IDs below are this flow's own names, not registry rules.

```yaml
rules:
  # python
  - id: errh-py-except-pass
    languages: [python]
    severity: WARNING
    message: Exception swallowed. Narrow the type and handle, or let it propagate.
    pattern-either:
      - pattern: |
          try:
              ...
          except:
              pass
      - pattern: |
          try:
              ...
          except $E:
              pass
      - pattern: |
          try:
              ...
          except $E as $X:
              pass
  - id: errh-py-log-and-raise
    languages: [python]
    severity: WARNING
    message: Logged and re-raised. Log once at the boundary; here only add context.
    patterns:
      - pattern: |
          try:
              ...
          except $E as $X:
              ...
              $LOG.$M(...)
              ...
              raise
      - metavariable-regex:
          metavariable: $M
          regex: ^(error|exception|warning|critical)$
  # go
  - id: errh-go-err-to-nil
    languages: [go]
    severity: WARNING
    message: Error checked and replaced with nil.
    pattern: |
      if $ERR != nil {
          return nil
      }
  - id: errh-go-log-and-return
    languages: [go]
    severity: WARNING
    message: Logged and returned. Wrap with %w and log once at the boundary.
    pattern-either:
      - pattern: |
          if $ERR != nil {
              ...
              $L.Error(...)
              ...
              return ..., $ERR
          }
      - pattern: |
          if $ERR != nil {
              ...
              log.Printf(...)
              ...
              return $ERR
          }
  # rust
  - id: errh-rs-unwrap
    languages: [rust]
    severity: WARNING
    message: unwrap or expect panics on Err. Use ? with context.
    pattern-either:
      - pattern: $X.unwrap()
      - pattern: $X.expect(...)
  # typescript
  - id: errh-ts-empty-catch
    languages: [typescript]
    severity: WARNING
    message: Empty catch block.
    pattern-either:
      - pattern: try { ... } catch ($E) { }
      - pattern: $P.catch(() => {})
  - id: errh-ts-log-and-throw
    languages: [typescript]
    severity: WARNING
    message: Logged and rethrown. Log once at the boundary.
    pattern: |
      try { ... } catch ($E) { ... $LOG.error(...); ... throw $X; }
```

2. Validate syntax: `semgrep scan --validate --config .semgrep/errh.yml`. If `--validate` is not listed in `semgrep scan --help` for your version, run the scan in step 4 on an empty directory instead; a config error prints `Invalid rule` and exits non-zero.
3. Write one positive and one negative fixture per rule under `.semgrep/tests/` with annotations `# ruleid: errh-py-except-pass` and `# ok: errh-py-except-pass` (use `//` for go, rust, typescript), then run `semgrep --test .semgrep/`. Check `semgrep --help` for the test subcommand name in your version.

### Output
Rule file that validates and passes its fixtures.

### Quality Gate
- The validate step exits 0.
- The test run reports every rule as passing; a rule with no positive fixture is not allowed.

---

## Phase 2: Scan

### Entry Criteria
- Rules pass their fixtures.

### Actions
1. Run: `semgrep scan --config .semgrep/errh.yml --json --output semgrep-errh.json --exclude vendor --exclude node_modules --exclude target --exclude .semgrep/tests <repo_path>`.
2. Read `results[]` in the JSON: each item has `check_id`, `path`, `start.line`, `end.line`, `extra.lines`. Read `errors[]`: any `Syntax error` or `PartialParsing` entry means files were not fully scanned; list them.
3. Do NOT pass `--autofix`. This flow finds; triage decides the fix.

### Output
Raw JSON findings.

### Quality Gate
- `jq '.results | length' semgrep-errh.json` prints a number that is recorded.
- `jq '.errors | length' semgrep-errh.json` is recorded; every file listed there is named in the output.

---

## Phase 3: Reconcile with Inventory

### Entry Criteria
- JSON findings saved.

### Actions
1. For each finding, set `also_in_inventory: true` if `catch_inventory` has a row with the same `file` and a `line` between `start.line` and `end.line`.
2. Findings with `also_in_inventory: false` are structural matches ripgrep missed (comments or line breaks inside the block). Keep them.
3. Inventory rows with no Semgrep match are not errors; Semgrep covers fewer patterns. Do not delete them.
4. Delete `semgrep-errh.json` from the repo after copying its content to the run record; keep `.semgrep/errh.yml` and its tests for the lint gate flows.

### Output
`semgrep_findings`.

### Quality Gate
- Count of findings with `also_in_inventory: false` is recorded.
- `git -C <repo_path> status --porcelain` shows only new files under `.semgrep/`.

---

## Worked Example

Illustrative. `stack=python`.

```
$ semgrep --test .semgrep/
2/2: all rules pass
$ semgrep scan --config .semgrep/errh.yml --json --output semgrep-errh.json app/
$ jq -r '.results[] | "\(.check_id) \(.path):\(.start.line)"' semgrep-errh.json
errh-py-except-pass app/payments/client.py:52
errh-py-log-and-raise app/orders/service.py:113
```
`app/orders/service.py:113` is not in the ripgrep inventory (the `logger.exception` call sits two lines below the `except`), so `also_in_inventory=false`.

---

## Exit Criteria

DONE when `.semgrep/errh.yml` passes its fixtures, the scan JSON was read including `errors[]`, and every finding is reconciled.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | A rule fails its own fixture | **Adjust**: simplify the pattern (remove one `...`), rerun the test; never delete the fixture to pass. |
| Phase 1 | Language not supported by the installed version | **Adjust**: drop that rule and rely on the ripgrep and linter flows; record it. |
| Phase 2 | Scan reports parse errors on many files | **Adjust**: check the language version (for example TS decorators) and record files not scanned; do not claim zero findings for them. |
| Phase 2 | Scan exceeds time | **Retry**: add `--jobs` and narrow to source dirs; check `semgrep scan --help` for `--timeout`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
