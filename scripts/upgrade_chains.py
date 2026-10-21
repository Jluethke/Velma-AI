"""Upgrade old-style FlowFabric chains to the new validated format.

Old-style: {name, description, category, steps: [{skill_name, alias, depends_on, config, phase_filter}]}
New-style: {name, description, steps: [{id, skill_name, inputs, outputs, parallel_group}],
            edges, entry_inputs, terminal_outputs, parallel_groups, estimated_cost, critical_path}

Usage: python upgrade_chains.py [--dry-run]
"""
import json
import os
import sys
from collections import defaultdict

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")


def load_manifest(skill_name):
    mf = os.path.join(MKT, skill_name, "manifest.json")
    if not os.path.exists(mf):
        return None
    try:
        return json.load(open(mf, encoding="utf-8"))
    except (ValueError, OSError):
        return None


def io_names(manifest_list):
    out = []
    for item in (manifest_list or []):
        if isinstance(item, str):
            out.append(item)
        elif isinstance(item, dict) and "name" in item:
            out.append(item["name"])
    return out


def is_old_style(chain):
    if "edges" in chain:
        return False
    steps = chain.get("steps", [])
    return any("depends_on" in s for s in steps)


def compute_parallel_groups(steps, alias_to_id, dep_map):
    groups = []
    assigned = set()
    remaining = list(alias_to_id.keys())

    while remaining:
        batch = []
        for alias in remaining:
            sid = alias_to_id[alias]
            deps = dep_map.get(alias, [])
            dep_ids = {alias_to_id[d] for d in deps if d in alias_to_id}
            if dep_ids.issubset(assigned):
                batch.append(sid)
        if not batch:
            batch = [alias_to_id[remaining[0]]]
        groups.append(batch)
        assigned.update(batch)
        id_to_alias = {v: k for k, v in alias_to_id.items()}
        remaining = [a for a in remaining if alias_to_id[a] not in assigned]

    return groups


def find_critical_path(steps, alias_to_id, dep_map):
    depths = {}

    def depth(alias):
        if alias in depths:
            return depths[alias]
        deps = dep_map.get(alias, [])
        if not deps:
            depths[alias] = 0
            return 0
        d = 1 + max(depth(a) for a in deps if a in alias_to_id)
        depths[alias] = d
        return d

    for alias in alias_to_id:
        depth(alias)

    if not depths:
        return []

    end_alias = max(depths, key=depths.get)
    path = []
    current = end_alias
    while current is not None:
        path.append(alias_to_id[current])
        deps = dep_map.get(current, [])
        if not deps:
            break
        current = max((d for d in deps if d in alias_to_id),
                      key=lambda a: depths.get(a, 0), default=None)
    path.reverse()
    return path


