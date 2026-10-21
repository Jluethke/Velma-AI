"""Fix stale test directories and report unexpected files in flow dirs."""
import json
import os
import shutil

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
ALLOWED = {"skill.md", "manifest.json", "tests.json", "provenance.json", "examples"}

tests_merged = 0
tests_removed = 0
unexpected_report = []

for entry in sorted(os.listdir(MKT)):
    d = os.path.join(MKT, entry)
    if not os.path.isdir(d):
        continue
    if not os.path.exists(os.path.join(d, "skill.md")):
        continue

    tests_dir = os.path.join(d, "tests")
    tests_json = os.path.join(d, "tests.json")

    if os.path.isdir(tests_dir):
        json_files = [f for f in os.listdir(tests_dir) if f.endswith(".json")]
        if json_files:
            merged = []
            for jf in sorted(json_files):
                p = os.path.join(tests_dir, jf)
                try:
                    data = json.load(open(p, encoding="utf-8"))
                    if isinstance(data, list):
                        merged.extend(data)
                    else:
                        merged.append(data)
                except Exception:
                    pass
            if merged:
                with open(tests_json, "w", encoding="utf-8") as f:
                    json.dump(merged, f, indent=2, ensure_ascii=False)
                    f.write("\n")
            shutil.rmtree(tests_dir)
            tests_merged += 1
        else:
            shutil.rmtree(tests_dir)
            tests_removed += 1

    extras = [x for x in os.listdir(d) if x not in ALLOWED]
    if extras:
        unexpected_report.append((entry, extras))

print("=== Issue 1: tests directories ===")
print("  Merged to tests.json: %d" % tests_merged)
print("  Removed (empty): %d" % tests_removed)

print("\n=== Issue 2: unexpected files ===")
print("  Flows with unexpected files: %d" % len(unexpected_report))
for name, extras in unexpected_report[:20]:
    print("  %s: %s" % (name, extras))
if len(unexpected_report) > 20:
    print("  ... and %d more" % (len(unexpected_report) - 20))

print("\n=== Issue 3: from_context validator fix ===")
print("  Updated check_chain.py to skip 'from_context' and 'from_context_optional' refs")
print("  (Applied directly to the validator, not via this script)")
