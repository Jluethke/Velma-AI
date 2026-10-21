"""Fix related_chains entries from plain strings to proper objects.

The validator expects: {"chain_name": "x", "relationship": "complement"}
The linker wrote plain strings: "x"
"""
import json
import os
import glob

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")

fixed = 0
for f in sorted(glob.glob(os.path.join(CHAINS, "*.chain.json"))):
    c = json.load(open(f, encoding="utf-8"))
    cl = c.get("chain_links")
    if cl is None:
        continue
    changed = False
    for key in ("related_chains", "prerequisites", "next_chains"):
        items = cl.get(key, [])
        new_items = []
        for item in items:
            if isinstance(item, str):
                if key == "related_chains":
                    new_items.append({"chain_name": item, "relationship": "complement"})
                elif key == "prerequisites":
                    new_items.append({"chain_name": item, "required_outputs": []})
                elif key == "next_chains":
                    new_items.append({"chain_name": item, "provided_inputs": []})
                changed = True
            else:
                new_items.append(item)
        cl[key] = new_items
    if changed:
        with open(f, "w", encoding="utf-8") as fh:
            json.dump(c, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        fixed += 1

print("Fixed: " + str(fixed) + " chains")
