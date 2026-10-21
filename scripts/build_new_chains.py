"""Build new chains from specs. Each spec defines chain name, description, domain,
and a list of steps. For each step, creates the flow dir (skill.md + manifest.json)
and wires the chain.json.

Usage: python build_new_chains.py <specs_json_file>
"""
import json
import os
import sys

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")
FOOTER = "Copyright 2024-present The Wayfinder Trust. All rights reserved."
BT = "`"


def build_skill_md(name, description, inputs, outputs, process_steps):
    title = name.replace("-", " ").title()
    lines = ["# " + title, "", description, "", "## Inputs", ""]
    for inp in inputs:
        lines.append("- " + BT + inp["name"] + BT + ": " + inp.get("desc", ""))
    lines += ["", "## Outputs", ""]
    for out in outputs:
        lines.append("- " + BT + out["name"] + BT + ": " + out.get("desc", ""))
    lines += ["", "## Process", ""]
    for i, step in enumerate(process_steps, 1):
        lines.append(str(i) + ". " + step)
    lines += ["", "---", "", FOOTER, ""]
    return "\n".join(lines)


def build_manifest(name, description, domain, tags, inputs, outputs, ep="linear"):
    return {
        "name": name,
        "description": description,
        "version": "1.0.0",
        "license": "OPEN",
        "price": "0",
        "domain": domain,
        "tags": tags,
        "execution_pattern": ep,
        "inputs": [i["name"] for i in inputs],
        "outputs": [o["name"] for o in outputs],
    }


def build_chain(spec):
    chain_name = spec["chain_name"]
    chain_desc = spec["description"]
    domain = spec["domain"]
    steps_spec = spec["steps"]

    chain_steps = []
    all_edges = []
    all_pg = []
    prev_id = None

    for i, st in enumerate(steps_spec):
        flow_name = st["flow_name"]
        step_id = "step_" + str(i + 1)

        # Create flow directory
        flow_dir = os.path.join(MKT, flow_name)
        if not os.path.exists(flow_dir):
            os.makedirs(flow_dir, exist_ok=True)

            inputs = st.get("inputs", [])
            outputs = st.get("outputs", [])
            process = st.get("process", [])
            tags = st.get("tags", spec.get("tags", []))

            skill = build_skill_md(flow_name, st["description"], inputs, outputs, process)
            with open(os.path.join(flow_dir, "skill.md"), "w", encoding="utf-8") as f:
                f.write(skill)

            manifest = build_manifest(flow_name, st["description"], domain, tags, inputs, outputs)
            with open(os.path.join(flow_dir, "manifest.json"), "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
                f.write("\n")

        # Load manifest for I/O
        mf_path = os.path.join(flow_dir, "manifest.json")
        m = json.load(open(mf_path, encoding="utf-8"))
        m_inputs = m.get("inputs", [])
        m_outputs = m.get("outputs", [])

        # Build step
        step_inputs = {}
        for inp in m_inputs:
            if i == 0:
                step_inputs[inp] = "from_user_input"
            elif prev_id:
                prev_step = chain_steps[-1] if chain_steps else None
                prev_outs = set(prev_step.get("outputs", {}).keys()) if prev_step else set()
                if inp in prev_outs:
                    step_inputs[inp] = prev_id + "." + inp
                else:
                    found = False
                    for cs in reversed(chain_steps):
                        if inp in cs.get("outputs", {}):
                            step_inputs[inp] = cs["id"] + "." + inp
                            found = True
                            break
                    if not found:
                        step_inputs[inp] = "from_context." + inp
            else:
                step_inputs[inp] = "from_context." + inp

        step_outputs = {o: o for o in m_outputs}

        chain_step = {
            "id": step_id,
            "skill_name": flow_name,
            "inputs": step_inputs,
            "outputs": step_outputs,
            "parallel_group": i + 1,
        }
        chain_steps.append(chain_step)

        if prev_id:
            all_edges.append({
                "from_step": prev_id,
                "to_step": step_id,
                "data_type": "object",
                "field_mapping": {},
            })

        all_pg.append([step_id])
        prev_id = step_id

    # Entry inputs from first step
    entry_inputs = []
    if chain_steps:
        for k, v in chain_steps[0].get("inputs", {}).items():
            if v in ("from_user_input", "from_user_input_optional"):
                entry_inputs.append(k)

    # Terminal outputs from last step
    terminal_outputs = list(chain_steps[-1].get("outputs", {}).keys()) if chain_steps else []

    chain = {
        "name": chain_name,
        "description": chain_desc,
        "steps": chain_steps,
        "edges": all_edges,
        "entry_inputs": entry_inputs,
        "terminal_outputs": terminal_outputs,
        "parallel_groups": all_pg,
        "estimated_cost": "low",
        "critical_path": [s["id"] for s in chain_steps],
        "chain_links": {
            "prerequisites": [],
            "next_chains": [],
            "related_chains": [],
        },
    }

    chain_path = os.path.join(CHAINS, chain_name + ".chain.json")
    with open(chain_path, "w", encoding="utf-8") as f:
        json.dump(chain, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return len(chain_steps)


def main():
    specs_file = sys.argv[1]
    specs = json.load(open(specs_file, encoding="utf-8"))
    total_steps = 0
    for spec in specs:
        n = build_chain(spec)
        total_steps += n
        print("Built " + spec["chain_name"] + " (" + str(n) + " steps)")
    print("Total: " + str(len(specs)) + " chains, " + str(total_steps) + " steps")


if __name__ == "__main__":
    main()
