# Artifact Codegen

Generates Python build scripts (`_build_docx.py`, `_build_pptx.py`, `_build_one_pagers.py`, `_build_contact_html.py`, `_build_intel_xlsx.py`) tailored to the actual registry shapes produced by an upstream outreach / marketing flow. The caller (Claude) then **executes** the emitted scripts to produce the final binary deliverables  --  DOCX, PPTX, HTML, XLSX. This is the "generates code and uses Claude to complete" primitive referenced by `marketing-outreach-architect` Phase 7.

The skill doesn't ship hard-coded scripts. It inspects the registries it's handed and synthesizes scripts that match their field shape, formatting conventions, and any vertical-specific overrides. If the upstream registries evolve, this skill rewrites the builders to match  --  the operator never hand-edits generated code.

## Execution Pattern: ORPA Loop

Justification: the workflow needs to observe registry shapes, reason about the correct script structure, plan a build order, emit the scripts, **and** respond to execution failures by amending and re-emitting. ORPA is correct per the FlowFabric decision criteria  --  the feedback loop (Claude runs → error → Claude amends → re-runs) is load-bearing.

```
OBSERVE --> Inspect registries, voice_sample, style_guide, output_root, and any existing build/ dir
REASON  --> For each deliverable class, determine structure, field mapping, style rules
PLAN    --> Assemble script manifest: one .py per deliverable class, shared utility module, run_build launcher
ACT     --> Write scripts to output_root/build/, hand launcher commands to the caller to execute
         \                                                                                    /
          +--- If execution errors, read error, amend generator, re-run ----------------------+
```

## Inputs

- `registries` (required, object)  --  all upstream outputs the scripts must consume:
  - `scored_lead_list` (per vertical if multi-vertical)
  - `target_intel_registry` (per vertical)
  - `contact_dossier_registry` (per vertical)
  - `send_pack_registry` (per vertical)
  - `archetype_pack_registry` (per vertical)
  - `meeting_sim_registry` (per vertical)
  - `master_playbook` (per vertical or combined)
  - `pricing_outputs` (per vertical; optional)
  - `vertical_scaffold_registry` (optional)
  - `reviewer_brief_registry` (optional)
  - `project_brief_md` (the synthesized product brief)
- `voice_sample` (required, string)  --  for style-tone checks applied to emitted templates.
- `style_guide` (optional, object)  --  `{font_family: "Calibri", font_size: 11, margin_inches: 1.0, brand_primary_hex: "#1F3A5F", brand_accent_hex: "#C9A959", heading_family: "Calibri"}`. Defaults shipped if absent.
- `output_root` (required, path)  --  project directory where scripts and binaries land.
- `deliverable_classes` (optional, array of strings)  --  restrict which builders are emitted; default emits all five. Values: `["docx", "pptx", "one_pagers", "contact_html", "intel_xlsx"]`.
- `regenerate` (optional, bool, default false)  --  if true, overwrite existing builders even when the shape hash matches.

## Outputs

- `generated_scripts`  --  paths to every `.py` file written.
- `launcher_scripts`  --  paths to `run_build.sh` and `run_build.bat`.
- `dependency_manifest`  --  pip install command the caller must run before executing.
- `execution_plan`  --  ordered list of commands for the caller to run (Claude executes these via Bash).
- `execution_results`  --  populated after Claude executes: per-script stdout/stderr + success/fail.
- `emitted_binaries`  --  per-binary: `{path, source_script, bytes, sha256, category}`.

---

## Execution

### OBSERVE: Inspect the Registries

### Entry Criteria
`registries` object is provided; at least one registry key is non-empty; `output_root` is writable.

### Actions
1. For each registry present, sample 3 entries and record the observed field set. Note any field that appears with multiple types (e.g. `email_pattern_guess` sometimes string, sometimes `{pattern, verified}`)  --  builders must handle both.
2. Check `output_root/build/`  --  if it exists and `regenerate` is false, hash the existing scripts and compare against the new shape fingerprint; skip regeneration of unchanged builders.
3. Check `output_root/Contacts/`, `output_root/DOCX/`, `output_root/Pitch_Decks/`  --  create if missing.
4. Read `voice_sample` and `style_guide` so emitted templates carry the right tone and brand colors.
5. Enumerate vertical names across the registries; every per-vertical script must iterate them.

