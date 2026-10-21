# MkDocs Site Build in Strict Mode

**One-line description:** Builds a documentation site with MkDocs (Material theme), laying out `nav` by Diataxis section from the doc plan, rendering Mermaid through `pymdownx.superfences`, pulling Python API pages with mkdocstrings when the stack is Python, and turning MkDocs `validation` link and nav findings into errors with `mkdocs build --strict` until it exits 0.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `doc_plan` (object[], required): Page plan from `dfc-audience-doctype-plan`; its Diataxis types become the top-level nav sections.

---

## Outputs

- `site_dir` (string): Built site directory (MkDocs default `site/`).
- `site_build_log` (object[]): Strict-build warnings by kind before and after, with the fix for each.

---

## Phase 1: Install and Configure

### Entry Criteria
- A Python virtual environment is active.
- `doc_plan` has at least one page.

### Actions
1. Install with pinned versions in a docs requirements file, for example `docs/requirements.txt` containing `mkdocs-material` and, for Python API pages, `mkdocstrings[python]`. Run `pip install -r docs/requirements.txt`, then `pip freeze | grep -i -E 'mkdocs|mkdocstrings'` and write the exact versions back into the file.
2. Write `mkdocs.yml` at the repository root:
   ```yaml
   site_name: tidyconf
   site_url: https://acme.github.io/tidyconf/
   repo_url: https://github.com/acme/tidyconf
   theme:
     name: material
   nav:
     - Home: index.md
     - Tutorial: tutorial/first-validation.md
     - How-to guides:
         - Validate in CI: how-to/ci-validation.md
     - Reference:
         - CLI: reference/cli.md
         - Python API: reference/api.md
     - Explanation:
         - Architecture: explanation/architecture.md
   markdown_extensions:
     - admonition
     - toc:
         permalink: true
     - pymdownx.superfences:
         custom_fences:
           - name: mermaid
             class: mermaid
             format: !!python/name:pymdownx.superfences.fence_code_format
     - pymdownx.snippets
   plugins:
     - search
     - mkdocstrings
   validation:
     omitted_files: warn
     absolute_links: warn
     unrecognized_links: warn
     anchors: warn
   ```
   The `validation` keys need MkDocs 1.6 or later (`anchors` was added in 1.6); check `mkdocs --version` and drop keys the installed version rejects. Remove `mkdocstrings` from `plugins` when the stack is not Python.
3. Build the `nav` from `doc_plan`: one top-level section per Diataxis type, pages in reading order. Do NOT mix a tutorial page into the Reference section.
4. For Python API pages, `docs/reference/api.md` contains `::: tidyconf` (mkdocstrings identifier syntax); set `options: docstring_style: google` (or `numpy`) under the python handler to match the docstring convention.

### Output
`mkdocs.yml` and docs requirements.

### Quality Gate
- `mkdocs get-deps` runs (MkDocs 1.5+) and lists packages, or `python -c "import yaml"` plus `mkdocs build` parse the config without a YAML error.
- Every `nav` entry path exists under `docs/` (`ls docs/<path>` per entry).

---

## Phase 2: Strict Build and Fix

### Entry Criteria
- Configuration written.

### Actions
1. Build: `mkdocs build --strict 2>&1 | tee /tmp/mkdocs.log`. `--strict` makes any warning abort the build.
2. Fix by message with this table:

   | Message contains | Fix |
   |---|---|
   | `contains a link '<x>', but the target '<y>' is not found among documentation files` | Correct the relative path; links are relative to the current `.md` file |
   | `pages exist in the docs directory, but are not included in the "nav"` | Add the page to `nav`, or move it out of `docs/` if it is not documentation; list it under `not_in_nav` only if it is reachable by links |
   | `contains an absolute link` | Replace with a relative link to the `.md` file |
   | `there is no such anchor on this page` | Fix the fragment to the heading's generated slug (lowercase, hyphens) |
   | `mkdocstrings` / `griffe` errors | Package not importable or docstring parse problem; install the package (`pip install -e .`) and fix the docstring named |

3. Fix one message kind per rebuild.
4. Do NOT remove `--strict` or set validation keys to `info` to get a green build. Every relaxation needs the user's approval and a line in `site_build_log`.

### Output
`site_dir`; `site_build_log`.

### Quality Gate
- `mkdocs build --strict; echo $?` prints `0` last.
- `ls site/index.html` succeeds.

---

## Phase 3: Preview and Deploy Settings

### Entry Criteria
- Strict build passes.

### Actions
1. Preview: `mkdocs serve` and open `http://127.0.0.1:8000/`; check the Mermaid diagrams render and the nav shows the four Diataxis sections.
2. Add `site/` to `.gitignore`.
3. For GitHub Pages, deployment is either `mkdocs gh-deploy --force` (pushes to the `gh-pages` branch) or a CI job that uploads `site/`; use whichever the repository already uses. Do NOT run `gh-deploy` without the user's go-ahead; it pushes to the remote.

### Output
Preview checked; deploy method recorded.

### Quality Gate
- `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/` prints `200` while `mkdocs serve` runs.
- `git check-ignore site` prints `site`.

---

## Worked Example

Illustrative only. Phase 2 first run:
```
$ mkdocs build --strict
INFO    -  Cleaning site directory
WARNING -  Doc file 'how-to/ci-validation.md' contains a link '../reference/cli-options.md', but the target 'reference/cli-options.md' is not found among documentation files.
WARNING -  The following pages exist in the docs directory, but are not included in the "nav" configuration:
  - getting-started.md

Aborted with 2 warnings in strict mode!
```
Fixes: link changed to `../reference/cli.md`; `getting-started.md` was replaced by the tutorial per `doc_plan`, so it is moved out of `docs/` after the user confirms. Rerun: `INFO - Documentation built in 1.12 seconds`, exit 0.

---

## Exit Criteria

DONE when `mkdocs build --strict` exits 0 with nav sections matching the Diataxis plan, every relaxation recorded, and the site previews with diagrams rendered.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Installed MkDocs rejects `validation` keys | **Adjust**: upgrade MkDocs to 1.6 or later in the docs requirements, or remove the rejected keys and record that link validation is partial. |
| Phase 1 | `!!python/name` tag rejected by a YAML linter | **Adjust**: exclude `mkdocs.yml` from that linter's tag check; MkDocs needs the tag. |
| Phase 2 | Warnings come from a plugin you did not configure | **Adjust**: `mkdocs build --strict --verbose` shows the plugin; fix its config or remove it. |
| Phase 3 | Mermaid shows as plain code | **Adjust**: the `custom_fences` block is missing or mis-indented; compare with Phase 1 step 2. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
