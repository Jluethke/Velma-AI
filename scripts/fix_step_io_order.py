"""Fix step inputs/outputs key ordering in chain.json files to match manifest lists.

The validator check_chain.py line 131 checks:
    list(step["inputs"].keys()) == manifest["inputs"]
    list(step["outputs"].keys()) == manifest["outputs"]

Manifest inputs/outputs can be plain strings or dicts with a "name" key.
Step inputs/outputs are dicts {field_name: source_reference}.

This script reorders step input/output dict keys to match the manifest order.
"""
import json
import os
import sys

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")


def manifest_field_names(manifest_list):
    """Extract field name strings from manifest inputs/outputs list."""
    out = []
    for item in manifest_list:
        if isinstance(item, str):
            out.append(item)
        elif isinstance(item, dict) and "name" in item:
            out.append(item["name"])
        else:
            out.append(str(item))
    return out


def reorder_dict(d, key_order):
    """Return a new dict with keys in key_order, then any extras at the end."""
    ordered = {}
    for k in key_order:
        if k in d:
            ordered[k] = d[k]
    for k in d:
        if k not in ordered:
            ordered[k] = d[k]
    return ordered


def main():
    chains_fixed = 0
    steps_reordered = 0
    manifest_cache = {}

    chain_files = sorted(f for f in os.listdir(CHAINS) if f.endswith(".chain.json"))

    for fn in chain_files:
        path = os.path.join(CHAINS, fn)
        c = json.load(open(path, encoding="utf-8"))
        changed = False

        for st in c.get("steps", []):
            skill = st.get("skill_name", "")
            if not skill:
                continue

            if skill not in manifest_cache:
                mf = os.path.join(MKT, skill, "manifest.json")
                if os.path.isfile(mf):
                    try:
                        manifest_cache[skill] = json.load(open(mf, encoding="utf-8"))
                    except (ValueError, OSError):
                        manifest_cache[skill] = None
                else:
                    manifest_cache[skill] = None

            m = manifest_cache[skill]
            if m is None:
                continue

            m_inputs = manifest_field_names(m.get("inputs", []))
            m_outputs = manifest_field_names(m.get("outputs", []))

            st_inputs = st.get("inputs", {})
            st_outputs = st.get("outputs", {})
            if not isinstance(st_inputs, dict) or not isinstance(st_outputs, dict):
                continue
            step_in_keys = list(st_inputs.keys())
            step_out_keys = list(st_outputs.keys())

            reordered = False

            if step_in_keys != m_inputs and set(step_in_keys) == set(m_inputs):
                st["inputs"] = reorder_dict(st["inputs"], m_inputs)
                reordered = True

            if step_out_keys != m_outputs and set(step_out_keys) == set(m_outputs):
                st["outputs"] = reorder_dict(st["outputs"], m_outputs)
                reordered = True

            if step_in_keys != m_inputs and set(step_in_keys) != set(m_inputs):
                new_inputs = reorder_dict(st["inputs"], m_inputs)
                if list(new_inputs.keys())[:len(m_inputs)] != step_in_keys[:len(m_inputs)]:
                    st["inputs"] = new_inputs
                    reordered = True

            if step_out_keys != m_outputs and set(step_out_keys) != set(m_outputs):
                new_outputs = reorder_dict(st["outputs"], m_outputs)
                if list(new_outputs.keys())[:len(m_outputs)] != step_out_keys[:len(m_outputs)]:
                    st["outputs"] = new_outputs
                    reordered = True

            if reordered:
                changed = True
                steps_reordered += 1

        if changed:
            chains_fixed += 1
            with open(path, "w", encoding="utf-8") as f:
                json.dump(c, f, indent=2, ensure_ascii=False)
                f.write("\n")

    print("Chains fixed: %d" % chains_fixed)
    print("Steps reordered: %d" % steps_reordered)
    print("Total chains scanned: %d" % len(chain_files))


if __name__ == "__main__":
    main()
