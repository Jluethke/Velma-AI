"""Remove related_chains entries that reference non-existent chain files."""
import json
import os
import glob

CHAINS = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace\chains"

existing = set()
for f in glob.glob(os.path.join(CHAINS, "*.chain.json")):
    existing.add(os.path.basename(f).replace(".chain.json", ""))

fixed = 0
for f in glob.glob(os.path.join(CHAINS, "*.chain.json")):
    data = json.load(open(f, encoding="utf-8"))
    rc = data.get("chain_links", {}).get("related_chains", [])
    if not rc:
        continue
    clean = []
    removed = []
    for item in rc:
        cn = item.get("chain_name", "") if isinstance(item, dict) else item
        if cn in existing:
            clean.append(item)
        else:
            removed.append(cn)
    if removed:
        data["chain_links"]["related_chains"] = clean
        with open(f, "w", encoding="utf-8") as out:
            json.dump(data, out, indent=2, ensure_ascii=False)
            out.write("\n")
        fixed += 1
        print(f"Pruned {os.path.basename(f)}: removed {removed}")

print(f"\nFixed: {fixed} chains")
