# EDA Toolchain Check

**One-line description:** Verifies the open hardware toolchain the product needs (KiCad 9, SKiDL, Java with Freerouting, and per product scope the firmware toolchain, build123d, and WireViz), records versions, and stops for approval with exact install steps when anything is missing.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `product_scope` (object, required): From `hw-spec-consolidate`; decides which optional tools are checked.
- `project_dir` (string, required): User project directory where design files will live.

---

## Outputs

- `toolchain_versions` (object): Tool name to version string for every tool found.
- `install_steps` (string[]): Exact install commands or installer URLs for each missing tool, in order. Empty when nothing is missing.

---

## Phase 1: Check Required Tools

### Entry Criteria
- `project_dir` exists or can be created.

### Actions
1. Run `kicad-cli version`; require 9.x.
2. Confirm KiCad's bundled Python can import `pcbnew` and record its version.
3. Confirm `skidl` imports in that same Python and record its version.
4. Run `java -version`; require 17 or newer for current Freerouting releases. Confirm the Freerouting jar exists at a recorded path.

### Output
Required-tool entries in `toolchain_versions`.

### Quality Gate
- Each required tool is either recorded with a version or listed as missing.

---

## Phase 2: Check Scope-Dependent Tools

### Entry Criteria
- Phase 1 complete.

### Actions
1. If `product_scope.has_firmware`: check the vendor toolchain for the expected device family (examples: `west --version` for Zephyr, `idf.py --version` for ESP-IDF, `arm-none-eabi-gcc --version` for bare-metal ARM).
2. If `product_scope.needs_enclosure`: confirm `build123d` imports and record its version.
3. If `product_scope.needs_harness`: run `wireviz --version` and confirm Graphviz `dot -V`.

### Output
Scope-dependent entries in `toolchain_versions`.

### Quality Gate
- Every tool required by a true scope flag is recorded or listed as missing.

---

## Phase 3: Install Plan and Approval Stop

### Entry Criteria
- Phases 1 and 2 complete.

### Actions
1. For each missing tool, write the exact install step from the tool's official site or package index (installer URL, `pip install` command into KiCad's Python, release jar URL).
2. If `install_steps` is non-empty, stop and present the list for the user's approval. Installing software changes the user's machine; never install without approval.
3. After approved installs complete, rerun Phases 1 and 2.

### Output
`install_steps`.

### Quality Gate
- Every missing tool has an official-source install step.
- No install ran without user approval.

---


---

## Worked Example

Illustrative only.

Given typical inputs for Verify KiCad 9, SKiDL, Freerouting, and scope-dependent firmware, enclosure, and, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria

DONE when every tool the product scope requires reports a version, or the run is stopped awaiting approval of a listed install plan.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | KiCad older than 9 | **Stop**: list the KiCad 9 installer step. |
| Phase 1 | SKiDL installed in a different Python than pcbnew | **Adjust**: give the install command for KiCad's bundled Python. |
| Phase 3 | User declines an install | **Stop**: report which downstream flows cannot run. |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
