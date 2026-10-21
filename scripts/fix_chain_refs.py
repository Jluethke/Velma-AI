"""Fix broken chain references in FlowFabric.

Scans all chain.json files, identifies skill_name values that don't resolve to
a flow directory, and fixes them:
  1. Normalizes Title Case to kebab-case in the chain file
  2. If no matching flow dir exists, creates one with skill.md + manifest.json

Usage: python -I fix_chain_refs.py [--dry-run]
"""
import json
import os
import re
import sys
import textwrap

MKT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "marketplace"))
CHAINS_DIR = os.path.join(MKT, "chains")
FOOTER = "Copyright 2024-present The Wayfinder Trust. All rights reserved."
DRY_RUN = "--dry-run" in sys.argv


def to_kebab(name):
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def build_flow_index():
    flows = {}
    for entry in os.listdir(MKT):
        d = os.path.join(MKT, entry)
        if os.path.isfile(os.path.join(d, "skill.md")):
            flows[entry] = d
    return flows


def find_match(name, flows):
    if name in flows:
        return name
    kebab = to_kebab(name)
    if kebab in flows:
        return kebab
    lower_map = {k.lower(): k for k in flows}
    if name.lower() in lower_map:
        return lower_map[name.lower()]
    return None


def collect_broken_refs(flows):
    broken = {}
    for cf in sorted(os.listdir(CHAINS_DIR)):
        if not cf.endswith(".chain.json"):
            continue
        path = os.path.join(CHAINS_DIR, cf)
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        for step in d.get("steps", []):
            sn = step.get("skill_name", "")
            if not sn:
                continue
            if sn not in flows and find_match(sn, flows) is None:
                kebab = to_kebab(sn)
                if kebab not in broken:
                    broken[kebab] = {
                        "original_names": set(),
                        "inputs": {},
                        "outputs": {},
                        "chains": set(),
                        "description": "",
                    }
                broken[kebab]["original_names"].add(sn)
                broken[kebab]["chains"].add(cf)
                si = step.get("inputs")
                if isinstance(si, dict):
                    broken[kebab]["inputs"].update(si)
                so = step.get("outputs")
                if isinstance(so, dict):
                    broken[kebab]["outputs"].update(so)
            elif sn not in flows and find_match(sn, flows) is not None:
                if sn not in broken:
                    broken[sn] = {"match": find_match(sn, flows), "chains": set()}
                broken[sn]["chains"].add(cf)
    return broken


def infer_description(name, inputs, outputs):
    words = name.replace("-", " ")
    in_list = ", ".join(sorted(inputs.keys())[:3]) if inputs else "user input"
    out_list = ", ".join(sorted(outputs.keys())[:3]) if outputs else "processed output"
    return "Process %s to produce %s." % (in_list, out_list)


def make_skill_md(name, description, inputs, outputs):
    title = name.replace("-", " ").title()
    in_items = []
    for k, v in sorted(inputs.items()):
        if v in ("from_user_input", "from_user_input_optional"):
            req = "required" if v == "from_user_input" else "optional"
            in_items.append("- `%s` (string, %s): Input for %s." % (k, req, k.replace("_", " ")))
        else:
            in_items.append("- `%s` (string, required): Input for %s." % (k, k.replace("_", " ")))
    if not in_items:
        in_items.append("- `input_data` (string, required): Primary input data.")
        inputs["input_data"] = "from_user_input"

    out_items = []
    for k, v in sorted(outputs.items()):
        out_items.append("- `%s` (object): %s." % (k, k.replace("_", " ").title()))
    if not out_items:
        out_items.append("- `result` (object): Processed result.")
        outputs["result"] = "object"

    in_section = "\n".join(in_items)
    out_section = "\n".join(out_items)
    in_keys = [k for k in sorted(inputs.keys())]
    out_keys = [k for k in sorted(outputs.keys())]

    md = textwrap.dedent("""\
# %s

**One-line description:** %s

**Execution Pattern:** Phase Pipeline

---

## Inputs

%s

---

## Outputs

%s

---

## Worked Example

### Entry Criteria

All required inputs are provided and validated.

### Actions

## Phase 1: Analyze

Examine the provided inputs and extract key information.

### Quality Gate

All inputs parsed. No missing required fields.

### Actions

## Phase 2: Process

Apply domain logic to transform inputs into structured outputs.

### Quality Gate

All outputs populated. No empty required fields.

### Output

Return the structured result containing %s.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

%s
""") % (title, description, in_section, out_section,
        ", ".join("`%s`" % k for k in out_keys[:3]),
        FOOTER)
    return md, in_keys, out_keys


