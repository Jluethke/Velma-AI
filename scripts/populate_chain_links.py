"""Populate cross-chain links and related_flows across the FlowFabric marketplace.

Reads all new-style chains, matches terminal_outputs to entry_inputs across
chains, applies domain adjacency heuristics, and writes chain_links into each
chain.json and related_flows into each manifest.json.

Usage: python -I populate_chain_links.py [--dry-run]
"""
import json
import os
import sys
from collections import defaultdict

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS_DIR = os.path.join(MKT, "chains")

DOMAIN_ADJACENCY = {
    "career":    ["finance", "learning", "business", "life", "professional-services"],
    "finance":   ["career", "business", "real-estate", "life", "money"],
    "business":  ["marketing", "finance", "career", "legal", "data"],
    "marketing": ["business", "media", "data", "creative", "ai"],
    "health":    ["life", "sports", "food", "wellness"],
    "life":      ["health", "career", "finance", "family", "home"],
    "learning":  ["career", "education", "ai", "technology"],
    "legal":     ["business", "finance", "real-estate", "government"],
    "real-estate": ["finance", "legal", "construction"],
    "data":      ["engineering", "ai", "business", "analytics"],
    "ai":        ["engineering", "data", "technology", "learning"],
    "engineering": ["data", "ai", "technology", "automation"],
    "hospitality": ["business", "marketing", "life"],
    "technology": ["engineering", "ai", "data", "learning"],
    "nonprofit": ["business", "government", "social-services"],
    "government": ["legal", "nonprofit", "business"],
    "automotive": ["engineering", "manufacturing"],
    "education": ["learning", "career", "life"],
    "manufacturing": ["engineering", "logistics", "automotive"],
    "logistics": ["business", "manufacturing", "retail"],
    "retail":    ["business", "marketing", "logistics"],
    "energy":    ["engineering", "manufacturing", "government"],
    "agriculture": ["engineering", "business"],
    "pharma":    ["health", "legal", "manufacturing"],
    "sports":    ["health", "life", "media"],
    "media":     ["marketing", "creative", "business"],
    "creative":  ["media", "marketing", "learning"],
    # Chain-level categories (not manifest domains)
    "money":     ["finance", "career", "business", "life"],
    "founder":   ["business", "finance", "marketing", "career"],
    "developer": ["engineering", "data", "ai", "technology"],
    "marketer":  ["marketing", "business", "media", "creative"],
    "analyst":   ["data", "business", "finance"],
    "onboarding": ["career", "business", "life"],
    "family":    ["life", "health", "finance"],
    "home":      ["life", "real-estate", "finance"],
    "strategy":  ["business", "finance", "marketing"],
    "fabric":    ["engineering", "meta", "ai"],
    "meta":      ["engineering", "fabric", "ai"],
    "cross-role": ["career", "business", "life"],
}

VALID_RELATIONSHIPS = ["feeds_into", "fed_by", "alternative", "complement"]


def extract_field_name(item):
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return item.get("name") or item.get("output_name") or item.get("input_name") or ""
    return ""


def safe_field_list(lst):
    if not isinstance(lst, list):
        return []
    return [n for n in (extract_field_name(x) for x in lst) if n]


def load_all_chains():
    chains = {}
    for f in os.listdir(CHAINS_DIR):
        if not f.endswith(".chain.json"):
            continue
        p = os.path.join(CHAINS_DIR, f)
        try:
            c = json.load(open(p, encoding="utf-8"))
        except (ValueError, OSError):
            continue
        name = c.get("name", f.replace(".chain.json", ""))
        chains[name] = c
    return chains


def is_new_style(c):
    return "edges" in c and "entry_inputs" in c and "terminal_outputs" in c


def get_category(c):
    return c.get("category", "none")


def get_skills_in_chain(c):
    skills = []
    for st in c.get("steps", []):
        sn = st.get("skill_name", "")
        if sn:
            skills.append(sn)
    return skills


