"""Fix missing/invalid manifest.json fields and banned text across all flows."""
import json
import os
import re

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"

counts = {
    "price_fixed": 0,
    "tags_fixed": 0,
    "version_fixed": 0,
    "description_fixed": 0,
    "wk2_skill_fixed": 0,
    "wk2_manifest_fixed": 0,
    "jeep_skill_fixed": 0,
    "jeep_manifest_fixed": 0,
}


def first_paragraph(skill_path):
    """Extract first non-heading, non-empty paragraph from skill.md."""
    try:
        lines = open(skill_path, encoding="utf-8").readlines()
    except Exception:
        return ""
    buf = []
    in_para = False
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if in_para and buf:
                break
            continue
        if stripped.startswith("#") or stripped.startswith("```") or stripped.startswith(">"):
            if in_para and buf:
                break
            continue
        if stripped.startswith("---"):
            continue
        in_para = True
        buf.append(stripped)
    text = " ".join(buf)
    if len(text) > 200:
        text = text[:197] + "..."
    return text


def fix_banned_text(content, is_json=False):
    """Replace WK2 and Jeep references with neutral terms."""
    changed = False
    if "WK2" in content:
        content = content.replace("WK2", "target vehicle")
        changed = True
    if not is_json:
        content = re.sub(r'\bJeep\b', 'vehicle platform', content)
        if 'vehicle platform' in content and 'Jeep' not in content:
            changed = True
    else:
        if '"Jeep"' in content or "'Jeep'" in content:
            content = content.replace("Jeep", "vehicle platform")
            changed = True
        elif re.search(r'\bJeep\b', content):
            content = re.sub(r'\bJeep\b', 'vehicle platform', content)
            changed = True
    return content, changed


for entry in sorted(os.listdir(MKT)):
    d = os.path.join(MKT, entry)
    mf = os.path.join(d, "manifest.json")
    sk = os.path.join(d, "skill.md")
    if not os.path.isfile(mf):
        continue

    try:
        m = json.load(open(mf, encoding="utf-8"))
    except Exception:
        continue

    manifest_changed = False

    if m.get("price") is None or "price" not in m:
        m["price"] = "0"
        counts["price_fixed"] += 1
        manifest_changed = True

    if "tags" not in m:
        m["tags"] = []
        counts["tags_fixed"] += 1
        manifest_changed = True

    if "version" not in m:
        m["version"] = "1.0.0"
        counts["version_fixed"] += 1
        manifest_changed = True

    if "description" not in m or not m["description"]:
        desc = first_paragraph(sk) if os.path.isfile(sk) else ""
        if not desc:
            desc = entry.replace("-", " ").title()
        m["description"] = desc
        counts["description_fixed"] += 1
        manifest_changed = True

    raw_m = json.dumps(m, ensure_ascii=False)
    if "WK2" in raw_m or re.search(r'\bJeep\b', raw_m):
        fixed_str, did = fix_banned_text(raw_m, is_json=True)
        if did:
            m = json.loads(fixed_str)
            manifest_changed = True
            if "WK2" not in json.dumps(m):
                counts["wk2_manifest_fixed"] += 1
            counts["jeep_manifest_fixed"] += 1

    if manifest_changed:
        with open(mf, "w", encoding="utf-8") as f:
            json.dump(m, f, indent=2, ensure_ascii=False)
            f.write("\n")

    if os.path.isfile(sk):
        try:
            content = open(sk, encoding="utf-8").read()
        except Exception:
            continue
        sk_changed = False
        if "WK2" in content:
            content = content.replace("WK2", "target vehicle")
            sk_changed = True
            counts["wk2_skill_fixed"] += 1
        if re.search(r'\bJeep\b', content):
            content = re.sub(r'\bJeep\b', 'vehicle platform', content)
            sk_changed = True
            counts["jeep_skill_fixed"] += 1
        if sk_changed:
            with open(sk, "w", encoding="utf-8") as f:
                f.write(content)

print("=== Manifest Gap Fix Summary ===")
for k, v in sorted(counts.items()):
    print(f"  {k}: {v}")
total = sum(counts.values())
print(f"\nTotal fixes: {total}")
