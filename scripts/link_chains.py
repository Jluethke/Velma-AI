"""Populate chain_links.related_chains across the library.

Takes a JSON file of link specs. Each spec: {group: [chain1, chain2, ...]}
For each chain in a group, adds all other members of the group to its
related_chains list (deduped, sorted).
"""
import json
import os
import sys

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")


def main():
    specs_file = sys.argv[1]
    specs = json.load(open(specs_file, encoding="utf-8"))

    links = {}
    for spec in specs:
        group = spec["group"]
        for chain_name in group:
            if chain_name not in links:
                links[chain_name] = set()
            for other in group:
                if other != chain_name:
                    links[chain_name].add(other)

    updated = 0
    missing = 0
    for chain_name, related in sorted(links.items()):
        path = os.path.join(CHAINS, chain_name + ".chain.json")
        if not os.path.isfile(path):
            print("WARN: " + chain_name + " not found, skipping")
            missing += 1
            continue

        chain = json.load(open(path, encoding="utf-8"))

        if "chain_links" not in chain:
            chain["chain_links"] = {
                "prerequisites": [],
                "next_chains": [],
                "related_chains": [],
            }

        raw = chain["chain_links"].get("related_chains", [])
        existing = set()
        for item in raw:
            if isinstance(item, str):
                existing.add(item)
            elif isinstance(item, dict) and "chain_name" in item:
                existing.add(item["chain_name"])
            elif isinstance(item, dict) and "name" in item:
                existing.add(item["name"])
        all_names = sorted(existing | related)
        chain["chain_links"]["related_chains"] = [
            {"chain_name": n, "relationship": "complement"} for n in all_names
        ]

        with open(path, "w", encoding="utf-8") as f:
            json.dump(chain, f, indent=2, ensure_ascii=False)
            f.write("\n")

        added = len(related - existing)
        if added > 0:
            print("Linked " + chain_name + " -> +" + str(added) + " related (" + str(len(all_names)) + " total)")
            updated += 1
        else:
            print("Linked " + chain_name + " -> no new (already " + str(len(all_names)) + ")")

    print("")
    print("Updated: " + str(updated))
    print("Missing: " + str(missing))
    print("Total chains touched: " + str(len(links)))


if __name__ == "__main__":
    main()