def domains_adjacent(cat_a, cat_b):
    if cat_a == cat_b and cat_a != "none":
        return True
    adj_a = DOMAIN_ADJACENCY.get(cat_a, [])
    adj_b = DOMAIN_ADJACENCY.get(cat_b, [])
    return cat_b in adj_a or cat_a in adj_b


def field_overlap(outputs_a, inputs_b):
    if not outputs_a or not inputs_b:
        return []
    out_set = set(outputs_a) if isinstance(outputs_a, list) else set()
    in_set = set(inputs_b) if isinstance(inputs_b, list) else set()
    direct = out_set & in_set
    fuzzy = set()
    for o in out_set:
        for i in in_set:
            o_parts = set(o.lower().replace("-", "_").split("_"))
            i_parts = set(i.lower().replace("-", "_").split("_"))
            shared = o_parts & i_parts - {"the", "a", "an", "of", "for", "and", "or"}
            if len(shared) >= 1 and (o, i) not in {(x, x) for x in direct}:
                fuzzy.add((o, i))
    return list(direct), list(fuzzy)


def load_all_manifests():
    manifests = {}
    for d in os.listdir(MKT):
        mf = os.path.join(MKT, d, "manifest.json")
        if os.path.isfile(mf):
            try:
                manifests[d] = json.load(open(mf, encoding="utf-8"))
            except (ValueError, OSError):
                continue
    return manifests


def build_skill_cooccurrence(chains):
    cooccur = defaultdict(lambda: defaultdict(int))
    for cname, c in chains.items():
        skills = get_skills_in_chain(c)
        for i, s1 in enumerate(skills):
            for s2 in skills[i+1:]:
                cooccur[s1][s2] += 1
                cooccur[s2][s1] += 1
    return cooccur


