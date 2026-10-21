# Docs Audience and Diataxis Doc Type Plan

**One-line description:** Names the concrete readers of a project's developer documentation and assigns every planned page exactly one Diataxis type (tutorial, how-to guide, reference, explanation), producing a page plan where no page mixes two types.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root whose documentation is being planned.
- `product_summary` (string, required): Two or three sentences on what the software does and how it is consumed (library, CLI, service, SDK, framework).
- `audience_notes` (string, optional): Anything known about the readers: support tickets, issue titles, onboarding complaints, who files bugs. When absent, the flow derives readers from the repository only.

---

## Outputs

- `audience_profile` (object[]): One row per reader persona: name, what they already know, what they arrive wanting to do, entry point (README, site home, search, IDE hover), and the evidence that this persona exists.
- `doc_plan` (object[]): One row per planned page: path, Diataxis type, persona, the single question or task the page answers, source of truth (code, config, ADR, human), and status (exists, missing, wrong-type).

---

## Phase 1: Identify Readers From Evidence

### Entry Criteria
- `repo_path` exists and is readable.
- `product_summary` is non-empty.

### Actions
1. List how the software is consumed. Run the matching command and record what it prints:
   - Python: `ls pyproject.toml setup.cfg setup.py 2>/dev/null` then read `[project.scripts]` and `[project]` in `pyproject.toml`.
   - Node: `cat package.json` and read `bin`, `main`, `exports`, `types`.
   - Go: `cat go.mod` and `ls cmd/ 2>/dev/null` (a `cmd/` directory means binaries; packages outside `internal/` are importable API).
   - Rust: `cat Cargo.toml` and read `[lib]`, `[[bin]]`, `[workspace]`.
2. Apply this table to name candidate personas. Add a persona only when its row's evidence is present:

   | Evidence in repo | Persona to add |
   |---|---|
   | Importable public API (exports, `__all__`, exported Go identifiers, `pub` items) | Integrator: calls the API from their own code |
   | CLI entry point (`bin`, `[project.scripts]`, `cmd/`, `[[bin]]`) | Operator: runs commands, edits config files |
   | `CONTRIBUTING.md`, open issue tracker, PR template | Contributor: changes this repo's code |
   | Deploy manifests (Helm chart, `docker-compose.yml`, Terraform) | Deployer: installs and runs the service |
   | Plugin or extension interface (entry points, hook registry) | Extender: writes plugins against an interface |

3. For each persona, write what they already know (language, domain) and what they do NOT know (this project's vocabulary). Use `audience_notes` when supplied; when it is absent, write "assumed: no prior knowledge of this project".
4. Do NOT invent personas such as "executives" or "data scientists" without evidence from step 2 or from `audience_notes`.

### Output
Draft `audience_profile` with evidence for each row.

### Quality Gate
- Every `audience_profile` row cites a file path or an `audience_notes` sentence as evidence.
- Running the step 1 command for the stack prints the file that the evidence cites.

---

## Phase 2: Classify Every Page Into One Diataxis Type

### Entry Criteria
- `audience_profile` has at least one row.

### Actions
1. List existing doc pages: `git -C <repo_path> ls-files '*.md' '*.mdx' '*.rst' '*.txt' | grep -v -i -E 'license|changelog'`.
2. Classify each page with this decision table. Ask the questions in order and stop at the first "yes":

   | Question about the page | Diataxis type |
   |---|---|
   | Does it walk a newcomer through a guaranteed-to-work lesson, where the author picks every step and the reader learns by doing? | Tutorial |
   | Does it give steps for a reader who already knows the basics and has a specific goal ("How to rotate the API key")? | How-to guide |
   | Does it describe the machinery (every option, flag, function, field, error code) neutrally and completely, structured like the code? | Reference |
   | Does it discuss why, background, trade-offs, design, history, alternatives? | Explanation |

3. If a page answers "yes" to two rows (for example a tutorial that stops to list all 40 config options), mark it `wrong-type` and record the split: which paragraphs move to which new page.
4. Add missing pages. Minimum plan per persona:
   - Integrator: one tutorial (first successful call), how-to guides for each top task, generated API reference, one explanation of the core concepts.
   - Operator: CLI reference (every command and flag), configuration reference, how-to guides for common tasks.
   - Contributor: `CONTRIBUTING.md` (how-to: set up, test, submit), architecture overview (explanation), ADR directory (explanation).
   - Deployer: install how-to, configuration reference, upgrade how-to.
5. Set the source of truth per page. Reference pages generated from code (autodoc, TypeDoc, godoc, rustdoc, `--help` output) get source `code`; never plan a hand-written copy of a generated reference.

### Output
`doc_plan` with type, persona, question, source of truth and status per page.

### Quality Gate
- Every `doc_plan` row has exactly one of: tutorial, how-to, reference, explanation.
- Every persona in `audience_profile` is the persona of at least one `doc_plan` row.
- Zero reference rows have source `human` when the content can be generated from code.

---

## Worked Example

Illustrative only. Input: `repo_path=/src/tidyconf`, `product_summary="Python library and CLI that validates YAML config files against a schema."`

Phase 1:
```
$ grep -A3 '\[project.scripts\]' pyproject.toml
[project.scripts]
tidyconf = "tidyconf.cli:main"
```
Personas: Integrator (evidence: `src/tidyconf/__init__.py` defines `__all__`), Operator (evidence: `[project.scripts]`), Contributor (evidence: `CONTRIBUTING.md`).

Phase 2:
```
$ git ls-files '*.md' | grep -v -i -E 'license|changelog'
README.md
docs/getting-started.md
docs/options.md
```
`docs/getting-started.md` answers yes to Tutorial and also lists every CLI flag, so status `wrong-type`; the flag list moves to a generated `docs/reference/cli.md`. Missing pages added: `docs/how-to/ci-validation.md` (how-to, Operator), `docs/explanation/schema-model.md` (explanation, Integrator), `docs/reference/api/` (reference, source `code`).

---

## Exit Criteria

DONE when `audience_profile` lists only evidenced personas and `doc_plan` assigns each page one Diataxis type, one persona, one question and one source of truth.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | No manifest file found for any stack | **Stop**: ask the user how the software is consumed; do not guess personas. |
| Phase 1 | `audience_notes` contradicts repo evidence | **Adjust**: keep both personas and record the contradiction in the evidence field. |
| Phase 2 | A page cannot be classified after all four questions | **Adjust**: mark it `wrong-type` and plan it as an explanation page only if it discusses why; otherwise plan its deletion for the user to approve. |
| Phase 2 | Plan grows past what the user can write | **Return**: order `doc_plan` by persona entry point (README first, then tutorial, then reference) and hand back the ordering for the user to cut. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
