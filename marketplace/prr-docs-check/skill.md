# PR Documentation Check

**One-line description:** Verifies that every behavior, public API, configuration key and breaking change the PR introduces is reflected in docstrings, README, CHANGELOG and migration notes, runs the doc examples and link checks that exist for the stack, and flags comments and docs the PR made stale.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `diff_file` (string, required): Saved PR diff.
- `changed_files` (object[], required): Rename-aware file list.
- `compat_findings` (object[], required): Compatibility findings from `prr-api-compat-pass`.
- `findings_dir` (string, required): Findings directory.

---

## Outputs

- `docs_findings` (object[]): Missing, stale or broken documentation, written to `<findings_dir>/prr-docs-check.json`.

---

## Phase 1: Build the Documentation Obligation List

### Entry Criteria
- `diff_file` exists.

### Actions
1. Create one obligation per change, using this table:

| Change in the PR | Documentation it obliges |
|---|---|
| New or changed public function, class, method | Docstring (Python PEP 257 / project style such as Google or NumPy), TSDoc/JSDoc `/** */`, Go doc comment starting with the identifier name, Javadoc |
| New or changed CLI flag or command | `--help` text and the README or docs page that lists flags |
| New config key or environment variable | The config reference page and `.env.example` or sample config |
| Every item in `compat_findings` classed breaking or behavioral | CHANGELOG entry and a migration or upgrade note |
| User-visible behavior change | CHANGELOG entry (format used in the repository, for example Keep a Changelog `## [Unreleased]` with `Added`/`Changed`/`Deprecated`/`Removed`/`Fixed`/`Security`) |
| Architectural decision (new datastore, new service, new pattern) | ADR in `docs/adr/` if the repository keeps ADRs |
| New HTTP endpoint | OpenAPI document or API docs page |

2. Check whether the project uses changesets or fragments instead of editing CHANGELOG directly: `.changeset/` (Changesets), `changelog.d/` or `newsfragments/` (towncrier), `changes/` directories. Use whatever the repository uses.

### Output
Obligation list.

### Quality Gate
- Every public surface change and every breaking or behavioral item in `compat_findings` has an obligation row.

---

## Phase 2: Check Each Obligation and Find Stale Text

### Entry Criteria
- Phase 1 complete.

### Actions
1. For each obligation, find the doc change in the diff. Mark it met, missing, or partial.
2. For changed function signatures, compare parameter names in the docstring with the new signature: a documented parameter that no longer exists, or a new parameter not documented, is stale.
3. Search for stale references to renamed or removed names across docs and comments:
   `rg -n '<old_name>' --glob '*.md' --glob '*.rst' --glob '*.py' --glob '*.ts' --glob '*.go' <repo_dir>`
   Any hit outside CHANGELOG history is stale.
4. Run executable documentation checks that the stack provides, only on changed modules:

| Stack | Command |
|---|---|
| Python doctests | `python -m pytest --doctest-modules <changed modules>` or `python -m doctest -v <file>` |
| Go examples | `go test -run '^Example' ./<pkg>/` (Example functions with `// Output:` comments are verified) |
| Rust doc tests | `cargo test --doc` |
| Markdown links | `lychee <changed .md files>` (if installed) |

### Output
Obligation status list and doc check outputs.

### Quality Gate
- Every obligation is marked met, missing or partial.
- Each executable doc check that applies was run with its exit code recorded, or recorded as "not available".

---

## Phase 3: Record Findings

### Entry Criteria
- Phase 2 complete.

### Actions
1. Label:

| Situation | Label |
|---|---|
| Breaking change with no CHANGELOG or migration note | blocking |
| Doc or comment now states something false (stale parameter, old behavior) | blocking |
| Failing doctest or Go example | blocking |
| New public API with no docstring in a project that documents its public API | suggestion |
| New config key not in the reference docs | suggestion |
| Broken link in changed Markdown | nit |

2. For each missing doc, write the text to add (a draft docstring or CHANGELOG line), so the author can paste it.
3. Write `<findings_dir>/prr-docs-check.json` (fields `flow`, `category`="docs", `file`, `line`, `evidence`, `proposed_label`, `fix`) and validate with `python -m json.tool`.

### Output
`docs_findings`.

### Quality Gate
- Every missing or partial obligation has a finding with draft text in `fix`.
- The findings file passes `python -m json.tool`.

---

## Worked Example

Illustrative. `compat_findings` has one breaking item: `format_amount` lost the default for `currency`. Diff also adds env var `PAYMENTS_TIMEOUT_MS`.

- Phase 1: obligations: docstring for `format_amount`; CHANGELOG plus upgrade note; config reference and `.env.example` for `PAYMENTS_TIMEOUT_MS`.
- Phase 2: docstring still says `currency: defaults to "USD"`: stale. No CHANGELOG change (repository uses `CHANGELOG.md` with `## [Unreleased]`). `.env.example` not updated. `python -m pytest --doctest-modules acme_money/fmt.py` fails: `Expected: '$1.00'`, `Got: TypeError: format_amount() missing 1 required positional argument: 'currency'`.
- Phase 3: blocking (stale docstring), blocking (failing doctest), blocking (no CHANGELOG for breaking change; draft "### Changed\n- `format_amount` now requires `currency`."), suggestion (`.env.example`).

---

## Exit Criteria

DONE when every documentation obligation from the diff and the compatibility findings is checked, stale references are searched, executable doc checks ran where available, and every gap is a finding with draft text.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Repository has no CHANGELOG and no release notes process | **Adjust**: put the breaking change note in the PR description instead, and add a question. |
| Phase 2 | Doctests need fixtures that are unavailable | **Adjust**: record "doctest not run" and read the examples by hand against the new signature. |
| Phase 3 | Docs live in a separate repository | **Adjust**: label `question` and ask for the linked docs PR. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