def main():
    dry_run = "--dry-run" in sys.argv

    chains = load_all_chains()
    manifests = load_all_manifests()
    print("Loaded %d chains, %d manifests" % (len(chains), len(manifests)))

    new_chains = {n: c for n, c in chains.items() if is_new_style(c)}
    old_chains = {n: c for n, c in chains.items() if not is_new_style(c)}
    print("New-style: %d, Old-style: %d" % (len(new_chains), len(old_chains)))

    # Build output->chain and input->chain indexes for new-style chains
    output_index = defaultdict(list)  # field_name -> [chain_name, ...]
    input_index = defaultdict(list)
    for cname, c in new_chains.items():
        for out in safe_field_list(c.get("terminal_outputs", [])):
            output_index[out].append(cname)
        for inp in safe_field_list(c.get("entry_inputs", [])):
            input_index[inp].append(cname)

    # Also index old-style chains by their skill outputs/inputs
    for cname, c in old_chains.items():
        cat = get_category(c)
        skills = get_skills_in_chain(c)
        chain_outputs = set()
        chain_inputs = set()
        for sn in skills:
            if sn in manifests:
                m = manifests[sn]
                for o in safe_field_list(m.get("outputs", [])):
                    chain_outputs.add(o)
                for i in safe_field_list(m.get("inputs", [])):
                    chain_inputs.add(i)
        for out in chain_outputs:
            output_index[out].append(cname)
        for inp in chain_inputs:
            input_index[inp].append(cname)

    # Match chains: A's terminal_outputs overlap with B's entry_inputs
    chain_links_count = 0
    chain_links_map = defaultdict(lambda: {"prerequisites": [], "next_chains": [], "related_chains": []})

    all_chain_names = set(chains.keys())

    for cname_a, chain_a in chains.items():
        cat_a = get_category(chain_a)

        # Get outputs of chain A
        if is_new_style(chain_a):
            outputs_a = safe_field_list(chain_a.get("terminal_outputs", []))
        else:
            skills_a = get_skills_in_chain(chain_a)
            outputs_a = []
            for sn in skills_a:
                if sn in manifests:
                    outputs_a.extend(safe_field_list(manifests[sn].get("outputs", [])))

        if not outputs_a:
            continue

        # Find chains whose inputs overlap with A's outputs
        candidate_targets = set()
        for out_field in outputs_a:
            for target_chain in input_index.get(out_field, []):
                if target_chain != cname_a:
                    candidate_targets.add(target_chain)

        # Fuzzy match: require at least 2 meaningful shared word parts
        STOP_WORDS = {"the", "a", "an", "of", "for", "and", "or", "to", "in",
                      "is", "on", "by", "from", "with", "new", "current", "final",
                      "list", "data", "input", "output", "result", "report", "plan",
                      "analysis", "summary", "review", "notes", "status", "info"}
        for out_field in outputs_a:
            out_parts = set(out_field.lower().replace("-", "_").split("_")) - STOP_WORDS
            if len(out_parts) < 2:
                continue
            for inp_field, inp_chains in input_index.items():
                inp_parts = set(inp_field.lower().replace("-", "_").split("_")) - STOP_WORDS
                if len(out_parts & inp_parts) >= 2:
                    for tc in inp_chains:
                        if tc != cname_a:
                            candidate_targets.add(tc)

        for cname_b in candidate_targets:
            chain_b = chains[cname_b]
            cat_b = get_category(chain_b)

            # Get inputs of chain B
            if is_new_style(chain_b):
                inputs_b = safe_field_list(chain_b.get("entry_inputs", []))
            else:
                skills_b = get_skills_in_chain(chain_b)
                inputs_b = []
                for sn in skills_b:
                    if sn in manifests:
                        inputs_b.extend(safe_field_list(manifests[sn].get("inputs", [])))

            direct, fuzzy = field_overlap(outputs_a, inputs_b)
            overlapping = list(direct) + [p[0] for p in fuzzy]
            if not overlapping:
                continue

            # Cap per-chain links to keep the graph navigable
            MAX_LINKS_PER_CHAIN = 8

            # A feeds into B
            existing_nexts = {x["chain_name"] for x in chain_links_map[cname_a]["next_chains"]}
            if cname_b not in existing_nexts and len(existing_nexts) < MAX_LINKS_PER_CHAIN:
                chain_links_map[cname_a]["next_chains"].append({
                    "chain_name": cname_b,
                    "provided_inputs": overlapping[:5]
                })
                chain_links_count += 1

            # B has A as prerequisite
            existing_pres = {x["chain_name"] for x in chain_links_map[cname_b]["prerequisites"]}
            if cname_a not in existing_pres and len(existing_pres) < MAX_LINKS_PER_CHAIN:
                chain_links_map[cname_b]["prerequisites"].append({
                    "chain_name": cname_a,
                    "required_outputs": overlapping[:5]
                })

    # Domain adjacency: add related_chains for chains in adjacent domains
    for cname_a, chain_a in chains.items():
        cat_a = get_category(chain_a)
        if cat_a == "none":
            continue
        for cname_b, chain_b in chains.items():
            if cname_a >= cname_b:
                continue
            cat_b = get_category(chain_b)
            if cat_b == "none":
                continue
            if not domains_adjacent(cat_a, cat_b):
                continue
            # Only add if they share at least one skill or have I/O overlap
            skills_a = set(get_skills_in_chain(chain_a))
            skills_b = set(get_skills_in_chain(chain_b))
            shared_skills = skills_a & skills_b
            if not shared_skills:
                continue
            existing_rels_a = {x["chain_name"] for x in chain_links_map[cname_a]["related_chains"]}
            existing_rels_b = {x["chain_name"] for x in chain_links_map[cname_b]["related_chains"]}
            if cname_b not in existing_rels_a:
                chain_links_map[cname_a]["related_chains"].append({
                    "chain_name": cname_b,
                    "relationship": "complement"
                })
            if cname_a not in existing_rels_b:
                chain_links_map[cname_b]["related_chains"].append({
                    "chain_name": cname_a,
                    "relationship": "complement"
                })

    # Write chain_links into chain files
    chains_written = 0
    for cname, links in chain_links_map.items():
        if not links["prerequisites"] and not links["next_chains"] and not links["related_chains"]:
            continue
        chain_file = os.path.join(CHAINS_DIR, cname + ".chain.json")
        if not os.path.exists(chain_file):
            continue
        try:
            c = json.load(open(chain_file, encoding="utf-8"))
        except (ValueError, OSError):
            continue
        # Prune empty lists
        cl = {}
        if links["prerequisites"]:
            cl["prerequisites"] = links["prerequisites"]
        if links["next_chains"]:
            cl["next_chains"] = links["next_chains"]
        if links["related_chains"]:
            cl["related_chains"] = links["related_chains"]
        if not cl:
            continue
        c["chain_links"] = cl
        if not dry_run:
            with open(chain_file, "w", encoding="utf-8") as fh:
                json.dump(c, fh, indent=2, ensure_ascii=False)
                fh.write("\n")
        chains_written += 1

    # Populate related_flows in manifests
    cooccur = build_skill_cooccurrence(chains)
    flows_written = 0
    for flow_name, manifest in manifests.items():
        related = []
        seen = set()
        my_outputs = set(safe_field_list(manifest.get("outputs", [])))
        my_inputs = set(safe_field_list(manifest.get("inputs", [])))

        # Co-occurrence: flows that appear in chains together
        if flow_name in cooccur:
            for other, count in sorted(cooccur[flow_name].items(), key=lambda x: -x[1]):
                if other in seen or other == flow_name or other not in manifests:
                    continue
                other_m = manifests[other]
                other_inputs = set(safe_field_list(other_m.get("inputs", [])))
                other_outputs = set(safe_field_list(other_m.get("outputs", [])))
                if my_outputs & other_inputs:
                    related.append({
                        "flow_name": other,
                        "relationship": "feeds_into",
                        "description": "outputs %s consumed by %s" % (
                            ", ".join(list(my_outputs & other_inputs)[:3]), other)
                    })
                    seen.add(other)
                elif other_outputs & my_inputs:
                    related.append({
                        "flow_name": other,
                        "relationship": "fed_by",
                        "description": "provides %s needed here" % (
                            ", ".join(list(other_outputs & my_inputs)[:3]))
                    })
                    seen.add(other)
                elif count >= 2:
                    related.append({
                        "flow_name": other,
                        "relationship": "complement",
                        "description": "co-occurs in %d chains" % count
                    })
                    seen.add(other)
                if len(related) >= 8:
                    break

        if not related:
            continue

        manifest["related_flows"] = related
        mf_path = os.path.join(MKT, flow_name, "manifest.json")
        if not dry_run:
            with open(mf_path, "w", encoding="utf-8") as fh:
                json.dump(manifest, fh, indent=2, ensure_ascii=False)
                fh.write("\n")
        flows_written += 1

    # Summary
    total_next = sum(len(v["next_chains"]) for v in chain_links_map.values())
    total_pre = sum(len(v["prerequisites"]) for v in chain_links_map.values())
    total_rel = sum(len(v["related_chains"]) for v in chain_links_map.values())
    print("\n=== RESULTS ===")
    print("Chain-to-chain links created:")
    print("  next_chains edges: %d" % total_next)
    print("  prerequisites edges: %d" % total_pre)
    print("  related_chains edges: %d" % total_rel)
    print("  Total chain_links entries: %d" % chain_links_count)
    print("  Chains updated with chain_links: %d / %d" % (chains_written, len(chains)))
    print("Flow-to-flow links created:")
    print("  Manifests updated with related_flows: %d / %d" % (flows_written, len(manifests)))
    if dry_run:
        print("\n[DRY RUN] No files were modified.")
    else:
        print("\nAll files written.")


if __name__ == "__main__":
    main()
