"""Regenerate chain step inputs/outputs dicts from manifest lists.

Fixes the case where step I/O keys are a DIFFERENT SET from the manifest,
not just reordered. Rebuilds the dicts using manifest as source of truth,
preserving existing values where keys match.
"""
import json
import os
import sys
from collections import OrderedDict

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")


def io_names(lst):
    """Extract names from a manifest inputs/outputs list (strings or dicts)."""
    out = []
    for item in (lst or []):
        if isinstance(item, str):
            out.append(item)
        elif isinstance(item, dict) and "name" in item:
            out.append(item["name"])
        else:
            out.append(str(item))
    return out


def io_type(item):
    """Best-effort type from a manifest entry."""
    if isinstance(item, dict):
        return item.get("type", "object")
    return "object"


def io_type_map(lst):
    """name -> type from manifest list."""
    out = {}
    for item in (lst or []):
        if isinstance(item, str):
            out[item] = "object"
        elif isinstance(item, dict) and "name" in item:
            out[item["name"]] = item.get("type", "object")
    return out


def load_manifest(skill_name):
    mf = os.path.join(MKT, skill_name, "manifest.json")
    if not os.path.isfile(mf):
        return None
    try:
        return json.load(open(mf, encoding="utf-8"))
    except Exception:
        return None


def rebuild_inputs(step, manifest_inputs, all_step_ids, step_index):
    """Rebuild step inputs dict from manifest input names."""
    names = io_names(manifest_inputs)
    old = step.get("inputs", {})
    if not isinstance(old, dict):
        old = {}
    new = OrderedDict()
    for name in names:
        if name in old:
            new[name] = old[name]
        else:
            new[name] = "from_context.%s" % name
    return new


def rebuild_outputs(step, manifest_outputs):
    """Rebuild step outputs dict from manifest output names."""
    names = io_names(manifest_outputs)
    types = io_type_map(manifest_outputs)
    old = step.get("outputs", {})
    if not isinstance(old, dict):
        old = {}
    new = OrderedDict()
    for name in names:
        if name in old:
            new[name] = old[name]
        else:
            new[name] = types.get(name, "object")
    return new


def fix_edges(chain, removed_fields):
    """Remove edges that reference fields no longer in any step."""
    if "edges" not in chain or not removed_fields:
        return
    kept = []
    for edge in chain["edges"]:
        fm = edge.get("field_mapping")
        if isinstance(fm, dict):
            for src, dst in list(fm.items()):
                if src in removed_fields or dst in removed_fields:
                    del fm[src]
        kept.append(edge)
    chain["edges"] = kept


def main():
    chains_fixed = 0
    steps_regen = 0

    for fn in sorted(os.listdir(CHAINS)):
        if not fn.endswith(".chain.json"):
            continue
        path = os.path.join(CHAINS, fn)
        try:
            chain = json.load(open(path, encoding="utf-8"))
        except Exception:
            continue

        steps = chain.get("steps", [])
        step_ids = [s.get("id", "step_%d" % i) for i, s in enumerate(steps)]
        changed = False
        removed = set()

        for idx, st in enumerate(steps):
            sn = st.get("skill_name", "")
            m = load_manifest(sn)
            if m is None:
                continue

            m_in = io_names(m.get("inputs", []))
            m_out = io_names(m.get("outputs", []))

            cur_in = list(st.get("inputs", {}).keys()) if isinstance(st.get("inputs"), dict) else []
            cur_out = list(st.get("outputs", {}).keys()) if isinstance(st.get("outputs"), dict) else []

            if cur_in == m_in and cur_out == m_out:
                continue

            old_in_keys = set(cur_in)
            old_out_keys = set(cur_out)

            new_inputs = rebuild_inputs(st, m.get("inputs", []), step_ids, idx)
            new_outputs = rebuild_outputs(st, m.get("outputs", []))

            removed |= (old_in_keys - set(new_inputs.keys()))
            removed |= (old_out_keys - set(new_outputs.keys()))

            st["inputs"] = dict(new_inputs)
            st["outputs"] = dict(new_outputs)
            changed = True
            steps_regen += 1

        if changed:
            fix_edges(chain, removed)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(chain, f, indent=2, ensure_ascii=False)
                f.write("\n")
            chains_fixed += 1

    print("Chains fixed: %d" % chains_fixed)
    print("Steps regenerated: %d" % steps_regen)


if __name__ == "__main__":
    main()
