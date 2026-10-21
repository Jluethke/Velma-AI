"""Find related chain groups for chains A-D by topic similarity.

Outputs link groups to link_specs_A.json, excluding already-linked pairs
from link_specs.json and parent/child language variants.
"""
import json
import os
import re

INDEX = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\chain_index.json"
EXISTING = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\link_specs.json"
OUTPUT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\scripts\link_specs_A.json"

idx = json.load(open(INDEX, encoding="utf-8"))
existing = json.load(open(EXISTING, encoding="utf-8"))

# Build set of already-linked pairs
linked_pairs = set()
for spec in existing:
    group = spec["group"]
    for i, a in enumerate(group):
        for b in group[i+1:]:
            linked_pairs.add((min(a, b), max(a, b)))

def is_linked(a, b):
    return (min(a, b), max(a, b)) in linked_pairs

# Identify parent/child families (parent name is prefix of child)
def is_parent_child(a, b):
    if a.startswith(b + "-") or b.startswith(a + "-"):
        return True
    return False

# Language variant suffixes
LANG_SUFFIXES = ["-go", "-python", "-typescript", "-rust", "-java", "-node",
                 "-cpp", "-ruby", "-react", "-vue", "-angular", "-svelte",
                 "-pg", "-mysql", "-redis", "-mongo"]

def is_lang_variant(a, b):
    for suf in LANG_SUFFIXES:
        if a.endswith(suf) or b.endswith(suf):
            a_base = a
            b_base = b
            for s in LANG_SUFFIXES:
                if a_base.endswith(s):
                    a_base = a_base[:-len(s)]
                if b_base.endswith(s):
                    b_base = b_base[:-len(s)]
            if a_base == b_base:
                return True
    return False

# Topic keywords for grouping
TOPIC_GROUPS = {
    "anxiety-mental-health": ["anxiety", "burnout", "stress", "mental-health", "grief", "therapy"],
    "budget-finance": ["budget", "financial", "money", "debt", "credit-score", "savings", "net-worth", "portfolio"],
    "career": ["career", "resume", "interview", "salary", "job-search", "hired", "layoff"],
    "cooking-meal": ["meal", "cooking", "recipe", "grocery", "kitchen"],
    "custody-divorce": ["custody", "divorce", "co-parent"],
    "elder-care": ["elder", "assisted-living", "medicare", "medicaid", "aging"],
    "estate-planning": ["estate", "will", "end-of-life", "inheritance", "advance-directive"],
    "home": ["home-maintenance", "house", "seasonal-home", "household", "homeowner"],
    "insurance": ["insurance"],
    "investing": ["invest", "portfolio", "stock", "retirement"],
    "moving": ["moving", "relocation", "new-home"],
    "parenting": ["parent", "baby", "teenager", "custody", "family"],
    "pet-care": ["pet", "dog", "cat", "vet"],
    "relationship": ["relationship", "marriage", "pre-marriage", "dating", "couple"],
    "small-business": ["small-biz", "freelanc", "side-hustle", "solopreneur", "business-in-a-box"],
    "startup": ["startup", "saas", "mvp", "fundrais", "investor", "pitch"],
    "tenant-housing": ["tenant", "rent", "landlord", "lease", "housing"],
    "vehicle": ["vehicle", "car", "drive", "mechanic", "diagnostic", "towing"],
    "volunteer-community": ["volunteer", "neighborhood", "community"],
    "wellness-fitness": ["fitness", "workout", "exercise", "health-reset", "wellness"],
}

all_names = sorted(idx.keys())
ad_names = [n for n in all_names if n[0] in "abcd"]

# Strategy 1: Skill overlap (>=40% Jaccard)
def skill_jaccard(a, b):
    sa = set(idx[a]["skills"])
    sb = set(idx[b]["skills"])
    if not sa or not sb:
        return 0
    return len(sa & sb) / len(sa | sb)

