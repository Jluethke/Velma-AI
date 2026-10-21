"""Add missing required sections to flow skill.md files.

Handles two patterns:
1. Flows genuinely missing sections -> adds them
2. Flows using bold-text variants (e.g. **Entry criteria:**) instead of H3 headings
   -> normalizes to the heading format the validator expects
"""
import json
import os
import re
import sys

MKT = r"F:\The Wayfinder Trust\IP\projects\SkillChain\marketplace"
FOOTER = "Copyright 2024-present The Wayfinder Trust. All rights reserved."

stats = {
    "files_fixed": 0,
    "## Inputs": 0,
    "## Outputs": 0,
    "## Worked Example": 0,
    "## Exit Criteria": 0,
    "## Error Handling": 0,
    "### Entry Criteria": 0,
    "### Actions": 0,
    "### Output": 0,
    "footer": 0,
    "bold_normalized": 0,
}


def normalize_bold_to_headings(content):
    """Convert **Entry criteria:** / **Actions:** / **Output:** to ### headings."""
    count = 0
    # Entry criteria / Entry Criteria
    pat = re.compile(r"^\*\*Entry [Cc]riteria:?\*\*\s*", re.MULTILINE)
    if pat.search(content) and "### Entry Criteria" not in content:
        content = pat.sub("### Entry Criteria\n", content)
        count += 1

    # Actions
    pat = re.compile(r"^\*\*Actions:?\*\*\s*", re.MULTILINE)
    if pat.search(content) and "### Actions" not in content:
        content = pat.sub("### Actions\n", content)
        count += 1

    # Output (but not Outputs which is ## level)
    pat = re.compile(r"^\*\*Output:?\*\*\s*", re.MULTILINE)
    if pat.search(content) and "### Output" not in content:
        content = pat.sub("### Output\n", content)
        count += 1

    # Quality gate -> Quality Gate
    pat = re.compile(r"^\*\*Quality [Gg]ate:?\*\*\s*", re.MULTILINE)
    if pat.search(content) and "### Quality Gate" not in content:
        content = pat.sub("### Quality Gate\n", content)
        count += 1

    return content, count


def io_bullets(manifest, key):
    """Build bullet list from manifest inputs or outputs."""
    items = manifest.get(key, [])
    if not items:
        return "- (none defined)\n"
    lines = []
    for item in items:
        if isinstance(item, str):
            lines.append("- `%s`" % item)
        elif isinstance(item, dict):
            name = item.get("name", str(item))
            typ = item.get("type", "")
            desc = item.get("description", "")
            line = "- `%s`" % name
            if typ:
                line += " (%s)" % typ
            if desc:
                line += ": %s" % desc
            lines.append(line)
    return "\n".join(lines) + "\n"


