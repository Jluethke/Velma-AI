# Safety Requirements Traceability with Sphinx-Needs

**One-line description:** Writes safety goals, functional and technical safety requirements and tests as Sphinx-Needs objects in reStructuredText, declares the need types and an `asil` option in `conf.py`, and turns missing links into build failures with `needs_warnings` and `sphinx-build -W`, then reads `needs.json` to report coverage.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `safety_goals` (object[], required): Output of `fusa-safety-goals-safe-states`.
- `safety_requirements` (object[], required): Output of `fusa-requirements-decomposition`.
- `repo_dir` (string, required): Path to the repository whose `docs/` folder will hold the requirements.

---

## Outputs

- `needs_trace_report` (object): `sphinx_needs_version`, `counts_by_type`, `unlinked_needs`, `goals_without_children`, `needs_json_path`, `build_log_path`.

---

## Phase 1: Configure Need Types

### Entry Criteria
- Python 3 is available.
- `repo_dir` exists.

### Actions
1. Install and record versions: `pip install sphinx sphinx-needs` then `pip show sphinx-needs | grep Version`.
2. If `docs/conf.py` does not exist, run `sphinx-quickstart docs` and accept a separate source folder only if the team already uses one.
3. In `docs/conf.py` add:
   ```python
   extensions = ["sphinx_needs"]
   needs_types = [
       dict(directive="sg",  title="Safety Goal",          prefix="SG_",  color="#E8D5B7", style="node"),
       dict(directive="fsr", title="Functional Safety Req", prefix="FSR_", color="#BFD8D2", style="node"),
       dict(directive="tsr", title="Technical Safety Req",  prefix="TSR_", color="#DCDCDC", style="node"),
       dict(directive="tst", title="Test Case",             prefix="TST_", color="#F2E2A0", style="node"),
   ]
   needs_extra_options = ["asil", "verification_method"]
   needs_id_required = True
   needs_warnings = {
       "fsr_without_parent": "type == 'fsr' and len(links) == 0",
       "tsr_without_parent": "type == 'tsr' and len(links) == 0",
       "tst_without_target": "type == 'tst' and len(links) == 0",
   }
   ```
4. Option and config names change between Sphinx-Needs releases. Check each key against the configuration page of the docs for the installed version; if a key is renamed, use the new name and note it.

### Output
`docs/conf.py` with need types and warnings.

### Quality Gate
- `sphinx-build -b html docs docs/_build/html` exits 0 on the empty project.
- `python -c "import sphinx_needs; print(sphinx_needs.__version__)"` prints the version recorded in Phase 1.

---

## Phase 2: Write the Needs

### Entry Criteria
- Phase 1 gate passed.

### Actions
1. Create `docs/safety_goals.rst`, `docs/fsr.rst`, `docs/tsr.rst`, `docs/tests.rst` and add them to the `toctree` in `docs/index.rst`.
2. Write one directive per item:
   ```rst
   .. sg:: Avoid unintended lateral motion caused by the item
      :id: SG_002
      :asil: B

   .. fsr:: Remove steering motor power on implausible command
      :id: FSR_004
      :asil: B
      :links: SG_002

   .. tsr:: Drive STOP_REQ_N low on CRC or alive-counter error
      :id: TSR_011
      :asil: A(B)
      :verification_method: test
      :links: FSR_004
   ```
3. Add a coverage table at the end of `docs/index.rst`:
   ```rst
   .. needtable::
      :types: fsr;tsr
      :columns: id;title;asil;links;links_back
   ```

### Output
RST files with every goal, requirement and test as a need.

### Quality Gate
- `grep -c "^.. sg::" docs/safety_goals.rst` equals the number of safety goals.
- `grep -c ":id:" docs/*.rst` equals the total number of items written.

---

## Phase 3: Build Strict and Read needs.json

### Entry Criteria
- Phase 2 gate passed.

### Actions
1. Build the HTML with warnings as errors: `sphinx-build -W --keep-going -b html docs docs/_build/html 2>&1 | tee needs_build.log`. A `needs_warnings` filter that matches any need fails the build.
2. Build the JSON export: `sphinx-build -b needs docs docs/_build/needs`. It writes `needs.json`.
3. Find goals with no children (jq path depends on the version; look at the top-level keys first with `jq 'keys' docs/_build/needs/needs.json`):
   ```
   jq -r '.versions[].needs[] | select(.type=="sg" and (.links_back|length)==0) | .id' docs/_build/needs/needs.json
   ```
4. Fill `needs_trace_report` from the log and jq results.

### Output
`needs_trace_report`.

### Quality Gate
- `sphinx-build -W` exits 0.
- The jq query in action 3 prints nothing.
- `needs_build.log` contains no line with `WARNING`.

---

## Worked Example

Illustrative only.

```
$ sphinx-build -W --keep-going -b html docs docs/_build/html
...
WARNING: fsr_without_parent: failed
	failed needs: 1 (FSR_006)
	used filter: type == 'fsr' and len(links) == 0
build finished with problems, 1 warning.
```
Phase 3 adds `:links: SG_003` to FSR_006 and reruns; the build exits 0 and the jq query returns no goals.

---

## Exit Criteria

DONE when the strict build passes, `needs.json` exists, no goal lacks a child, and the report records versions and log paths.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Config key unknown to the installed version | **Adjust**: use the key name from that version's documentation. |
| Phase 2 | Duplicate id error | **Adjust**: renumber the newer item; never reuse an id. |
| Phase 3 | Strict build fails on an unrelated Sphinx warning | **Adjust**: fix the RST problem the warning names; do not drop `-W`. |
| Phase 3 | Goal without child | **Return**: send it to `fusa-requirements-decomposition`. |

**Do not:** remove entries from `needs_warnings` to get a green build, or delete a need to remove a link error.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
