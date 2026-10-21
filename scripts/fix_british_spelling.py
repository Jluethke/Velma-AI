"""Fix British spellings in all marketplace skill.md and manifest.json files."""
import os
import re

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"

REPLACEMENTS = [
    ("optimis", "optimiz"),
    ("colour", "color"),
    ("behaviour", "behavior"),
    ("analyse", "analyze"),
    ("centre", "center"),
    ("metre", "meter"),
    ("favour", "favor"),
    ("modelling", "modeling"),
    ("modelled", "modeled"),
    ("initialis", "initializ"),
    ("serialis", "serializ"),
    ("normalis", "normaliz"),
]

LICENCE_RE = re.compile(r"\blicence\b", re.IGNORECASE)


def case_preserving_replace(text, old, new):
    """Replace old with new, preserving the case pattern of each match."""
    count = 0
    result = []
    i = 0
    low_text = text.lower()
    low_old = old.lower()
    while i < len(low_text):
        pos = low_text.find(low_old, i)
        if pos == -1:
            result.append(text[i:])
            break
        result.append(text[i:pos])
        matched = text[pos:pos + len(old)]
        replaced = []
        for j, ch in enumerate(new):
            if j < len(matched):
                replaced.append(ch.upper() if matched[j].isupper() else ch.lower())
            else:
                replaced.append(ch)
        result.append("".join(replaced))
        count += 1
        i = pos + len(old)
    else:
        pass
    return "".join(result), count


def fix_licence(text):
    """Replace 'licence' with 'license' but not inside Copyright footer lines."""
    count = 0
    lines = text.split("\n")
    out = []
    for line in lines:
        if "Copyright" in line:
            out.append(line)
            continue
        new_line, c = case_preserving_replace(line, "licence", "license")
        count += c
        out.append(new_line)
    return "\n".join(out), count


def main():
    files_fixed = 0
    total_replacements = 0
    pattern_counts = {}

    for dirpath, dirnames, filenames in os.walk(MKT):
        for fn in filenames:
            if fn not in ("skill.md", "manifest.json"):
                continue
            path = os.path.join(dirpath, fn)
            try:
                content = open(path, encoding="utf-8").read()
            except Exception:
                continue

            original = content
            file_replacements = 0

            for old, new in REPLACEMENTS:
                content, c = case_preserving_replace(content, old, new)
                if c > 0:
                    file_replacements += c
                    pattern_counts[old] = pattern_counts.get(old, 0) + c

            content, c = fix_licence(content)
            if c > 0:
                file_replacements += c
                pattern_counts["licence"] = pattern_counts.get("licence", 0) + c

            if content != original:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                files_fixed += 1
                total_replacements += file_replacements

    print("Files fixed: %d" % files_fixed)
    print("Total replacements: %d" % total_replacements)
    print()
    print("By pattern:")
    for pat, cnt in sorted(pattern_counts.items(), key=lambda x: -x[1]):
        print("  %4d  %s" % (cnt, pat))


if __name__ == "__main__":
    main()