# Strategy 2: Topic keyword match
def topic_match(name, desc):
    matches = []
    text = (name + " " + desc).lower()
    for topic, keywords in TOPIC_GROUPS.items():
        for kw in keywords:
            if kw in text:
                matches.append(topic)
                break
    return matches

# Build topic index
topic_chains = {}
for name in all_names:
    topics = topic_match(name, idx[name]["desc"])
    for t in topics:
        if t not in topic_chains:
            topic_chains[t] = []
        topic_chains[t].append(name)

new_groups = []
seen_groups = set()

# Find topic-based groups that include at least one A-D chain
for topic, chains in sorted(topic_chains.items()):
    if len(chains) < 2:
        continue
    # Filter out parent/child and already-linked
    ad_in_group = [c for c in chains if c[0] in "abcd"]
    if not ad_in_group:
        continue

    # Check which pairs aren't already linked
    unlinked = []
    for c in chains:
        has_unlinked = False
        for ad in ad_in_group:
            if c != ad and not is_linked(c, ad) and not is_parent_child(c, ad) and not is_lang_variant(c, ad):
                has_unlinked = True
                break
        if has_unlinked or c in ad_in_group:
            unlinked.append(c)

    if len(unlinked) >= 2:
        key = tuple(sorted(unlinked))
        if key not in seen_groups:
            seen_groups.add(key)
            new_groups.append({
                "group": sorted(unlinked),
                "note": topic.replace("-", " ").title() + " topic cluster"
            })

# Find skill-overlap pairs for A-D chains
for ad_name in ad_names:
    for other in all_names:
        if other == ad_name:
            continue
        if is_parent_child(ad_name, other):
            continue
        if is_lang_variant(ad_name, other):
            continue
        if is_linked(ad_name, other):
            continue

        jacc = skill_jaccard(ad_name, other)
        if jacc >= 0.35:
            pair = tuple(sorted([ad_name, other]))
            if pair not in seen_groups:
                seen_groups.add(pair)
                new_groups.append({
                    "group": list(pair),
                    "note": f"Skill overlap {jacc:.0%}"
                })

# Find description-based semantic matches for A-D chains
# Key phrase extraction
def key_phrases(desc):
    desc = desc.lower()
    # Remove common words
    stop = {"the","a","an","and","or","for","to","from","with","in","on","of","is",
            "your","you","it","its","that","this","by","at","as","be","do","up","all",
            "then","each","into","end","full","set","get","run","use","one","new"}
    words = re.findall(r'[a-z]+(?:-[a-z]+)*', desc)
    return set(w for w in words if w not in stop and len(w) > 3)

for ad_name in ad_names:
    ad_phrases = key_phrases(idx[ad_name]["desc"])
    if len(ad_phrases) < 3:
        continue
    for other in all_names:
        if other == ad_name:
            continue
        if is_parent_child(ad_name, other):
            continue
        if is_lang_variant(ad_name, other):
            continue
        if is_linked(ad_name, other):
            continue
        pair = tuple(sorted([ad_name, other]))
        if pair in seen_groups:
            continue

        other_phrases = key_phrases(idx[other]["desc"])
        if len(other_phrases) < 3:
            continue
        overlap = ad_phrases & other_phrases
        score = len(overlap) / min(len(ad_phrases), len(other_phrases))
        if score >= 0.5 and len(overlap) >= 4:
            seen_groups.add(pair)
            new_groups.append({
                "group": list(pair),
                "note": f"Description overlap: {', '.join(sorted(list(overlap)[:5]))}"
            })

print(f"Found {len(new_groups)} new link groups")

# Sort by group size desc then name
new_groups.sort(key=lambda g: (-len(g["group"]), g["group"][0]))

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(new_groups, f, indent=2, ensure_ascii=False)
    f.write("\n")

# Print summary
for g in new_groups:
    print(f"  {g['group']} - {g['note']}")
