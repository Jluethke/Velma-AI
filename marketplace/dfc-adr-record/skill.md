# Architecture Decision Record With adr-tools or MADR

**One-line description:** Records one architecture decision as a numbered, immutable ADR file (Michael Nygard's template via adr-tools, or the MADR template), bootstraps the ADR directory with ADR 0001 when none exists, links superseded records both ways, and regenerates the ADR index.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `repo_path` (string, required): Absolute path to the repository root.
- `decision_context` (string, optional): The decision to record: the problem, the options considered, the option chosen and who chose it. When absent, the flow only bootstraps the directory with ADR 0001 "Record architecture decisions".

---

## Outputs

- `adr_path` (string): Path of the ADR file written (for example `doc/adr/0007-use-sqlite-for-local-cache.md`).
- `adr_index` (object[]): Every ADR in the directory: number, title, status, superseded-by link where present.

---

## Phase 1: Locate or Create the ADR Directory

### Entry Criteria
- `repo_path` is a git repository.

### Actions
1. Look for an existing directory: `ls -d doc/adr docs/adr docs/decisions docs/architecture/decisions adr 2>/dev/null` and `cat .adr-dir 2>/dev/null` (adr-tools stores its directory path in `.adr-dir`).
2. Decide the template:

   | Found | Template and tool |
   |---|---|
   | Existing ADRs with `## Status`, `## Context`, `## Decision`, `## Consequences` | Nygard; use `adr-tools` if `.adr-dir` exists, otherwise write files by hand in the same format |
   | Existing ADRs with `## Context and Problem Statement`, `## Considered Options`, `## Decision Outcome` | MADR; copy the template version already used in the directory |
   | No ADRs | Nygard via adr-tools when `adr` is installed (`adr help` prints usage); otherwise MADR files by hand in `docs/decisions/` |

3. Bootstrap when no directory exists: `adr init doc/adr`. It creates `doc/adr/0001-record-architecture-decisions.md`, an accepted ADR stating the team records decisions. For MADR by hand, create `docs/decisions/0001-record-architecture-decisions.md` with the same content in MADR sections.
4. Do NOT renumber or rename existing ADRs; links and references depend on the numbers.

### Output
ADR directory and template decision.

### Quality Gate
- `ls <adr_dir>/0001-*.md` succeeds.
- The template decision row is recorded with the file that evidenced it.

---

## Phase 2: Write the Decision

### Entry Criteria
- `decision_context` is supplied; otherwise skip to Phase 3.

### Actions
1. Create the file:
   - adr-tools: `adr new Use SQLite for the local cache` (writes the next number, sets status "Accepted" and opens `$EDITOR`; set `EDITOR=true` to skip the editor in automation, then edit the file).
   - Superseding an earlier decision: `adr new -s 4 Use SQLite for the local cache` marks ADR 4 "Superseded by" the new one and the new one "Supersedes" ADR 4.
   - By hand: next number is `ls <adr_dir> | grep -o -E '^[0-9]{4}' | sort -n | tail -1` plus one, zero-padded to four digits; file name is the number plus the title in lowercase with hyphens.
2. Fill sections from `decision_context` only:

   | Section | Content rule |
   |---|---|
   | Status | Proposed, Accepted, Deprecated, or Superseded by ADR-NNNN; use what the user stated |
   | Context | Forces at play: requirements, constraints, facts measured; no decision here |
   | Decision | One active-voice statement: "We will use SQLite ..." |
   | Consequences | What becomes easier and what becomes harder, both; at least one negative consequence when the context names one |
   | Considered options (MADR) | Every option the user named, each with pros and cons stated by the user or measured |

3. Do NOT invent options, benchmark numbers, or a negative consequence the user did not state. If the context is missing the reason for the choice, write "Open question:" in Context and keep status Proposed.
4. Do NOT edit the body of an Accepted ADR to change the decision. A changed decision is a new ADR that supersedes the old one; only the status line of the old one changes.

### Output
`adr_path`.

### Quality Gate
- `grep -c -E '^## (Status|Context|Decision|Consequences)' <adr_path>` prints `4` for Nygard (MADR: the four MADR headings are present).
- When superseding: `grep -n 'Superseded by' <old_adr>` and `grep -n 'Supersedes' <adr_path>` both print a line.

---

## Phase 3: Regenerate the Index

### Entry Criteria
- ADR directory exists.

### Actions
1. adr-tools: `adr generate toc > <adr_dir>/README.md`. By hand: write `<adr_dir>/README.md` with one line per file `- [NNNN Title](NNNN-title.md) (Status)`.
2. Link the index from the architecture page or docs site navigation.
3. Build `adr_index` from the files: for each, number, first-line title and the status section's first line.

### Output
`adr_index`.

### Quality Gate
- The number of index lines equals `ls <adr_dir>/[0-9][0-9][0-9][0-9]-*.md | wc -l`.
- `lychee --offline <adr_dir>/README.md` (see `dfc-lychee-link-check`) exits 0, proving every index link points to an existing file.

---

## Worked Example

Illustrative only. `decision_context`: "Local cache: chose SQLite over a JSON file and over BoltDB. JSON rewrites the whole file on each update; BoltDB has no SQL for the ad hoc queries support needs. Downside: adds a C dependency through the sqlite driver. Decided by the maintainers on 2026-10-14; replaces ADR 4 (JSON cache)."

Phase 1: `.adr-dir` contains `doc/adr`; Nygard template.

Phase 2:
```
$ EDITOR=true adr new -s 4 Use SQLite for the local cache
doc/adr/0007-use-sqlite-for-the-local-cache.md
$ grep -n 'Superseded by' doc/adr/0004-use-json-file-cache.md
5:Superseded by [7. Use SQLite for the local cache](0007-use-sqlite-for-the-local-cache.md)
```
Consequences section states the C dependency as the negative consequence.

Phase 3: `adr generate toc > doc/adr/README.md` lists 7 entries; `ls doc/adr/[0-9]*.md | wc -l` prints 7.

---

## Exit Criteria

DONE when the ADR directory exists with ADR 0001, the new decision (if any) is a correctly numbered file with all template sections filled from the given context, supersede links point both ways, and the index lists every ADR.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Two ADR directories with different templates | **Return**: report both; ask the user which is canonical. Do not merge them. |
| Phase 2 | `decision_context` lacks the chosen option | **Stop**: an ADR records a made decision; ask for it, or write status Proposed with the options only. |
| Phase 2 | Number collision from a parallel branch | **Adjust**: take the next free number after rebasing; update links that mention the old number in this branch only. |
| Phase 3 | `adr generate` not available in the installed adr-tools | **Adjust**: write the index by hand with the Phase 3 format. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