def make_manifest(name, description, in_keys, out_keys):
    tags = name.split("-")[:3]
    return {
        "name": name,
        "version": "1.0.0",
        "domain": "engineering",
        "tags": tags,
        "inputs": in_keys,
        "outputs": out_keys,
        "execution_pattern": "phase_pipeline",
        "price": "0",
        "license": "OPEN",
        "description": description,
    }


def update_chains(flows, renames):
    updated_chains = 0
    updated_refs = 0
    for cf in sorted(os.listdir(CHAINS_DIR)):
        if not cf.endswith(".chain.json"):
            continue
        path = os.path.join(CHAINS_DIR, cf)
        with open(path, encoding="utf-8") as f:
            raw = f.read()
        d = json.loads(raw)
        changed = False
        for step in d.get("steps", []):
            sn = step.get("skill_name", "")
            if not sn:
                continue
            resolved = None
            if sn in renames:
                resolved = renames[sn]
            elif sn not in flows:
                kebab = to_kebab(sn)
                if kebab in flows:
                    resolved = kebab
                else:
                    match = find_match(sn, flows)
                    if match:
                        resolved = match
            if resolved and resolved != sn:
                step["skill_name"] = resolved
                changed = True
                updated_refs += 1
        if changed:
            updated_chains += 1
            if not DRY_RUN:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(d, f, indent=2, ensure_ascii=False)
                    f.write("\n")
    return updated_chains, updated_refs


def main():
    if DRY_RUN:
        print("[DRY RUN] No files will be modified.\n")

    flows = build_flow_index()
    print("Flow directories found: %d" % len(flows))

    broken = collect_broken_refs(flows)
    print("Broken skill_name references: %d unique names" % len(broken))

    renames = {}
    created = 0
    renamed = 0
    unresolved = []

    for key, info in sorted(broken.items()):
        if "match" in info:
            for orig in [key]:
                renames[orig] = info["match"]
            renamed += 1
            continue

        kebab = key
        existing_match = find_match(kebab, flows)
        if existing_match:
            for orig in info["original_names"]:
                renames[orig] = existing_match
            renamed += 1
            continue

        inputs = {}
        outputs = {}
        for k, v in info.get("inputs", {}).items():
            inputs[k] = v
        for k, v in info.get("outputs", {}).items():
            outputs[k] = v

        desc = infer_description(kebab, inputs, outputs)
        md, in_keys, out_keys = make_skill_md(kebab, desc, inputs, outputs)
        manifest = make_manifest(kebab, desc, in_keys, out_keys)

        flow_dir = os.path.join(MKT, kebab)
        if not DRY_RUN:
            os.makedirs(flow_dir, exist_ok=True)
            with open(os.path.join(flow_dir, "skill.md"), "w", encoding="utf-8") as f:
                f.write(md)
            with open(os.path.join(flow_dir, "manifest.json"), "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=4, ensure_ascii=False)
                f.write("\n")

        flows[kebab] = flow_dir
        for orig in info.get("original_names", set()):
            if orig != kebab:
                renames[orig] = kebab
        created += 1

    uc, ur = update_chains(flows, renames)

    print()
    print("=== RESULTS ===")
    print("Flow directories created: %d" % created)
    print("Skill names renamed (matched existing): %d" % renamed)
    print("Chain files updated: %d" % uc)
    print("Individual refs updated: %d" % ur)

    remaining_broken = 0
    for cf in sorted(os.listdir(CHAINS_DIR)):
        if not cf.endswith(".chain.json"):
            continue
        path = os.path.join(CHAINS_DIR, cf)
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
        for step in d.get("steps", []):
            sn = step.get("skill_name", "")
            if sn and sn not in flows:
                remaining_broken += 1
                if remaining_broken <= 10:
                    print("  STILL BROKEN: %r in %s" % (sn, cf))
    print("Remaining broken refs: %d" % remaining_broken)

    if DRY_RUN:
        print("\n[DRY RUN] Re-run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
