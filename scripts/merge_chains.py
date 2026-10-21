"""Merge overlapping chains. Takes a JSON file of merge specs.
Each spec: {target_name, target_desc, source_chains: [name1, name2, ...], delete_sources: bool}

The merged chain takes the union of all unique skills from all sources,
ordered by first appearance across sources (first source's order preserved,
then new skills from subsequent sources appended).
"""
import json
import os
import sys

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")


def load_chain(name):
    path = os.path.join(CHAINS, name + ".chain.json")
    if not os.path.isfile(path):
        return None
    return json.load(open(path, encoding="utf-8"))


def merge(spec):
    target_name = spec["target_name"]
    target_desc = spec["target_desc"]
    sources = spec["source_chains"]
    delete_sources = spec.get("delete_sources", True)

    # Collect all unique skills in order
    seen_skills = set()
    ordered_skills = []
    all_chains = []

    for src_name in sources:
        c = load_chain(src_name)
        if c is None:
            print("  WARN: " + src_name + " not found, skipping")
            continue
        all_chains.append((src_name, c))
        for step in c.get("steps", []):
            sk = step.get("skill_name", "")
            if sk and sk not in seen_skills:
                seen_skills.add(sk)
                ordered_skills.append(sk)

    if not ordered_skills:
        print("  ERROR: no skills found for " + target_name)
        return False

    # Build merged chain
    steps = []
    edges = []
    parallel_groups = []
    prev_id = None

    for i, skill_name in enumerate(ordered_skills):
        step_id = "step_" + str(i + 1)

        # Load manifest for I/O
        mf_path = os.path.join(MKT, skill_name, "manifest.json")
        if not os.path.isfile(mf_path):
            print("  WARN: no manifest for " + skill_name + ", using empty I/O")
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

        # Wire inputs
        step_inputs = {}
        for inp in m_inputs:
            if i == 0:
                step_inputs[inp] = "from_user_input"
            elif prev_id:
                # Check previous steps for matching output
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

    # Entry inputs from first step
    entry_inputs = []
    if steps:
        for k, v in steps[0].get("inputs", {}).items():
            if v in ("from_user_input", "from_user_input_optional"):
                entry_inputs.append(k)

    # Terminal outputs from last step
    terminal_outputs = list(steps[-1].get("outputs", {}).keys()) if steps else []

    chain = {
        "name": target_name,
        "description": target_desc,
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

    chain_path = os.path.join(CHAINS, target_name + ".chain.json")
    with open(chain_path, "w", encoding="utf-8") as f:
        json.dump(chain, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # Delete source chains (if different from target)
    if delete_sources:
        for src_name in sources:
            if src_name != target_name:
                src_path = os.path.join(CHAINS, src_name + ".chain.json")
                if os.path.isfile(src_path):
                    os.remove(src_path)
                    print("  Deleted " + src_name)

    print("  Merged " + target_name + " (" + str(len(steps)) + " steps from " + str(len(sources)) + " sources)")
    return True


def main():
    specs_file = sys.argv[1]
    specs = json.load(open(specs_file, encoding="utf-8"))
    ok = 0
    for spec in specs:
        print("Merging: " + spec["target_name"])
        if merge(spec):
            ok += 1
    print("Done: " + str(ok) + "/" + str(len(specs)) + " merges")


if __name__ == "__main__":
    main()
