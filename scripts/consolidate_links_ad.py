"""Consolidate pairwise links into groups and clean topic clusters.
Merge overlapping pairs into connected-component groups."""
import json

RAW = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\link_specs_A_clean.json"
OUTPUT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\link_specs_A.json"

specs = json.load(open(RAW, encoding="utf-8"))

# First: manually clean topic clusters to remove false positives
# Only keep chains that truly belong to the topic
TOPIC_OVERRIDES = {
    "Home topic cluster": [
        "home-maintenance-calendar", "household-ops-manual-creation-pipeline",
        "new-homeowner", "new-homeowner-setup", "seasonal-home-prep",
        "fabric-home-purchase", "home-ops", "home-renovation-planner-chain"
    ],
    "Career topic cluster": [
        "career-change-retraining", "career-pivot", "get-hired", "job-search-blitz",
        "layoff-recovery", "parent-relaunch", "salary-review", "should-i-quit",
        "fabric-hiring-pipeline", "fabric-talent-career"
    ],
    "Relationship topic cluster": [
        "relationship-check-in", "pre-marriage-alignment", "conflict-resolver-chain",
        "hard-conversation", "mindfulness-sequencer-chain"
    ],
    "Moving topic cluster": [
        "moving-complete", "moving-day-complete", "new-homeowner", "new-homeowner-setup",
        "new-life-kickstart", "relocation-decision-chain"
    ],
    "Elder Care topic cluster": [
        "assisted-living-evaluator", "elder-care-setup", "medicare-medicaid-navigator"
    ],
    "Small Business topic cluster": [
        "fabric-small-biz-exit", "fabric-small-biz-launch",
        "fabric-small-biz-ownership-transition", "freelancer-toolkit",
        "solopreneur-daily", "micro-business-launch", "side-hustle-financial-modeler-chain"
    ],
    "Custody Divorce topic cluster": [
        "custody-arrangement-planner", "divorce-navigator", "new-life-kickstart"
    ],
}

# Build union-find for consolidating pairs
parent = {}
def find(x):
    while parent.get(x, x) != x:
        parent[x] = parent.get(parent[x], parent[x])
        x = parent[x]
    return x
def union(a, b):
    ra, rb = find(a), find(b)
    if ra != rb:
        parent[ra] = rb

# Process all specs
final_groups = []
pair_specs = []

for spec in specs:
    g = spec["group"]
    note = spec["note"]

    # If it's a topic cluster, apply overrides
    if note in TOPIC_OVERRIDES:
        cleaned = TOPIC_OVERRIDES[note]
        if len(cleaned) >= 2:
            final_groups.append({"group": sorted(cleaned), "note": note})
        continue

    # If it's a topic cluster not in overrides, drop if > 8 members (too broad)
    if "topic cluster" in note and len(g) > 8:
        continue

    # If it's a topic cluster <= 8 members, keep as-is
    if "topic cluster" in note:
        final_groups.append(spec)
        continue

    # Pair-wise specs: collect for consolidation
    if len(g) == 2:
        pair_specs.append(spec)
        union(g[0], g[1])
    else:
        final_groups.append(spec)

# Build connected components from pairs
components = {}
for spec in pair_specs:
    for name in spec["group"]:
        root = find(name)
        if root not in components:
            components[root] = {"members": set(), "notes": []}
        components[root]["members"].add(name)
    components[find(spec["group"][0])]["notes"].append(spec["note"])

# Convert components to groups
for root, data in components.items():
    members = sorted(data["members"])
    if len(members) < 2:
        continue
    # Pick best note
    notes = data["notes"]
    best_note = max(notes, key=lambda n: "Skill overlap" in n)
    # Cap groups at 12 to avoid noise
    if len(members) > 12:
        continue
    final_groups.append({"group": members, "note": best_note})

# Deduplicate: remove groups that are strict subsets of others
final_groups.sort(key=lambda g: -len(g["group"]))
kept = []
for g in final_groups:
    gs = set(g["group"])
    is_subset = False
    for k in kept:
        if gs.issubset(set(k["group"])):
            is_subset = True
            break
    if not is_subset:
        kept.append(g)

kept.sort(key=lambda g: g["group"][0])
print(f"Final: {len(kept)} link groups")

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(kept, f, indent=2, ensure_ascii=False)
    f.write("\n")

total_chains = set()
for g in kept:
    for c in g["group"]:
        total_chains.add(c)
print(f"Total chains touched: {len(total_chains)}")

for g in kept:
    print(f"  [{len(g['group'])}] {g['group'][:5]}{'...' if len(g['group'])>5 else ''} - {g['note']}")
