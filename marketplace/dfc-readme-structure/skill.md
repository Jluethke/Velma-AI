# README Structure and Copy-Paste Commands

**One-line description:** Writes or restructures a project README in a fixed section order (name and one-line purpose, status badges, install, quickstart, usage pointer, docs links, contributing, license) where every shell command is copy-pasteable and extracted into a list that the quickstart verification flow runs verbatim.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `audience_profile` (object[], required): Personas from `dfc-audience-doctype-plan`; the README entry point serves the first-contact persona.
- `doc_plan` (object[], required): Page plan; the README links to pages instead of duplicating them.

---

## Outputs

- `readme_path` (string): Path of the README written (`README.md` at the repository root).
- `readme_commands` (object[]): Every command from the README's Install and Quickstart sections in order: section, line number, exact command text, expected outcome text written in the README.

---

## Phase 1: Collect Facts the README Must State

### Entry Criteria
- `repo_path` exists; `audience_profile` and `doc_plan` are non-empty.

### Actions
1. Read the existing `README.md` if present and keep it open; snapshot it first with `cp README.md README.md.bak` only when the user allows backup files, otherwise rely on `git diff` for review.
2. Collect these facts from files, never from memory:

   | Fact | Where to read it |
   |---|---|
   | Package or binary name | `pyproject.toml [project].name`, `package.json name`, `go.mod module`, `Cargo.toml [package].name` |
   | Supported runtime versions | `requires-python`, `engines.node`, `go` directive in `go.mod`, `rust-version` in `Cargo.toml` |
   | Install command | Registry the project publishes to: `pip install <name>`, `npm install <name>`, `go install <module>/cmd/<bin>@latest` or `go get <module>`, `cargo add <name>` or `cargo install <name>` |
   | License | `LICENSE` file first line and the `license` field in the manifest |
   | Docs site URL | `site_url` in `mkdocs.yml`, `url` + `baseUrl` in `docusaurus.config.js`, or `html_baseurl` in Sphinx `conf.py` |

3. If the install command depends on an unpublished package, write the from-source install instead (`pip install -e .`, `npm ci && npm run build`, `go build ./...`, `cargo build --release`) and say it is from source.
4. Do NOT write a version number that is not in the manifest, and do NOT copy a runtime version from another project.

### Output
Fact sheet with the file each fact came from.

### Quality Gate
- Each fact in the sheet has a file path, and `grep -n '<fact text>' <file>` finds it.

---

## Phase 2: Write the README in the Fixed Order

### Entry Criteria
- Fact sheet complete.

### Actions
1. Write sections in this order. Omit a section only when the "omit when" column applies:

   | Order | Section | Content rule | Omit when |
   |---|---|---|---|
   | 1 | `# <name>` + one sentence | What it is and who it is for, one sentence, no adjectives of praise | never |
   | 2 | Badges | CI status, package version, license; each badge links to its source | no CI and unpublished |
   | 3 | `## Install` | Runtime requirement line, then one fenced `bash` block per install method | never |
   | 4 | `## Quickstart` | The smallest complete run: create input, run one command or 10 lines of code, show expected output in a separate fenced `text` block | never |
   | 5 | `## Usage` | Two to five lines plus links to how-to guides from `doc_plan` | no how-to pages planned |
   | 6 | `## Documentation` | Links to tutorial, how-to index, reference, explanation | no docs site |
   | 7 | `## Contributing` | Link to `CONTRIBUTING.md` | no contributor persona |
   | 8 | `## License` | License name and link to `LICENSE` | never |

2. Command block rules (weak models break these most often):
   - One command per line; no `$ ` prompt prefix inside `bash` blocks, because a prompt prefix makes copy-paste fail.
   - No placeholders the reader must edit, unless the placeholder is in angle brackets and the next line says what to put there.
   - No `cd` into a directory the README never created.
   - Expected output goes in its own `text` block below the command, never mixed into the `bash` block.
3. Keep reference material out of the README: no full option tables, no full API listing. Link to the reference page from `doc_plan`.
4. Edit only `README.md` in this phase. Do NOT touch other doc pages.

### Output
`readme_path` written.

### Quality Gate
- `grep -n '^## ' README.md` prints `## Install` and `## Quickstart` as the first two `##` headings, in that order.
- `grep -n '^\$ ' README.md` prints nothing inside bash blocks (no prompt prefixes).
- `npx markdownlint-cli2 README.md` exits 0, or every reported rule is listed for `dfc-markdownlint-config`.

---

## Phase 3: Extract the Command List

### Entry Criteria
- `readme_path` written.

### Actions
1. Extract fenced `bash`/`sh`/`shell`/`console` blocks under Install and Quickstart, keeping line numbers. Command: `awk '/^```(bash|sh|shell|console)/{f=1;next}/^```/{f=0}f{print FILENAME":"NR": "$0}' README.md`. Keep only lines whose line numbers fall between the `## Install` heading and the next heading after `## Quickstart` (`grep -n '^## ' README.md` gives those line numbers).
2. Pair each command with the expected outcome stated in the README (the `text` block or the sentence after it).
3. Emit `readme_commands` in README order.

### Output
`readme_commands`.

### Quality Gate
- The count of rows in `readme_commands` equals the count of non-empty, non-comment lines printed by the step 1 `awk` command for the Install and Quickstart sections.

---

## Worked Example

Illustrative only. Node CLI `jsonfmt`, `package.json` has `"engines": {"node": ">=18"}`, `"bin": {"jsonfmt": "bin/cli.js"}`.

Phase 1 fact sheet: name `jsonfmt` (package.json), runtime `Node >=18` (package.json `engines.node`), license MIT (`LICENSE` line 1).

Phase 2 README excerpt:
````
## Install

Requires Node.js 18 or later.

```bash
npm install --global jsonfmt
```

## Quickstart

```bash
echo '{"b":1,"a":2}' > sample.json
jsonfmt --sort-keys sample.json
```

```text
{
  "a": 2,
  "b": 1
}
```
````

Phase 3:
```
README.md:12: npm install --global jsonfmt
README.md:19: echo '{"b":1,"a":2}' > sample.json
README.md:20: jsonfmt --sort-keys sample.json
```
`readme_commands` has 3 rows; the last row's expected outcome is the sorted JSON block.

---

## Exit Criteria

DONE when `README.md` follows the fixed section order, has no prompt prefixes or unexplained placeholders in command blocks, and `readme_commands` lists every Install and Quickstart command with its expected outcome.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Manifest declares no runtime version | **Adjust**: write the version used in CI (`.github/workflows/*.yml` `python-version`, `node-version`, `go-version`, `toolchain`) and cite it; if CI pins none, record an open question for the user. |
| Phase 1 | No license file | **Stop**: ask the user for the license; never pick one. |
| Phase 2 | Quickstart needs credentials or a paid service | **Adjust**: show the environment variable name in angle brackets and link to where the reader gets it; mark the command as requiring a secret in `readme_commands`. |
| Phase 3 | Command spans lines with backslash continuations | **Adjust**: join continuation lines into one `readme_commands` row. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
