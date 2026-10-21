"""Restore chains to pre-merge state using chain_index.json as source of truth.

1. Rebuild any chain from chain_index.json that is missing on disk
2. Rebuild any chain that was a merge target AND source (overwritten)
3. Delete any chain on disk that is NOT in chain_index.json (newly created by merge)
"""
import json
import os
import sys

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")
INDEX = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\chain_index.json"
SPECS = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\merge_specs_final.json"


def build_chain_from_index(name, info):
    skills = info["skills"]
    desc = info["desc"]

    steps = []
    edges = []
    parallel_groups = []
    prev_id = None

    for i, skill_name in enumerate(skills):
        step_id = "step_" + str(i + 1)
        mf_path = os.path.join(MKT, skill_name, "manifest.json")
        if not os.path.isfile(mf_path):
            m_inputs = []
            m_outputs = []
        else:
            m = json.load(open(mf_path, encoding="utf-8"))
            m_inputs = []
            for x in m.get("inputs", []):
                if isinstance(x, str):
                    m_inputs.append(x)
                elif isinstance(x, dict):
                    m_inputs.append(x.get("name", ""))
            m_outputs = []
            for x in m.get("outputs", []):
                if isinstance(x, str):
                    m_outputs.append(x)
                elif isinstance(x, dict):
                    m_outputs.append(x.get("name", ""))

        step_inputs = {}
        for inp in m_inputs:
            if i == 0:
                step_inputs[inp] = "from_user_input"
            elif prev_id:
                found = False
                for ps in reversed(steps):
                    if inp in ps.get("outputs", {}):
                        step_inputs[inp] = ps["id"] + "." + inp
                        found = True
                        break
                if not found:
                    step_inputs[inp] = "from_context." + inp
            else:
                step_inputs[inp] = "from_context." + inp

        step_outputs = {o: o for o in m_outputs}
        step = {
            "id": step_id,
            "skill_name": skill_name,
            "inputs": step_inputs,
            "outputs": step_outputs,
            "parallel_group": i + 1,
        }
        steps.append(step)
        if prev_id:
            edges.append({
                "from_step": prev_id,
                "to_step": step_id,
                "data_type": "object",
                "field_mapping": {},
            })
        parallel_groups.append([step_id])
        prev_id = step_id

    entry_inputs = []
    if steps:
        for k, v in steps[0].get("inputs", {}).items():
            if v in ("from_user_input", "from_user_input_optional"):
                entry_inputs.append(k)

    terminal_outputs = list(steps[-1].get("outputs", {}).keys()) if steps else []

    chain = {
        "name": name,
        "description": desc,
        "steps": steps,
        "edges": edges,
        "entry_inputs": entry_inputs,
        "terminal_outputs": terminal_outputs,
        "parallel_groups": parallel_groups,
        "estimated_cost": "low",
        "critical_path": [s["id"] for s in steps],
        "chain_links": {
            "prerequisites": [],
            "next_chains": [],
            "related_chains": [],
        },
    }
    return chain


def main():
    index = json.load(open(INDEX, encoding="utf-8"))
    specs = json.load(open(SPECS, encoding="utf-8"))

    # Figure out which chains were affected
    overwritten_targets = set()
    all_sources = set()
    for spec in specs:
        for src in spec["source_chains"]:
            all_sources.add(src)
            if src == spec["target_name"]:
                overwritten_targets.add(src)

    new_targets = set()
    for spec in specs:
        if spec["target_name"] not in all_sources or spec["target_name"] in overwritten_targets:
            if spec["target_name"] not in index:
                new_targets.add(spec["target_name"])

    # 1. Delete chains that don't exist in the index (newly created by merge)
    deleted_new = 0
    for f in os.listdir(CHAINS):
        if not f.endswith(".chain.json"):
            continue
        name = f[:-len(".chain.json")]
        if name not in index:
            os.remove(os.path.join(CHAINS, f))
            print("Deleted new chain: " + name)
            deleted_new += 1

    # 2. Rebuild missing chains (deleted sources)
    rebuilt = 0
    for name, info in index.items():
        path = os.path.join(CHAINS, name + ".chain.json")
        if not os.path.isfile(path):
            chain = build_chain_from_index(name, info)
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(chain, fh, indent=2, ensure_ascii=False)
                fh.write("\n")
            print("Rebuilt missing: " + name)
            rebuilt += 1

    # 3. Restore overwritten targets to original state
    restored = 0
    for name in overwritten_targets:
        if name in index:
            chain = build_chain_from_index(name, index[name])
            path = os.path.join(CHAINS, name + ".chain.json")
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(chain, fh, indent=2, ensure_ascii=False)
                fh.write("\n")
            print("Restored overwritten: " + name)
            restored += 1

    # Count final
    final_count = len([f for f in os.listdir(CHAINS) if f.endswith(".chain.json")])
    print("")
    print("Deleted new: " + str(deleted_new))
    print("Rebuilt missing: " + str(rebuilt))
    print("Restored overwritten: " + str(restored))
    print("Final chain count: " + str(final_count))


if __name__ == "__main__":
    main()
