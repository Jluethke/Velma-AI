# Architecture Overview With Mermaid Diagrams as Code

**One-line description:** Writes an `ARCHITECTURE.md` explanation page (bird's-eye view, code map of real directories, main data flow, invariants, cross-cutting concerns) with a Mermaid `flowchart` for components and a `sequenceDiagram` for the main request path, and proves every diagram parses by rendering it with mermaid-cli (`mmdc`).

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `audience_profile` (object[], required): Personas from `dfc-audience-doctype-plan`; the page targets the Contributor persona.

---

## Outputs

- `architecture_doc_path` (string): Path to `ARCHITECTURE.md` (repository root) or `docs/explanation/architecture.md` when a docs site exists.
- `diagram_sources` (object[]): Each Mermaid block: diagram type, what it shows, the code paths each node stands for, and the `mmdc` render result.

---

## Phase 1: Build the Code Map From the Tree

### Entry Criteria
- `audience_profile` contains a Contributor persona, or the user asked for an architecture page.

### Actions
1. Print the top two levels of tracked directories: `git ls-files | awk -F/ 'NF>1{print $1"/"(NF>2?$2"/":"")}' | sort -u`.
2. For each directory, write one or two sentences: what lives there and what it must not depend on. Read the entry files to confirm (`main.go`, `cmd/*/main.go`, `src/index.ts`, `src/<pkg>/__init__.py`, `src/main.rs`, `src/lib.rs`).
3. Find real dependencies between top-level modules instead of guessing:

   | Stack | Command |
   |---|---|
   | Go | `go list -f '{{.ImportPath}}: {{join .Imports " "}}' ./...` |
   | Python | `git grep -h -E '^(from|import) <pkg>\.' -- 'src/**/*.py' \| sort \| uniq -c` per module, or `pydeps <pkg> --show-deps --no-output` if installed |
   | Node/TS | `npx madge --json src/` (or `npx depcruise src --output-type json` with dependency-cruiser) |
   | Rust | `cargo tree --workspace --depth 1` for crates; `use crate::` grep per module |

4. Record invariants you can verify, such as "`core/` imports nothing from `http/`", and the command that proves each one.
5. Do NOT list a directory that `ls` cannot find, and do NOT describe components that are planned but not built.

### Output
Code map and dependency list with commands.

### Quality Gate
- `ls -d <each directory in the code map>` succeeds for every entry.
- Each stated invariant has a command whose output was checked.

---

## Phase 2: Write Diagrams as Code

### Entry Criteria
- Code map complete.

### Actions
1. Component diagram as a flowchart, one node per code map entry, edges only where Phase 1 found a dependency:
   ````markdown
   ```mermaid
   flowchart LR
     cli["cmd/tidyconf (CLI)"] --> core["internal/core"]
     http["internal/httpapi"] --> core
     core --> schema["internal/schema"]
     core --> store[("SQLite file")]
   ```
   ````
2. Main request path as a sequence diagram using the real function names:
   ````markdown
   ```mermaid
   sequenceDiagram
     participant U as User
     participant C as cli.Run
     participant V as core.Validate
     participant S as schema.Load
     U->>C: tidyconf check app.yaml
     C->>S: Load(path)
     S-->>C: *Schema
     C->>V: Validate(doc, schema)
     V-->>C: []Issue
     C-->>U: exit code 0 or 1
   ```
   ````
3. Mermaid syntax rules that weak models break:

   | Rule | Why |
   |---|---|
   | Quote labels that contain parentheses, brackets, slashes or colons: `a["cmd/x (CLI)"]` | Unquoted special characters end the node shape and cause a parse error |
   | Never use `end` as a node ID in a flowchart (use `endNode`) | `end` closes a subgraph |
   | Use `flowchart`, not the older `graph`, for new diagrams | `flowchart` supports newer features; both render, but stay consistent |
   | Do not use the `C4Context` diagram type for a page that must render on GitHub without checking | Mermaid marks C4 diagrams experimental |
   | If the rendered SVG needs horizontal scrolling at the docs page width, split it into one diagram per subsystem | Readability; there is no standard node limit, so the render decides |

4. Write the page sections: Bird's-eye view (what the system does, one paragraph), Code map (Phase 1), Component diagram, Main flow (sequence diagram), Invariants (with the commands), Cross-cutting concerns (errors, logging, config, testing).

### Output
`architecture_doc_path` with diagrams embedded.

### Quality Gate
- Every node label in the flowchart corresponds to a code map entry or an external system named in the text.
- Every edge in the flowchart corresponds to a dependency found in Phase 1.

---

## Phase 3: Render to Prove the Diagrams Parse

### Entry Criteria
- Page written.

### Actions
1. Render the Markdown file; mermaid-cli replaces each Mermaid block with an SVG reference and fails on a parse error:
   `npx -p @mermaid-js/mermaid-cli mmdc -i ARCHITECTURE.md -o /tmp/arch-rendered.md`
   It writes `/tmp/arch-rendered-1.svg`, `-2.svg`, and so on. mmdc downloads a headless Chromium through Puppeteer on first use.
2. If a block fails, mmdc prints `Parse error on line N` with the token it expected; fix that block only and rerun.
3. Open each SVG and check node labels are not cut off.
4. Do NOT commit the rendered SVGs unless the docs host cannot render Mermaid. GitHub, GitLab, MkDocs Material (with `pymdownx.superfences` custom fence) and Docusaurus (with `@docusaurus/theme-mermaid`) render the source.

### Output
`diagram_sources` with render results.

### Quality Gate
- The `mmdc` command exits 0 and `ls /tmp/arch-rendered-*.svg | wc -l` equals the number of Mermaid blocks in the page (`grep -c '^```mermaid' ARCHITECTURE.md`).

---

## Worked Example

Illustrative only. Go CLI `tidyconf`.

Phase 1:
```
$ go list -f '{{.ImportPath}}: {{join .Imports " "}}' ./... | grep tidyconf/internal
github.com/acme/tidyconf/internal/core: github.com/acme/tidyconf/internal/schema fmt
github.com/acme/tidyconf/internal/httpapi: github.com/acme/tidyconf/internal/core net/http
```
Invariant: `internal/core` does not import `internal/httpapi` (checked: absent from its import list).

Phase 3, first render:
```
$ npx -p @mermaid-js/mermaid-cli mmdc -i ARCHITECTURE.md -o /tmp/arch-rendered.md
Error: Parse error on line 2:
...  cli[cmd/tidyconf (CLI)] --> core
-----------------------^
Expecting 'SQE', ... got 'PS'
```
Label quoted as `cli["cmd/tidyconf (CLI)"]`; rerun writes `arch-rendered-1.svg` and `arch-rendered-2.svg`; `grep -c` reports 2 blocks.

---

## Exit Criteria

DONE when the architecture page has a code map of existing directories, diagrams whose nodes and edges trace to measured dependencies, verifiable invariants, and every Mermaid block renders with `mmdc`.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Dependency tool not installed | **Adjust**: use the grep fallback in the table; record which method produced the edges. |
| Phase 1 | Measured dependencies violate an intended layering | **Return**: report the violation as a finding; draw the real edges, never the intended ones. |
| Phase 3 | Puppeteer cannot download Chromium | **Adjust**: set `PUPPETEER_EXECUTABLE_PATH` to an installed Chrome or Chromium, or use the `minlag/mermaid-cli` Docker image. |
| Phase 3 | Renders locally but not on the host | **Adjust**: the host's Mermaid version is older; check its documented version and avoid newer syntax. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