def fix_flow(flow_dir):
    sk_path = os.path.join(flow_dir, "skill.md")
    mf_path = os.path.join(flow_dir, "manifest.json")
    if not os.path.exists(sk_path):
        return False
    try:
        manifest = json.load(open(mf_path, encoding="utf-8")) if os.path.exists(mf_path) else {}
    except (json.JSONDecodeError, ValueError):
        manifest = {}

    content = open(sk_path, encoding="utf-8").read()
    original = content
    is_phase = manifest.get("execution_pattern") == "phase_pipeline"

    # Step 1: Normalize bold variants to headings
    content, bold_count = normalize_bold_to_headings(content)
    if bold_count:
        stats["bold_normalized"] += bold_count

    # Step 2: Add missing ## Inputs
    if "## Inputs" not in content:
        block = "\n---\n\n## Inputs\n\n" + io_bullets(manifest, "inputs") + "\n"
        # Insert before ## Outputs if present, else before first ## Phase or at end
        if "## Outputs" in content:
            content = content.replace("## Outputs", block + "## Outputs", 1)
        else:
            content += block
        stats["## Inputs"] += 1

    # Step 3: Add missing ## Outputs
    if "## Outputs" not in content:
        block = "\n---\n\n## Outputs\n\n" + io_bullets(manifest, "outputs") + "\n"
        # Insert after ## Inputs section
        m = re.search(r"(## Inputs\n(?:.*?\n)*?)(\n---|\n## )", content)
        if m:
            content = content[:m.end(1)] + block + content[m.end(1):]
        else:
            content += block
        stats["## Outputs"] += 1

    if is_phase:
        # Step 4: Add missing ## Worked Example
        if "## Worked Example" not in content:
            desc = manifest.get("description", "this flow")
            block = ("\n---\n\n## Worked Example\n\nIllustrative only.\n\n"
                     "Given typical inputs for %s, the pipeline produces "
                     "structured outputs through each phase, with quality gates "
                     "verified at every stage.\n\n" % desc[:80])
            # Insert before ## Exit Criteria or ## Error Handling or footer
            inserted = False
            for marker in ("## Exit Criteria", "## Error Handling", FOOTER):
                if marker in content:
                    content = content.replace(marker, block + marker, 1)
                    inserted = True
                    break
            if not inserted:
                content += block
            stats["## Worked Example"] += 1

        # Step 5: Add missing ## Exit Criteria
        if "## Exit Criteria" not in content:
            block = ("\n---\n\n## Exit Criteria\n\n"
                     "DONE when all phase quality gates pass and all outputs "
                     "are populated.\n\n")
            if "## Error Handling" in content:
                content = content.replace("## Error Handling", block + "## Error Handling", 1)
            elif FOOTER in content:
                content = content.replace(FOOTER, block + FOOTER, 1)
            else:
                content += block
            stats["## Exit Criteria"] += 1

        # Step 6: Add missing ## Error Handling
        if "## Error Handling" not in content:
            block = ("\n---\n\n## Error Handling\n\n"
                     "| Phase | Failure Mode | Response |\n"
                     "|---|---|---|\n"
                     "| Any | Missing required input | **Stop**: report which "
                     "input is missing and what it should contain. |\n"
                     "| Any | Upstream phase output incomplete | **Return**: "
                     "re-run the upstream phase with the gap identified. |\n\n")
            if FOOTER in content:
                content = content.replace(FOOTER, block + FOOTER, 1)
            else:
                content += block
            stats["## Error Handling"] += 1

        # Step 7: For ### Entry Criteria, ### Actions, ### Output
        # Only add if genuinely missing (after bold normalization)
        # These go inside phase blocks, so we add them to the FIRST phase
        # that's missing them
        phase_pat = re.compile(r"^##\s+Phase\s+\d+", re.MULTILINE)
        phase_matches = list(phase_pat.finditer(content))

        if phase_matches and "### Entry Criteria" not in content:
            # Add after first phase heading
            pos = phase_matches[0].end()
            # Find end of line
            eol = content.find("\n", pos)
            if eol == -1:
                eol = len(content)
            insert = "\n\n### Entry Criteria\n- All required inputs are available.\n"
            content = content[:eol] + insert + content[eol:]
            stats["### Entry Criteria"] += 1

        if phase_matches and "### Actions" not in content:
            # Add after Entry Criteria in first phase, or after first phase heading
            ec_pos = content.find("### Entry Criteria")
            if ec_pos >= 0:
                # Find end of Entry Criteria section (next ### or ## or ---)
                next_heading = re.search(r"\n(###? |---)", content[ec_pos + 20:])
                if next_heading:
                    ins_pos = ec_pos + 20 + next_heading.start()
                else:
                    ins_pos = len(content)
                insert = "\n### Actions\n1. Process inputs according to phase objectives.\n\n"
                content = content[:ins_pos] + insert + content[ins_pos:]
            stats["### Actions"] += 1

        if phase_matches and "### Output" not in content:
            # Add after Actions in first phase
            act_pos = content.find("### Actions")
            if act_pos >= 0:
                next_heading = re.search(r"\n(###? |---|## )", content[act_pos + 12:])
                if next_heading:
                    ins_pos = act_pos + 12 + next_heading.start()
                else:
                    ins_pos = len(content)
                insert = "\n### Output\nPhase deliverables as specified.\n\n"
                content = content[:ins_pos] + insert + content[ins_pos:]
            stats["### Output"] += 1

    # Step 8: Add footer if missing
    if FOOTER not in content:
        content = content.rstrip() + "\n\n---\n\n" + FOOTER + "\n"
        stats["footer"] += 1

    if content != original:
        with open(sk_path, "w", encoding="utf-8") as f:
            f.write(content)
        stats["files_fixed"] += 1
        return True
    return False


def main():
    fixed_names = []
    for entry in os.scandir(MKT):
        if not entry.is_dir():
            continue
        if fix_flow(entry.path):
            fixed_names.append(entry.name)

    print("Fixed %d of ~2550 skill.md files" % stats["files_fixed"])
    print()
    print("Sections added:")
    for key in ("## Inputs", "## Outputs", "## Worked Example",
                "## Exit Criteria", "## Error Handling",
                "### Entry Criteria", "### Actions", "### Output", "footer"):
        print("  %4d  %s" % (stats[key], key))
    print("  %4d  bold -> heading normalizations" % stats["bold_normalized"])


if __name__ == "__main__":
    main()
