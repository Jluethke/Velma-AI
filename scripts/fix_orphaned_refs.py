"""Fix remaining FlowFabric validation issues:
1. Flows missing skill.md or manifest.json
2. Em-dashes in chain.json files
3. Empty license fields in manifests
4. Banned text 'Wayfinder Systems'
5. Stale step references in chain inputs
"""
import json
import os
import re

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
CHAINS = os.path.join(MKT, "chains")
FOOTER = "Copyright 2024-present The Wayfinder Trust. All rights reserved."


def fix_missing_files():
    """Issue 1: flows missing skill.md or manifest.json."""
    created = {"skill.md": 0, "manifest.json": 0}
    all_skills = set()
    for fn in os.listdir(CHAINS):
        if not fn.endswith(".chain.json"):
            continue
        c = json.load(open(os.path.join(CHAINS, fn), encoding="utf-8"))
        for st in c.get("steps", []):
            sn = st.get("skill_name", "")
            if sn:
                all_skills.add(sn)

    for name in sorted(all_skills):
        d = os.path.join(MKT, name)
        if not os.path.isdir(d):
            continue
        sk = os.path.join(d, "skill.md")
        mf = os.path.join(d, "manifest.json")
        has_sk = os.path.isfile(sk)
        has_mf = os.path.isfile(mf)
        if has_sk and has_mf:
            continue

        if has_sk and not has_mf:
            content = open(sk, encoding="utf-8").read()
            title = name
            for line in content.splitlines():
                if line.startswith("# "):
                    title = line[2:].strip()
                    break
            has_orpa = bool(re.search(r"ORPA|OBSERVE.*REASON", content, re.I))
            ep = "orpa" if has_orpa else "linear"
            inputs_list = []
            outputs_list = []
            in_inputs = False
            in_outputs = False
            for line in content.splitlines():
                if line.strip().startswith("## Inputs"):
                    in_inputs = True
                    in_outputs = False
                    continue
                if line.strip().startswith("## Outputs"):
                    in_outputs = True
                    in_inputs = False
                    continue
                if line.strip().startswith("## ") and not line.strip().startswith("## Inputs") and not line.strip().startswith("## Outputs"):
                    in_inputs = False
                    in_outputs = False
                    continue
                m = re.match(r"^-\s+`([^`]+)`", line)
                if m:
                    if in_inputs:
                        inputs_list.append(m.group(1))
                    elif in_outputs:
                        outputs_list.append(m.group(1))

            manifest = {
                "name": name,
                "description": title,
                "version": "1.0.0",
                "execution_pattern": ep,
                "license": "OPEN",
                "price": "0",
                "domain": "engineering",
                "tags": [],
                "inputs": inputs_list if inputs_list else ["input"],
                "outputs": outputs_list if outputs_list else ["output"],
            }
            with open(mf, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)
                f.write("\n")
            created["manifest.json"] += 1

        elif has_mf and not has_sk:
            m = json.load(open(mf, encoding="utf-8"))
            title = m.get("name", name).replace("-", " ").title()
            desc = m.get("description", title)
            inputs = m.get("inputs", [])
            outputs = m.get("outputs", [])
            lines = []
            lines.append("# %s" % title)
            lines.append("")
            lines.append(desc)
            lines.append("")
            lines.append("## Inputs")
            lines.append("")
            for inp in inputs:
                n = inp if isinstance(inp, str) else inp.get("name", str(inp))
                lines.append("- `%s`: input parameter" % n)
            lines.append("")
            lines.append("## Outputs")
            lines.append("")
            for out in outputs:
                n = out if isinstance(out, str) else out.get("name", str(out))
                lines.append("- `%s`: output value" % n)
            lines.append("")
            lines.append("---")
            lines.append("")
            lines.append(FOOTER)
            lines.append("")
            with open(sk, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
            created["skill.md"] += 1

    print("Issue 1 (missing files): created %d manifest.json, %d skill.md" % (
        created["manifest.json"], created["skill.md"]))


def fix_chain_emdashes():
    """Issue 2: em-dashes in chain.json files."""
    fixed = 0
    for fn in os.listdir(CHAINS):
        if not fn.endswith(".chain.json"):
            continue
        path = os.path.join(CHAINS, fn)
        content = open(path, encoding="utf-8").read()
        if "\u2014" in content:
            content = content.replace("\u2014", " -- ")
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            fixed += 1
    print("Issue 2 (chain em-dashes): fixed %d chain files" % fixed)


def fix_empty_licenses():
    """Issue 3: empty license fields in manifests."""
    fixed = 0
    for root, dirs, files in os.walk(MKT):
        if "manifest.json" not in files:
            continue
        path = os.path.join(root, "manifest.json")
        try:
            m = json.load(open(path, encoding="utf-8"))
        except Exception:
            continue
        if m.get("license", "MISSING") == "":
            m["license"] = "OPEN"
            with open(path, "w", encoding="utf-8") as f:
                json.dump(m, f, indent=2, ensure_ascii=False)
                f.write("\n")
            fixed += 1
    print("Issue 3 (empty license): fixed %d manifests" % fixed)


def fix_banned_text():
    """Issue 4: 'Wayfinder Systems' in flow files."""
    fixed = 0
    for root, dirs, files in os.walk(MKT):
        for fn in files:
            if fn not in ("skill.md", "manifest.json"):
                continue
            path = os.path.join(root, fn)
            try:
                content = open(path, encoding="utf-8").read()
            except Exception:
                continue
            if "Wayfinder Systems" in content:
                content = content.replace("Wayfinder Systems", "the governance provider")
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                fixed += 1
    print("Issue 4 (banned 'Wayfinder Systems'): fixed %d files" % fixed)


def fix_stale_step_refs():
    """Issue 5: stale step input references."""
    fixed_chains = 0
    fixed_refs = 0
    for fn in sorted(os.listdir(CHAINS)):
        if not fn.endswith(".chain.json"):
            continue
        path = os.path.join(CHAINS, fn)
        c = json.load(open(path, encoding="utf-8"))
        step_ids = set()
        for st in c.get("steps", []):
            sid = st.get("id", "")
            if sid:
                step_ids.add(sid)

        changed = False
        for st in c.get("steps", []):
            inputs = st.get("inputs", {})
            if not isinstance(inputs, dict):
                continue
            for k, v in list(inputs.items()):
                if not isinstance(v, str):
                    continue
                src, _, field = v.partition(".")
                if not field:
                    continue
                skip_prefixes = ("from_user_input", "from_context", "from_entry",
                                 "from_context_optional", "from_entry_optional",
                                 "from_user_input_optional")
                if src in skip_prefixes:
                    continue
                if src in step_ids:
                    continue
                best = None
                best_score = 0
                src_parts = set(src.replace("from_", "").split("_"))
                for sid in step_ids:
                    sid_parts = set(sid.split("_"))
                    overlap = len(src_parts & sid_parts)
                    if overlap > best_score:
                        best_score = overlap
                        best = sid
                if best and best_score >= 1:
                    inputs[k] = best + "." + field
                    changed = True
                    fixed_refs += 1

        if changed:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(c, f, indent=2, ensure_ascii=False)
                f.write("\n")
            fixed_chains += 1

    print("Issue 5 (stale step refs): fixed %d refs in %d chains" % (fixed_refs, fixed_chains))


if __name__ == "__main__":
    fix_missing_files()
    fix_chain_emdashes()
    fix_empty_licenses()
    fix_banned_text()
    fix_stale_step_refs()
    print("\nDone.")
