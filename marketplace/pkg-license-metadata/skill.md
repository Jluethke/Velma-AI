# License and Metadata Check

**One-line description:** Confirms the library has exactly one SPDX license expression, a LICENSE file whose text matches it, and the right license fields for its registry, and lists dependency licenses that need a human legal decision rather than an automated one.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `package_profile` (object, required): From `pkg-scope-intake`.
- `license_spdx` (string, optional): The SPDX expression the owner chose, for example `MIT`, `Apache-2.0`, or `MIT OR Apache-2.0`. If absent, the flow reads it from the repo.

---

## Outputs

- `license_report` (object): `spdx_expression`, `license_files` (paths), `text_matches_expression` (true/false with the evidence), `registry_fields` (exact lines to put in the manifest for this stack), `dependency_licenses` (name, version, license) and `needs_legal_review` (rows a human must decide).

---

## Phase 1: Establish the License Expression

### Entry Criteria
- `package_profile.stack` is set.

### Actions
1. List license files: `git ls-files | grep -iE '^(LICENSE|COPYING|NOTICE)'`.
2. Decide the expression:

   | `license_spdx` given | License file found | Action |
   |---|---|---|
   | yes | yes | compare them in step 3 |
   | yes | no | stop: the owner must add the license text; do not write legal text from memory |
   | no | yes | identify the text in step 3 and use that SPDX id |
   | no | no | stop: the owner must choose a license; never pick one for them |

3. Identify the file's license. Compare the first lines and key clauses against the official text at `https://spdx.org/licenses/<id>.html`. For example, MIT begins "Permission is hereby granted, free of charge"; Apache-2.0 begins "Apache License Version 2.0, January 2004". If a tool is available, `licensee detect <project_dir>` (Ruby gem) prints the matched license and a confidence; use it as evidence, not as the decision.
4. Confirm the expression is valid SPDX: each id appears in the SPDX license list, and operators are `AND`, `OR`, `WITH` in upper case.
5. For dual licenses (`MIT OR Apache-2.0`), both files must exist, commonly `LICENSE-MIT` and `LICENSE-APACHE`.

### Output
`spdx_expression` and `license_files`.

### Quality Gate
- The expression parses as SPDX (every id found on the SPDX list page).
- Every license named in the expression has its file in `git ls-files`.

---

## Phase 2: Write the Registry Fields

### Entry Criteria
- Expression known.

### Actions
1. Produce the exact fields for the stack:

   | Stack | Field | Notes |
   |---|---|---|
   | python (PEP 639) | `license = "MIT"` and `license-files = ["LICENSE"]` in `[project]` | Needs a backend with PEP 639 support (hatchling 1.27 or later, setuptools 77 or later; confirm in the backend's changelog). Remove `License ::` classifiers when using an expression; recent backends reject both together. |
   | python (older backend) | `license = { text = "MIT" }` or `license = { file = "LICENSE" }` | Use only if upgrading the backend is not allowed. |
   | node | `"license": "MIT"` in `package.json` | Use `"UNLICENSED"` only for packages that must not be used by others. npm always includes a `LICENSE` file in the tarball. |
   | rust | `license = "MIT OR Apache-2.0"` in `[package]` | Use `license-file = "LICENSE"` only for a non-SPDX license. crates.io requires one of `license` or `license-file`. |
   | go | no manifest field | `LICENSE` must be at the module root; pkg.go.dev only shows documentation when it detects a redistributable license. |

2. Record the lines in `registry_fields`. Do not edit the manifest here; the stack metadata flows apply them.

### Output
`registry_fields`.

### Quality Gate
- `registry_fields` contains the field for this stack, spelled exactly as in the table.

---

## Phase 3: List Dependency Licenses

### Entry Criteria
- Phase 2 done.

### Actions
1. Run the lister for the stack, against runtime dependencies only:

   | Stack | Command |
   |---|---|
   | python | `python -m pip install pip-licenses` then `pip-licenses --format=json --with-urls` in a venv that has only the package and its runtime deps installed |
   | node | `npx license-checker --production --json` |
   | go | `go install github.com/google/go-licenses@latest` then `go-licenses report ./...` |
   | rust | `cargo install cargo-deny --locked` then `cargo deny init` and `cargo deny check licenses` |

2. Copy each dependency row to `dependency_licenses`.
3. Put a row in `needs_legal_review` when its license is: unknown or missing, any GPL, LGPL, AGPL, MPL, EUPL or SSPL family license, or a custom text. Do not state whether it is compatible; that is a legal decision for the owner.

### Output
`license_report`.

### Quality Gate
- `dependency_licenses` row count equals the tool's row count.
- Every flagged license appears in `needs_legal_review` with its package name.

---

## Worked Example

Illustrative. Rust crate `fastcsv`, `license_spdx` not given.

Phase 1: `git ls-files` shows `LICENSE-MIT` and `LICENSE-APACHE`. The first starts "Permission is hereby granted, free of charge", the second "Apache License Version 2.0, January 2004". Expression: `MIT OR Apache-2.0`.

Phase 2: `registry_fields = ['license = "MIT OR Apache-2.0"']`.

Phase 3:
```
$ cargo deny check licenses
error[rejected]: failed to satisfy license requirements
  = license expression: MPL-2.0
  = encoding_rs v0.8.33
```
`encoding_rs` goes to `needs_legal_review`. The owner decides whether to allow MPL-2.0 in `deny.toml`.

---

## Exit Criteria

DONE when the expression is valid SPDX, every named license has its file, the registry fields are written out, and every dependency license is listed with legal-review rows separated.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No license chosen and no file | **Stop**: the owner must choose; publishing without a license grants no usage rights. |
| Phase 1 | File text matches a different license than `license_spdx` | **Stop**: report both; the owner decides which is correct. |
| Phase 2 | Backend too old for PEP 639 | **Adjust**: emit the table form and note the backend upgrade as an open item. |
| Phase 3 | License tool cannot resolve a package | **Adjust**: record the package as `unknown` in `needs_legal_review`. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
