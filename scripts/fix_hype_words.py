"""Strip banned hype words from all flow files (skill.md and manifest.json).

Preserves original case pattern: Comprehensive -> Full, comprehensive -> full,
COMPREHENSIVE -> FULL.
"""
import json
import os
import re

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"

REPLACEMENTS = {
    "comprehensive": "full",
    "robust": "reliable",
    "powerful": "capable",
    "compelling": "clear",
    "transformative": "significant",
    "cutting-edge": "current",
    "leverages": "uses",
    "empowers": "lets",
    "unlocks": "opens",
    "seamlessly": "smoothly",
    "seamless": "smooth",
    "game-changing": "notable",
}


def _match_case(original, replacement):
    if original.isupper():
        return replacement.upper()
    if original[0].isupper():
        return replacement[0].upper() + replacement[1:]
    return replacement


def _replace(text):
    count = 0
    for hype, neutral in REPLACEMENTS.items():
        pattern = re.compile(re.escape(hype), re.IGNORECASE)
        def _sub(m, _neutral=neutral):
            return _match_case(m.group(0), _neutral)
        text, n = pattern.subn(_sub, text)
        count += n
    return text, count


def main():
    files_fixed = 0
    total_replacements = 0

    for dirpath, dirnames, filenames in os.walk(MKT):
        for fn in filenames:
            if fn not in ("skill.md", "manifest.json"):
                continue
            path = os.path.join(dirpath, fn)
            try:
                content = open(path, encoding="utf-8").read()
            except Exception:
                continue

            new_content, count = _replace(content)
            if count > 0:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                files_fixed += 1
                total_replacements += count

    print("Files fixed: %d" % files_fixed)
    print("Total replacements: %d" % total_replacements)


if __name__ == "__main__":
    main()