### Output
`inspection_report` with `{registries_observed, field_shapes, verticals, existing_build_hash, output_dirs_ready}`.

### Quality Gate
Every registry named in inputs either has sampled shape data or is explicitly null. If every registry is empty, abort  --  there's nothing to build.

### REASON: Determine Script Structure per Deliverable

### Entry Criteria
`inspection_report` built.

### Actions
For each deliverable class, decide the script's structure:

**`_build_docx.py`**  --  converts all `.md` drafts to `.docx`:
- Top of file: imports (`pathlib`, `docx`, `docx.shared`, `re`), style constants from style_guide.
- Helper: `apply_style(doc)`  --  applies Calibri 11, 1-inch margins, header + footer with company name + page number.
- Helper: `md_to_docx(md_path, docx_path)`  --  parses markdown (headings #..######, bold **, italic *, bullets -, numbered, tables, code blocks) and writes styled DOCX. Use `python-docx`'s paragraph + run API directly; no intermediate HTML.
- Main: walk a hardcoded manifest of `{source_md_path: target_docx_path}` entries derived from the registries. Print each conversion.
- Exit with nonzero if any source is missing; log but don't fatal if a conversion is partially supported (e.g. fenced code inside a table).

**`_build_one_pagers.py`**  --  per-target DOCX with TOC:
- Iterate `target_intel_registry[vertical][company]` + `send_pack_registry[vertical][company]` + `meeting_sim_registry[vertical][company]`.
- Sections in order: Company header → tier/wave/deal_estimate band → WHY THEM + WHY NOW → RECENT PUBLIC STATEMENTS (with source links as hyperlinks) → SPECIFIC HOOKS → TALKING STYLE + STATED WORRIES → WHAT WE COULD FIX → OPENING LINE (callout box) → COLD EMAIL DRAFT → LINKEDIN DM → MEETING SIMULATION (opening / top-5 Q&A / derail responses / close script).
- File per company at `DOCX/<Vertical>_Targets/<slugified-company>.docx`.

**`_build_contact_html.py`**  --  per-target HTML contact pages (user explicitly requested HTML for contact info):
- Emit a shared `contact_style.css` with typography + card/panel layout, brand colors from style_guide.
- Per target, emit `Contacts/<slugified-company>.html`:
  - `<head>` with title, viewport, link to shared CSS, embedded JSON-LD `Person` schema for the primary contact.
  - Identity card (company name, tier, wave, stack layer, composite score).
  - Contact panel: primary contact name + title + LinkedIn link + primary email (with `mailto:` and verification-status badge) + 3 alternate email candidates + phone if public.
  - Warm paths section: for each `STRONG`/`MEDIUM` warm path, show the connector + drafted activation message inside a collapsible `<details>` block.
  - Recent statements: each with source link and date.
  - Best conference + upcoming appearances.
  - Talking style + stated worries + what NOT to say (flagged as warning-styled callout).
  - Opening line (pull-quote styling).
  - Drafted email preview: subject + body, with a copy-to-clipboard button using a tiny inline JS.
  - Footer: "Last refreshed: {iso_date}" + "Source: target_intel + contact_dossier + send_pack".
- Emit `Contacts/_index.html`:
  - Responsive sortable table (plain HTML + a ~40-line inline JS sort helper  --  no external deps).
  - Columns: company, tier, wave, primary_contact, email_status, best_conference, "open contact page" link.
  - Grouped by vertical with a top tabset.

**`_build_pptx.py`**  --  per vertical PPTX:
- Template: 16:9 blank, with a consistent theme applied  --  brand_primary_hex header bar, brand_accent_hex accent lines, Calibri throughout.
- Slide order (12-15 slides): Title / Problem / Why Now / What We Sell / Mechanism / Proof / Pricing (3-component shape) / Target Archetypes / Case Studies / Timeline / The Ask / Appendix (references + data sources).
- Pulls content from `project_brief_md` + `pricing_outputs[vertical]` + `archetype_pack_registry[vertical]` + `target_intel_registry[vertical]` for quote proof points.
- One deck per vertical at `Pitch_Decks/<Vertical>_Business_Presentation.pptx`.
- Also emit an `Investor_Overview.pptx` that's portfolio-wide (all verticals in one deck).

**`_build_intel_xlsx.py`**  --  master XLSX:
- Sheets: `Master`, `<Vertical>_Targets` (one per vertical), `Pitch_Hooks`, `Conferences`, `Critical_Updates`, `Source_Index`.
- Uses `openpyxl`  --  freeze top row, autofilter, column widths sized from observed content.
- Hyperlinks in source columns open the original URL; hyperlinks in contact columns open the HTML contact page emitted by `_build_contact_html.py`.
- File: `Wayfinder_Target_Intelligence.xlsx` (or `<Company>_Target_Intelligence.xlsx` if company_name differs from "Wayfinder").

Also reason about a small shared utility module `build/_common.py`:
- `slugify(s)`, `read_style_guide()`, `load_registry(path)`, `md_to_runs(md)`, `apply_brand_header(doc)`, `hex_to_rgbcolor(hex)`, `write_and_hash(path, bytes)`  --  reduces duplication across builders.

### Output
`script_blueprints`  --  dict of `{filename: {sections, imports, fn_signatures, data_sources}}`.

### Quality Gate
Every deliverable class requested has a blueprint; shared `_common.py` is declared; no blueprint references a field that wasn't observed in OBSERVE.

### PLAN: Build Order + Launcher

### Entry Criteria
`script_blueprints` built.

### Actions
1. Order scripts: `_build_docx.py` first (convert project_brief + pricing + reviewer briefs + playbook), then `_build_one_pagers.py`, then `_build_contact_html.py`, then `_build_pptx.py`, then `_build_intel_xlsx.py`. The intel xlsx last because it hyperlinks into the already-emitted HTML pages.
2. Emit the launcher scripts:
   - `run_build.sh`: `set -e; pip install --quiet python-docx python-pptx openpyxl; python build/_build_docx.py && python build/_build_one_pagers.py && python build/_build_contact_html.py && python build/_build_pptx.py && python build/_build_intel_xlsx.py`.
   - `run_build.bat`: equivalent for Windows.
3. Emit `build/README.txt` explaining what each script does, how to re-run just one, how to upgrade when shapes change.

### Output
`execution_plan`  --  ordered list of shell commands.

### Quality Gate
Launcher exists for both POSIX and Windows; `pip install` line has every required dep; every script appears in the launcher in the correct order.

### ACT: Emit Scripts, Execute, Handle Failures

### Entry Criteria
`script_blueprints` + `execution_plan` built.

### Actions
1. Write every blueprint to `output_root/build/<script_name>.py`. Write `_common.py`. Write launchers. Write `build/README.txt`.
2. Surface the `execution_plan` to the caller. **The caller (Claude) is expected to execute the plan** via its shell tooling  --  this skill does not invoke a Python interpreter itself (the flow standard forbids runtime Python inside flows).
3. On execution failure, the caller reports the error back; this skill reads the error, identifies which generator produced the bad output, amends the generator (common failures: unicode encoding on Windows  --  fix with `encoding='utf-8'` on every write; missing key in a registry entry  --  fix with `.get()` + default; markdown edge case  --  fix with a more permissive regex), and re-emits.
4. Record every execution pass/fail in `execution_results`.

### Output
`generated_scripts`, `launcher_scripts`, `dependency_manifest`, `execution_plan`, `execution_results`, `emitted_binaries`.

### Quality Gate
After the first successful execution pass, every expected binary exists at its declared path and is non-empty. Spot-check: open one DOCX and one PPTX to confirm they load without a corruption warning (the caller does this by running `python -c "from docx import Document; Document('path').paragraphs"` and equivalent for pptx).

---

## Exit Criteria

The skill is DONE when:

1. Every deliverable class requested has an emitted `.py` builder on disk.
2. `run_build.sh` and `run_build.bat` exist and reference every builder in order.
3. The launcher executed cleanly  --  `execution_results` shows pass for every script.
4. Every expected binary (.docx, .pptx, .xlsx, .html) exists at its declared path with non-zero bytes.
5. `emitted_binaries` is populated with path + sha256 + category per file.
6. At least one binary per deliverable class passes a basic load test (open without corruption warning).

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Every registry is empty | **Abort**  --  nothing to build; return a gap report |
| OBSERVE | `output_root/build/` contains human-edited scripts | **Abort**  --  never overwrite human edits; surface and require `regenerate=true` with explicit acknowledgement |
| REASON | Registry field appears with inconsistent types | **Adjust**  --  blueprint the builder to handle both; log a warning with the inconsistent sample |
| REASON | style_guide missing required keys | **Default**  --  fill from the shipped default and log what was defaulted |
| PLAN | Launcher detects a circular dependency between scripts | **Abort**  --  shouldn't happen with the standard order; if it does, the upstream blueprint generation is wrong |
| ACT | `pip install` fails for python-docx / pptx / openpyxl | **Surface**  --  tell the caller exactly which package failed + the pip error; do not retry blindly |
| ACT | A script errors at runtime | **Amend + re-emit**  --  read the error, identify the generator, patch the generator, re-emit, re-run. Bounded to 3 attempts per script; surface for human review after. |
| ACT | Binary load test fails (DOCX corrupt) | **Amend + re-emit**  --  usually an unclosed tag or invalid color code in an emitted run; fix the helper; re-run. |

## State Persistence

Writes `output_root/.architect/codegen_state/`:

- `script_shape_hashes`  --  sha256 per emitted script; re-runs skip unchanged ones unless `regenerate=true`.
- `execution_history`  --  every launcher run's stdout/stderr summary (last 10 retained).
- `known_errors_playbook`  --  patterns we've fixed before (e.g. "unicode on Windows → add `encoding='utf-8'`"), so the amend loop converges faster on re-runs.

## Reference

### Why This Skill Exists

FlowFabric's standard says flows are skill.md + manifest.json + chain.json only  --  no Python inside flows. But a full outreach project requires Python to produce binaries (python-docx, python-pptx, openpyxl). This skill squares the circle: **the flow emits the Python, the caller executes it**. The emitted scripts are operator-readable artifacts that get committed alongside the project, not opaque flow-runtime bytecode.

The "utilize Claude to complete" part happens naturally: when a script errors, Claude has the source on disk, can patch it, and re-run. That makes the build loop reliable in a way a monolithic binary builder wouldn't be.

### Why HTML for Contact Info

The operator explicitly requested HTML for contact information  --  not DOCX  --  because contact dossiers are **interactive**: mailto: and tel: links need to be clickable, warm-path activation messages need to be copy-to-clipboard-able, the sortable index needs filtering. DOCX is poor at interactivity. HTML also renders on any device without Office installed, which matters when the operator is on mobile.

### Emitted Script Style Conventions

Every emitted script:

- Opens with a one-line docstring identifying the upstream flow run (`# generated by artifact-codegen from <run_id> at <iso_date>`).
- Imports top-of-file, then declares `BUILD_ROOT = pathlib.Path(__file__).parent.parent`.
- Prefers `pathlib.Path` over `os.path`.
- Uses `encoding='utf-8'` on every `open()` call (Windows compatibility  --  CP1252 bites).
- Uses `try/except` around per-entity conversion so one corrupt entry doesn't kill the whole run.
- Prints a progress line per entity (`[3/25] Acme Corp → Contacts/acme-corp.html`).
- Exits 0 on full success, 1 if any entity failed (but logs all failures before exiting so the operator sees the full picture).

### Style Guide Defaults

```
font_family: "Calibri"
font_size: 11
margin_inches: 1.0
brand_primary_hex: "#1F3A5F"       # deep navy
brand_accent_hex:  "#C9A959"       # muted gold
heading_family:    "Calibri"
footer_text:       "<company_name>  --  Confidential"
```

Operators can override by supplying their own `style_guide` in inputs.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2026-present The Wayfinder Trust. All rights reserved.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
