"""
extract_batch_to_marketplace.py
================================

Reads batch_output/*.json files and extracts:
  1. Polished skill.md -> marketplace/{skill-name}/skill.md
  2. Test cases -> marketplace/{skill-name}/tests.json
  3. Chain definitions -> marketplace/chains/{chain-name}.chain.json

Skips skills that already exist in marketplace.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BATCH_DIR = ROOT / "batch_output"
MARKETPLACE = ROOT / "marketplace"
CHAINS_DIR = MARKETPLACE / "chains"


def slugify(name: str) -> str:
    """Convert a skill name to a directory-safe slug."""
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def extract_one(json_path: Path) -> dict:
    """Extract skill, tests, and chain from a single batch output."""
    data = json.loads(json_path.read_text(encoding="utf-8"))
    steps = {s["alias"]: s for s in data["steps"]}
    result = {"file": json_path.name, "actions": []}

    # 1. Extract polished skill.md
    polish = steps.get("polish", {})
    if polish.get("status") != "completed":
        result["actions"].append("SKIP: polish step not completed")
        return result

    skill_md = polish.get("output", {}).get("improved_skill", "")
    if not skill_md:
        result["actions"].append("SKIP: no improved_skill content")
        return result

    # Parse skill name from first heading
    first_line = skill_md.split("\n")[0].strip()
    skill_name = first_line.lstrip("#").strip()
    skill_slug = slugify(skill_name)

    if not skill_slug:
        # Fallback to hint from filename
        skill_slug = json_path.stem.split("_", 1)[1] if "_" in json_path.stem else json_path.stem

    skill_dir = MARKETPLACE / skill_slug
    skill_file = skill_dir / "skill.md"

    if skill_dir.exists():
        result["actions"].append(f"EXISTS: {skill_slug}/ already in marketplace")
    else:
        skill_dir.mkdir(parents=True, exist_ok=True)
        skill_file.write_text(skill_md, encoding="utf-8")
        result["actions"].append(f"CREATED: {skill_slug}/skill.md ({len(skill_md)} chars)")

    # 2. Extract test cases
    tests = steps.get("tests", {})
    if tests.get("status") == "completed":
        test_json = tests.get("output", {}).get("test_cases_json")
        if test_json:
            test_file = skill_dir / "tests.json"
            if isinstance(test_json, str):
                test_file.write_text(test_json, encoding="utf-8")
            else:
                test_file.write_text(json.dumps(test_json, indent=2), encoding="utf-8")
            result["actions"].append(f"CREATED: {skill_slug}/tests.json")

    # 3. Extract chain definition
    chains = steps.get("chains", {})
    if chains.get("status") == "completed":
        chain_def = chains.get("output", {}).get("chain_definition")
        if chain_def:
            if isinstance(chain_def, str):
                try:
                    chain_def = json.loads(chain_def)
                except json.JSONDecodeError:
                    chain_def = None

            if chain_def and isinstance(chain_def, dict):
                chain_name = chain_def.get("name", f"{skill_slug}-chain")
                chain_slug = slugify(chain_name)
                chain_file = CHAINS_DIR / f"{chain_slug}.chain.json"

                if chain_file.exists():
                    result["actions"].append(f"EXISTS: chains/{chain_slug}.chain.json")
                else:
                    chain_file.write_text(
                        json.dumps(chain_def, indent=2), encoding="utf-8"
                    )
                    result["actions"].append(f"CREATED: chains/{chain_slug}.chain.json")

    result["skill_slug"] = skill_slug
    return result


def main():
    if not BATCH_DIR.exists():
        print(f"No batch_output/ directory found at {BATCH_DIR}")
        sys.exit(1)

    json_files = sorted(BATCH_DIR.glob("*.json"))
    json_files = [f for f in json_files if f.name != "batch_summary.json"]

    print(f"Found {len(json_files)} batch output files")
    print(f"Marketplace: {MARKETPLACE}")
    print()

    created_skills = 0
    created_chains = 0
    skipped = 0

    for jf in json_files:
        result = extract_one(jf)
        print(f"  {result['file']}:")
        for action in result["actions"]:
            print(f"    {action}")
            if action.startswith("CREATED") and "skill.md" in action:
                created_skills += 1
            elif action.startswith("CREATED") and "chain.json" in action:
                created_chains += 1
            elif action.startswith("EXISTS") or action.startswith("SKIP"):
                skipped += 1
        print()

    print(f"Done: {created_skills} skills created, {created_chains} chains created, {skipped} skipped/existing")


if __name__ == "__main__":
    main()
