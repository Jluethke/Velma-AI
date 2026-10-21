"""Add steps to thin chains (<4 steps) by finding related flows in the marketplace.

Usage: python beef_up_chains.py <start_index> <end_index>
Reads thin_chains.txt for the chain name list.
"""
import json
import os
import re
import sys

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")
MIN_TARGET = 5

start_idx = int(sys.argv[1])
end_idx = int(sys.argv[2])

thin = open(os.path.join(os.path.dirname(MKT), "thin_chains.txt")).read().strip().split("\n")
batch = thin[start_idx:end_idx]

# Build flow index: domain -> list of (flow_name, manifest)
flow_index = {}
all_flows = {}
for d in os.listdir(MKT):
    mf = os.path.join(MKT, d, "manifest.json")
    if not os.path.isfile(mf):
        continue
    try:
        m = json.load(open(mf, encoding="utf-8"))
    except Exception:
        continue
    all_flows[d] = m
    domain = m.get("domain", "general")
    flow_index.setdefault(domain, []).append(d)

# Build keyword index for finding related flows
def flow_keywords(name, manifest):
    words = set(name.replace("-", " ").split())
    words.update(t.lower() for t in manifest.get("tags", []))
    desc = manifest.get("description", "").lower()
    words.update(w for w in desc.split() if len(w) > 3)
    return words

keyword_index = {}
for name, m in all_flows.items():
    for kw in flow_keywords(name, m):
        keyword_index.setdefault(kw, set()).add(name)


def io_names(lst):
    result = []
    for x in (lst or []):
        if isinstance(x, str):
            result.append(x)
        elif isinstance(x, dict):
            result.append(x.get("name", str(x)))
    return result


def find_related_flows(chain_name, existing_skills, domain):
    """Find flows related to a chain that aren't already in it."""
    existing = set(existing_skills)

    # Strategy 1: same domain
    candidates = set()
    for f in flow_index.get(domain, []):
        if f not in existing:
            candidates.add(f)

    # Strategy 2: keyword overlap with chain name
    chain_words = set(chain_name.replace("-", " ").replace("chain", "").split())
    chain_words.discard("")
    for word in chain_words:
        for f in keyword_index.get(word.lower(), set()):
            if f not in existing:
                candidates.add(f)

    # Strategy 3: keyword overlap with existing flow tags/descriptions
    for sk in existing_skills:
        if sk in all_flows:
            for kw in flow_keywords(sk, all_flows[sk]):
                if len(kw) > 4:
                    for f in keyword_index.get(kw, set()):
                        if f not in existing:
                            candidates.add(f)

    # Score candidates by relevance
    scored = []
    for c in candidates:
        if c not in all_flows:
            continue
        m = all_flows[c]
        score = 0
        c_words = set(c.replace("-", " ").split())
        score += len(chain_words & c_words) * 3
        c_tags = set(t.lower() for t in m.get("tags", []))
        for sk in existing_skills:
            if sk in all_flows:
                sk_tags = set(t.lower() for t in all_flows[sk].get("tags", []))
                score += len(c_tags & sk_tags)
        if m.get("domain") == domain:
            score += 2
        scored.append((score, c))

    scored.sort(key=lambda x: -x[0])
    return [name for _, name in scored]


def make_step(step_id, skill_name, prev_step_id, parallel_group):
    """Create a new chain step from a marketplace flow."""
    m = all_flows.get(skill_name, {})
    inputs_list = io_names(m.get("inputs", []))
    outputs_list = io_names(m.get("outputs", []))

    inputs = {}
    for inp in inputs_list:
        if prev_step_id:
            inputs[inp] = prev_step_id + "." + inp
        else:
            inputs[inp] = "from_context." + inp

    outputs = {}
    for out in outputs_list:
        outputs[out] = out

    return {
        "id": step_id,
        "skill_name": skill_name,
        "inputs": inputs,
        "outputs": outputs,
        "parallel_group": parallel_group,
    }


def wire_inputs(step, prev_step, all_steps_map):
    """Wire a step's inputs to the best available source."""
    if prev_step is None:
        return
    prev_outputs = set(prev_step.get("outputs", {}).keys())
    for inp_name in list(step.get("inputs", {}).keys()):
        # Try to find a matching output from previous steps
        if inp_name in prev_outputs:
            step["inputs"][inp_name] = prev_step["id"] + "." + inp_name
        else:
            # Check all prior steps for this output
            found = False
            for sid, st in all_steps_map.items():
                if sid == step["id"]:
                    break
                if inp_name in st.get("outputs", {}):
                    step["inputs"][inp_name] = sid + "." + inp_name
                    found = True
                    break
            if not found:
                step["inputs"][inp_name] = "from_context." + inp_name


fixed = 0
for chain_name in batch:
    path = os.path.join(CHAINS, chain_name + ".chain.json")
    if not os.path.isfile(path):
        continue
    c = json.load(open(path, encoding="utf-8"))
    steps = c.get("steps", [])
    if len(steps) >= 4:
        continue

    existing_skills = [s.get("skill_name", "") for s in steps]
    # Determine domain from first step
    domain = "general"
    if existing_skills and existing_skills[0] in all_flows:
        domain = all_flows[existing_skills[0]].get("domain", "general")

    related = find_related_flows(chain_name, existing_skills, domain)
    needed = MIN_TARGET - len(steps)
    if needed <= 0 or not related:
        continue

    to_add = related[:needed]
    last_step = steps[-1] if steps else None
    max_pg = max((s.get("parallel_group", 0) for s in steps), default=0)

    step_map = {s["id"]: s for s in steps}
    new_step_num = len(steps) + 1

    for skill in to_add:
        if skill not in all_flows:
            continue
        step_id = "step_" + str(new_step_num)
        pg = max_pg + 1
        max_pg = pg
        new_step = make_step(step_id, skill, last_step["id"] if last_step else None, pg)
        wire_inputs(new_step, last_step, step_map)
        steps.append(new_step)
        step_map[step_id] = new_step
        last_step = new_step
        new_step_num += 1

    c["steps"] = steps

    # Update edges for new steps
    edges = c.get("edges", [])
    existing_edge_pairs = {(e.get("from_step"), e.get("to_step")) for e in edges}
    for i in range(len(steps) - 1):
        pair = (steps[i]["id"], steps[i + 1]["id"])
        if pair not in existing_edge_pairs:
            edges.append({
                "from_step": pair[0],
                "to_step": pair[1],
                "data_type": "object",
                "field_mapping": {},
            })
    c["edges"] = edges

    # Update parallel_groups
    pg_map = {}
    for s in steps:
        pg = s.get("parallel_group", 0)
        pg_map.setdefault(pg, []).append(s["id"])
    c["parallel_groups"] = [ids for _, ids in sorted(pg_map.items())]

    # Update terminal_outputs from last step
    if steps:
        c["terminal_outputs"] = list(steps[-1].get("outputs", {}).keys())

    # Update entry_inputs
    user_ins = set()
    for st in steps:
        for k, v in st.get("inputs", {}).items():
            if isinstance(v, str) and v in ("from_user_input", "from_user_input_optional"):
                user_ins.add(k)
    if user_ins:
        c["entry_inputs"] = sorted(user_ins)

    # Update critical_path
    c["critical_path"] = [s["id"] for s in steps]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(c, f, indent=2, ensure_ascii=False)
        f.write("\n")
    fixed += 1

print("Beefed up: " + str(fixed) + " chains (batch " + str(start_idx) + "-" + str(end_idx) + ")")