def upgrade_chain(chain):
    old_steps = chain.get("steps", [])
    if len(old_steps) < 1:
        return None, "no steps"

    alias_to_idx = {}
    alias_to_id = {}
    dep_map = {}

    for i, s in enumerate(old_steps):
        alias = s.get("alias", "step_%d" % (i + 1))
        sid = "step_%d" % (i + 1)
        alias_to_idx[alias] = i
        alias_to_id[alias] = sid
        dep_map[alias] = [d for d in s.get("depends_on", []) if d]

    new_steps = []
    edges = []
    all_user_inputs = set()
    all_outputs = set()

    for i, s in enumerate(old_steps):
        alias = s.get("alias", "step_%d" % (i + 1))
        sid = alias_to_id[alias]
        skill = s.get("skill_name", "")
        manifest = load_manifest(skill)

        m_inputs = io_names(manifest.get("inputs")) if manifest else []
        m_outputs = io_names(manifest.get("outputs")) if manifest else []

        deps = [d for d in s.get("depends_on", []) if d and d in alias_to_id]

        inputs = {}
        if m_inputs:
            dep_outputs_avail = {}
            for d in deps:
                d_idx = alias_to_idx[d]
                d_skill = old_steps[d_idx].get("skill_name", "")
                d_manifest = load_manifest(d_skill)
                if d_manifest:
                    for o in io_names(d_manifest.get("outputs")):
                        dep_outputs_avail[o] = alias_to_id[d]

            for inp in m_inputs:
                if inp in dep_outputs_avail:
                    inputs[inp] = "%s.%s" % (dep_outputs_avail[inp], inp)
                elif deps:
                    dep_sid = alias_to_id[deps[0]]
                    d_idx = alias_to_idx[deps[0]]
                    d_skill = old_steps[d_idx].get("skill_name", "")
                    d_manifest = load_manifest(d_skill)
                    d_outs = io_names(d_manifest.get("outputs")) if d_manifest else []
                    if d_outs:
                        inputs[inp] = "%s.%s" % (dep_sid, d_outs[0])
                    else:
                        inputs[inp] = "%s.result" % dep_sid
                else:
                    inputs[inp] = "from_user_input"
                    all_user_inputs.add(inp)
        else:
            if not deps:
                inputs["input"] = "from_user_input"
                all_user_inputs.add("input")
            else:
                dep_sid = alias_to_id[deps[0]]
                inputs["input"] = "%s.result" % dep_sid

        outputs = {}
        if m_outputs:
            for o in m_outputs:
                outputs[o] = o + "_data"
                all_outputs.add(o)
        else:
            outputs["result"] = "result_data"
            all_outputs.add("result")

        step = {
            "id": sid,
            "skill_name": skill,
            "inputs": inputs,
            "outputs": outputs,
            "parallel_group": 0
        }
        new_steps.append(step)

        for d in deps:
            d_sid = alias_to_id[d]
            d_idx = alias_to_idx[d]
            d_skill = old_steps[d_idx].get("skill_name", "")
            d_manifest = load_manifest(d_skill)
            d_outs = io_names(d_manifest.get("outputs")) if d_manifest else []

            mapped_fields = []
            for inp_key, inp_src in inputs.items():
                if inp_src.startswith(d_sid + "."):
                    field = inp_src.split(".", 1)[1]
                    mapped_fields.append("%s -> %s" % (field, inp_key))

            if not mapped_fields:
                if d_outs:
                    mapped_fields = ["%s -> input" % d_outs[0]]
                else:
                    mapped_fields = ["result -> input"]

            edge = {
                "from_step": d_sid,
                "to_step": sid,
                "data_type": mapped_fields[0].split(" -> ")[0] if mapped_fields else "result",
                "field_mapping": "; ".join(mapped_fields)
            }
            edges.append(edge)

    pgroups = compute_parallel_groups(old_steps, alias_to_id, dep_map)
    for gi, group in enumerate(pgroups):
        for sid in group:
            for st in new_steps:
                if st["id"] == sid:
                    st["parallel_group"] = gi + 1

    cpath = find_critical_path(old_steps, alias_to_id, dep_map)

    no_deps = []
    for i, s in enumerate(old_steps):
        alias = s.get("alias", "step_%d" % (i + 1))
        if not dep_map.get(alias):
            no_deps.append(alias_to_id[alias])
    depended_on = set()
    for deps in dep_map.values():
        for d in deps:
            if d in alias_to_id:
                depended_on.add(alias_to_id[d])
    terminal_ids = [st["id"] for st in new_steps if st["id"] not in depended_on]
    terminal_outs = []
    for st in new_steps:
        if st["id"] in terminal_ids:
            terminal_outs.extend(st["outputs"].keys())

    entry_inputs_list = sorted(all_user_inputs)

    result = {
        "name": chain.get("name", ""),
        "description": chain.get("description", ""),
        "steps": new_steps,
        "edges": edges,
        "entry_inputs": entry_inputs_list,
        "terminal_outputs": terminal_outs,
        "parallel_groups": pgroups,
        "estimated_cost": 0,
        "critical_path": cpath
    }
    return result, None


def main():
    dry_run = "--dry-run" in sys.argv
    upgraded = 0
    failed = 0
    failures = []
    skipped = 0

    for fname in sorted(os.listdir(CHAINS)):
        if not fname.endswith(".chain.json"):
            continue
        path = os.path.join(CHAINS, fname)
        try:
            chain = json.load(open(path, encoding="utf-8"))
        except (ValueError, OSError) as e:
            failures.append((fname, "bad JSON: %s" % e))
            failed += 1
            continue

        if not is_old_style(chain):
            skipped += 1
            continue

        result, err = upgrade_chain(chain)
        if err:
            failures.append((fname, err))
            failed += 1
            continue

        if not dry_run:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
                f.write("\n")
        upgraded += 1

    print("Upgraded: %d" % upgraded)
    print("Skipped (already new-style): %d" % skipped)
    print("Failed: %d" % failed)
    if failures:
        print("\nFailures:")
        for fname, reason in failures:
            print("  %s: %s" % (fname, reason))
    if dry_run:
        print("\n(dry run, no files written)")


if __name__ == "__main__":
    main()
