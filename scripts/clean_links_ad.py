"""Clean the raw link specs: remove oversized topic clusters, keep skill/desc overlaps
and small meaningful topic groups."""
import json

RAW = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\link_specs_A.json"
OUTPUT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\link_specs_A_clean.json"

specs = json.load(open(RAW, encoding="utf-8"))

clean = []
for spec in specs:
    g = spec["group"]
    # Drop topic clusters larger than 15 (too broad to be meaningful)
    if len(g) > 15:
        continue
    # Drop groups that are just parent/child families
    # (all share a common prefix with length > 10)
    if len(g) >= 3:
        prefixes = set()
        for name in g:
            parts = name.split("-")
            if len(parts) >= 2:
                prefixes.add("-".join(parts[:2]))
        if len(prefixes) == 1:
            continue
    clean.append(spec)

print(f"Kept {len(clean)} of {len(specs)} link groups")

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(clean, f, indent=2, ensure_ascii=False)
    f.write("\n")

for g in clean:
    print(f"  {g['group']} - {g['note']}")
