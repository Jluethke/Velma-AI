"""Fix 'io name X never appears backticked in skill.md' validation errors.

For each flow, reads manifest.json inputs/outputs, checks if each name appears
as `name` in skill.md. If not, either wraps an existing plain-text mention in
backticks or appends a bullet to the ## Inputs / ## Outputs section.
"""
import json
import os
import re

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"


def io_names(manifest):
    names = []
    for section in ("inputs", "outputs"):
        for item in manifest.get(section, []):
            if isinstance(item, str):
                names.append((section, item))
            elif isinstance(item, dict) and "name" in item:
                names.append((section, item["name"]))
    return names


def find_section_end(lines, header):
    start = None
    for i, line in enumerate(lines):
        if line.strip().startswith(header):
            start = i
            break
    if start is None:
        return None, None
    end = len(lines)
    for i in range(start + 1, len(lines)):
        stripped = lines[i].strip()
        if stripped.startswith("## ") and not stripped.startswith("### "):
            end = i
            break
    return start, end


def fix_flow(flow_dir):
    sk_path = os.path.join(flow_dir, "skill.md")
    mf_path = os.path.join(flow_dir, "manifest.json")
    if not (os.path.isfile(sk_path) and os.path.isfile(mf_path)):
        return 0
    try:
        manifest = json.load(open(mf_path, encoding="utf-8"))
        skill = open(sk_path, encoding="utf-8").read()
    except Exception:
        return 0

    names = io_names(manifest)
    if not names:
        return 0

    missing = []
    for section, name in names:
        bt = "`%s`" % name
        if bt in skill:
            continue
        missing.append((section, name))

    if not missing:
        return 0

    lines = skill.split("\n")
    additions = 0

    for section, name in missing:
        bt = "`%s`" % name
        header = "## Inputs" if section == "inputs" else "## Outputs"

        plain_pat = re.compile(r"(?<!`)(\b" + re.escape(name) + r"\b)(?!`)")
        sec_start, sec_end = find_section_end(lines, header)

        replaced = False
        if sec_start is not None:
            for i in range(sec_start, sec_end):
                if plain_pat.search(lines[i]):
                    lines[i] = plain_pat.sub(bt, lines[i], count=1)
                    replaced = True
                    additions += 1
                    break

        if not replaced:
            if plain_pat.search("\n".join(lines)):
                for i in range(len(lines)):
                    if plain_pat.search(lines[i]):
                        lines[i] = plain_pat.sub(bt, lines[i], count=1)
                        replaced = True
                        additions += 1
                        break

        if not replaced and sec_start is not None:
            insert_at = sec_end
            for i in range(sec_end - 1, sec_start, -1):
                if lines[i].strip():
                    insert_at = i + 1
                    break
            lines.insert(insert_at, "- %s: (from manifest)" % bt)
            additions += 1

        if not replaced and sec_start is None:
            lines.append("")
            lines.append(header)
            lines.append("")
            lines.append("- %s: (from manifest)" % bt)
            additions += 1

    with open(sk_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return additions


def main():
    total_files = 0
    total_additions = 0
    for d in sorted(os.listdir(MKT)):
        flow_dir = os.path.join(MKT, d)
        if not os.path.isdir(flow_dir):
            continue
        n = fix_flow(flow_dir)
        if n > 0:
            total_files += 1
            total_additions += n
    print("Fixed %d files, %d backtick additions" % (total_files, total_additions))


if __name__ == "__main__":
    main()
