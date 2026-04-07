# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY

"""
agent_skills_importer.py
========================

Imports Anthropic Agent Skills (SKILL.md format) into the SkillChain
ecosystem, upgrading them with structured execution patterns, quality
gates, typed I/O contracts, and governance hooks.

Anthropic's Agent Skills spec defines a minimal format:
    SKILL.md with YAML frontmatter (name, description, license, metadata)
    + optional scripts/, references/, assets/ directories

SkillChain requires:
    manifest.json  — structured metadata with typed inputs/outputs,
                     execution pattern, domain, graduation thresholds
    skill.md       — procedural instructions with phases, quality gates,
                     error handling, exit criteria
    provenance.json — creator, origin, timestamps
    tests/test_cases.json — validation test cases

This importer bridges the gap: it parses SKILL.md frontmatter,
infers missing fields, scaffolds quality gates, and flags what
needs manual review before the skill can be trusted.

Imported skills start at graduation_threshold 0.0 (untrusted)
until validated through the SkillChain shadow runner.

The Wayfinder Trust / Northstar Systems Group
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import shutil
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("skillchain.sdk.agent_skills_importer")

# Domain inference keywords
DOMAIN_KEYWORDS: Dict[str, List[str]] = {
    "developer": ["code", "debug", "test", "deploy", "api", "git", "docker", "build", "ci", "cd", "refactor", "lint", "compile"],
    "productivity": ["plan", "schedule", "organize", "task", "todo", "calendar", "meeting", "time"],
    "content": ["write", "blog", "article", "copy", "email", "newsletter", "social media", "content"],
    "business": ["business", "strategy", "market", "revenue", "pricing", "sales", "startup", "launch"],
    "career": ["resume", "interview", "job", "career", "salary", "negotiate", "hire"],
    "money": ["budget", "finance", "invest", "tax", "savings", "debt", "money", "expense"],
    "health": ["health", "fitness", "exercise", "meal", "nutrition", "sleep", "wellness", "mental"],
    "life": ["decision", "habit", "goal", "life", "relationship", "move", "travel"],
    "data": ["data", "csv", "json", "sql", "database", "analytics", "dashboard", "report"],
    "onboarding": ["setup", "install", "configure", "getting started", "tutorial", "guide"],
    "meta": ["skill", "chain", "orchestrat", "pipeline", "workflow", "automat"],
}

# Execution pattern detection
ORPA_INDICATORS = [
    r"##?\s*(observe|reason|plan|act)\b",
    r"orpa",
    r"observe.+reason.+plan.+act",
]

PHASE_PIPELINE_INDICATORS = [
    r"##?\s*(phase|step)\s*\d",
    r"phase\s+pipeline",
    r"step\s+\d\s*:",
]


@dataclass
class ImportReport:
    """Report of what was imported and what needs attention."""
    skill_name: str
    source_format: str
    imported_fields: List[str]
    inferred_fields: Dict[str, str]  # field -> inference reason
    manual_review_needed: List[str]
    warnings: List[str]
    output_dir: str
    success: bool

    def to_dict(self) -> Dict[str, Any]:
        return {
            "skill_name": self.skill_name,
            "source_format": self.source_format,
            "imported_fields": self.imported_fields,
            "inferred_fields": self.inferred_fields,
            "manual_review_needed": self.manual_review_needed,
            "warnings": self.warnings,
            "output_dir": self.output_dir,
            "success": self.success,
        }


class AgentSkillsImporter:
    """
    Imports Anthropic Agent Skills into SkillChain format.

    Parses SKILL.md with YAML frontmatter, generates manifest.json,
    scaffolds quality gates, and produces an import report detailing
    what was auto-inferred vs what needs manual review.

    Usage:
        importer = AgentSkillsImporter()

        # Import a single skill
        report = importer.import_skill("./my-agent-skill", "./marketplace")
        print(report.manual_review_needed)

        # Batch import
        reports = importer.import_directory("./agent-skills", "./marketplace")

        # Validate after import
        issues = importer.validate_import("./marketplace/my-agent-skill")
    """

    def __init__(self, default_domain: str = "general"):
        self._default_domain = default_domain

    # --------------------------------------------------------
    # YAML Frontmatter Parsing
    # --------------------------------------------------------

    @staticmethod
    def _parse_skill_md(content: str) -> Tuple[Dict[str, Any], str]:
        """
        Parse SKILL.md into frontmatter dict and markdown body.

        Handles YAML frontmatter delimited by --- fences.
        """
        content = content.strip()

        if not content.startswith("---"):
            return {}, content

        # Find closing ---
        end_idx = content.find("---", 3)
        if end_idx == -1:
            return {}, content

        yaml_block = content[3:end_idx].strip()
        body = content[end_idx + 3:].strip()

        # Simple YAML parser (handles the Agent Skills spec fields)
        frontmatter: Dict[str, Any] = {}
        current_key = ""
        current_map: Optional[Dict[str, str]] = None

        for line in yaml_block.split("\n"):
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue

            # Detect map values (indented under a key)
            if line.startswith("  ") and current_map is not None and ":" in stripped:
                k, v = stripped.split(":", 1)
                current_map[k.strip()] = v.strip().strip('"').strip("'")
                continue
            else:
                if current_map is not None and current_key:
                    frontmatter[current_key] = current_map
                current_map = None

            if ":" not in stripped:
                continue

            key, value = stripped.split(":", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            if not value:
                # Could be a map
                current_key = key
                current_map = {}
                continue

            frontmatter[key] = value

        # Flush last map
        if current_map is not None and current_key:
            frontmatter[current_key] = current_map

        return frontmatter, body

    # --------------------------------------------------------
    # Field Inference
    # --------------------------------------------------------

    def _infer_domain(self, description: str, body: str) -> Tuple[str, str]:
        """Infer domain from description and body text."""
        text = (description + " " + body).lower()

        scores: Dict[str, int] = {}
        for domain, keywords in DOMAIN_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text)
            if score > 0:
                scores[domain] = score

        if scores:
            best = max(scores, key=scores.get)
            return best, f"Inferred from keyword matches: {scores[best]} hits for '{best}'"

        return self._default_domain, "No keyword matches — using default"

    @staticmethod
    def _extract_tags(description: str) -> List[str]:
        """Extract meaningful tags from description."""
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
            "for", "of", "with", "by", "from", "is", "are", "was", "were",
            "be", "been", "being", "have", "has", "had", "do", "does", "did",
            "will", "would", "could", "should", "may", "might", "can", "shall",
            "this", "that", "these", "those", "it", "its", "you", "your",
            "use", "when", "what", "how", "which", "who", "where", "why",
            "all", "each", "every", "any", "some", "no", "not", "only",
        }

        words = re.findall(r"[a-z]+", description.lower())
        meaningful = [w for w in words if w not in stop_words and len(w) > 2]

        # Deduplicate preserving order
        seen = set()
        tags = []
        for w in meaningful:
            if w not in seen:
                seen.add(w)
                tags.append(w)

        return tags[:10]

    @staticmethod
    def _detect_execution_pattern(body: str) -> Tuple[str, str]:
        """Detect execution pattern from body content."""
        body_lower = body.lower()

        for pattern in ORPA_INDICATORS:
            if re.search(pattern, body_lower):
                return "orpa", f"Detected ORPA pattern: '{pattern}'"

        for pattern in PHASE_PIPELINE_INDICATORS:
            if re.search(pattern, body_lower):
                return "phase_pipeline", f"Detected Phase Pipeline pattern: '{pattern}'"

        return "phase_pipeline", "No pattern detected — defaulting to phase_pipeline"

    @staticmethod
    def _parse_io_from_body(body: str) -> Tuple[List[str], List[str], str]:
        """Try to extract inputs/outputs from markdown body."""
        inputs = []
        outputs = []
        notes = ""

        # Look for ## Inputs / ## Outputs sections
        input_match = re.search(r"##\s*Inputs?\s*\n(.*?)(?=\n##|\Z)", body, re.DOTALL | re.IGNORECASE)
        if input_match:
            for line in input_match.group(1).split("\n"):
                line = line.strip()
                if line.startswith("- ") or line.startswith("* "):
                    field_name = line[2:].split(":")[0].split("—")[0].split("-")[0].strip()
                    field_name = re.sub(r"[^a-z0-9_]", "_", field_name.lower()).strip("_")
                    if field_name and len(field_name) > 1:
                        inputs.append(field_name)

        output_match = re.search(r"##\s*Outputs?\s*\n(.*?)(?=\n##|\Z)", body, re.DOTALL | re.IGNORECASE)
        if output_match:
            for line in output_match.group(1).split("\n"):
                line = line.strip()
                if line.startswith("- ") or line.startswith("* "):
                    field_name = line[2:].split(":")[0].split("—")[0].split("-")[0].strip()
                    field_name = re.sub(r"[^a-z0-9_]", "_", field_name.lower()).strip("_")
                    if field_name and len(field_name) > 1:
                        outputs.append(field_name)

        if not inputs and not outputs:
            notes = "No structured inputs/outputs found — manual review required"

        return inputs, outputs, notes

    # --------------------------------------------------------
    # Quality Gate Scaffolding
    # --------------------------------------------------------

    @staticmethod
    def _scaffold_quality_gates(body: str) -> str:
        """Add quality gate scaffolding if missing from skill body."""
        additions = []

        # Check for error handling
        if not re.search(r"##\s*Error\s*Handling", body, re.IGNORECASE):
            additions.append("""
## Error Handling

> **TODO**: Define error handling for this skill.

| Phase | Failure Mode | Response |
|-------|-------------|----------|
| *all* | *undefined* | *needs definition* |
""")

        # Check for exit criteria
        if not re.search(r"##\s*Exit\s*Criteria", body, re.IGNORECASE):
            additions.append("""
## Exit Criteria

> **TODO**: Define exit criteria for this skill.

Done when: *(needs definition)*
""")

        if additions:
            body = body.rstrip() + "\n\n---\n" + "\n".join(additions)

        return body

    # --------------------------------------------------------
    # Import Single Skill
    # --------------------------------------------------------

    def import_skill(
        self,
        skill_dir: str,
        output_dir: Optional[str] = None,
    ) -> ImportReport:
        """
        Import an Anthropic Agent Skills directory into SkillChain format.

        Parameters
        ----------
        skill_dir : str
            Path to directory containing SKILL.md
        output_dir : str, optional
            Where to write the SkillChain skill. Defaults to skill_dir.

        Returns
        -------
        ImportReport
            Details of what was imported, inferred, and needs review.
        """
        skill_path = Path(skill_dir)
        skill_md_path = skill_path / "SKILL.md"

        if not skill_md_path.exists():
            return ImportReport(
                skill_name=skill_path.name,
                source_format="agent_skills",
                imported_fields=[],
                inferred_fields={},
                manual_review_needed=["SKILL.md not found"],
                warnings=["Cannot import: no SKILL.md in directory"],
                output_dir=str(skill_dir),
                success=False,
            )

        # Parse SKILL.md
        content = skill_md_path.read_text(encoding="utf-8")
        frontmatter, body = self._parse_skill_md(content)

        imported_fields = []
        inferred_fields = {}
        review_needed = []
        warnings = []

        # --- Extract fields ---
        name = frontmatter.get("name", skill_path.name)
        imported_fields.append("name")

        description = frontmatter.get("description", "")
        if not description:
            description = f"Imported skill: {name}"
            inferred_fields["description"] = "No description in frontmatter — using name"
            review_needed.append("Add a proper description")
        else:
            imported_fields.append("description")

        license_val = frontmatter.get("license", "Unknown")
        if "license" in frontmatter:
            imported_fields.append("license")

        metadata = frontmatter.get("metadata", {})
        if isinstance(metadata, dict):
            imported_fields.append("metadata")

        version = "1.0.0"
        if isinstance(metadata, dict) and "version" in metadata:
            version = metadata["version"]
            imported_fields.append("version")
        else:
            inferred_fields["version"] = "Defaulted to 1.0.0"

        # Infer domain
        domain, domain_reason = self._infer_domain(description, body)
        inferred_fields["domain"] = domain_reason
        review_needed.append(f"Verify inferred domain: '{domain}'")

        # Extract tags
        tags = self._extract_tags(description)
        inferred_fields["tags"] = f"Extracted {len(tags)} tags from description"

        # Detect execution pattern
        exec_pattern, pattern_reason = self._detect_execution_pattern(body)
        inferred_fields["execution_pattern"] = pattern_reason
        review_needed.append(f"Verify execution pattern: '{exec_pattern}'")

        # Parse I/O
        inputs, outputs, io_notes = self._parse_io_from_body(body)
        if io_notes:
            review_needed.append(io_notes)
            inferred_fields["inputs"] = "Could not parse — empty"
            inferred_fields["outputs"] = "Could not parse — empty"
        else:
            imported_fields.extend(["inputs", "outputs"])

        # --- Build manifest ---
        manifest = {
            "name": name,
            "version": version,
            "domain": domain,
            "description": description[:1024],
            "tags": tags,
            "inputs": inputs,
            "outputs": outputs,
            "execution_pattern": exec_pattern,
            "price": 0,
            "license": license_val,
            "min_shadow_count": 5,
            "graduation_threshold": 0.0,  # Untrusted until validated
            "imported_from": "anthropic_agent_skills",
            "import_date": time.time(),
        }

        # --- Build skill.md ---
        governance_notice = (
            "> **Governance Notice**: This skill was imported from the Anthropic Agent Skills format.\n"
            "> Quality gates, typed I/O contracts, and test cases need manual review.\n"
            "> Until validated, this skill operates at graduation_threshold 0.0 (untrusted).\n"
            "> Run `skillchain validate {name}` to check compliance.\n"
        )

        skill_body = governance_notice + "\n" + self._scaffold_quality_gates(body)

        # --- Build provenance ---
        author = "unknown"
        if isinstance(metadata, dict):
            author = metadata.get("author", "unknown")

        provenance = {
            "creator": author,
            "creator_node": "imported",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "origin": "Imported from Anthropic Agent Skills format",
            "source_directory": str(skill_path),
            "import_timestamp": time.time(),
        }

        # --- Build test scaffold ---
        test_cases = [
            {
                "input": f"[TODO: Add test input for {name}]",
                "expected_keywords": ["[TODO: Add expected keywords]"],
                "_note": "Test cases must be defined before this skill can graduate",
            }
        ]

        # --- Write output ---
        out_path = Path(output_dir or skill_dir) / name
        out_path.mkdir(parents=True, exist_ok=True)

        (out_path / "manifest.json").write_text(
            json.dumps(manifest, indent=2, default=str), encoding="utf-8"
        )
        (out_path / "skill.md").write_text(skill_body, encoding="utf-8")
        (out_path / "provenance.json").write_text(
            json.dumps(provenance, indent=2), encoding="utf-8"
        )

        tests_dir = out_path / "tests"
        tests_dir.mkdir(exist_ok=True)
        (tests_dir / "test_cases.json").write_text(
            json.dumps(test_cases, indent=2), encoding="utf-8"
        )

        # Copy scripts/, references/, assets/ if they exist
        for subdir in ["scripts", "references", "assets"]:
            src = skill_path / subdir
            if src.exists() and src.is_dir():
                dst = out_path / subdir
                if dst.exists():
                    shutil.rmtree(dst)
                shutil.copytree(src, dst)
                imported_fields.append(f"{subdir}/")

        # Always need review on these
        review_needed.append("Write test cases in tests/test_cases.json")
        review_needed.append("Define typed inputs/outputs if not auto-detected")
        review_needed.append("Add quality gates to each execution phase")

        report = ImportReport(
            skill_name=name,
            source_format="anthropic_agent_skills",
            imported_fields=imported_fields,
            inferred_fields=inferred_fields,
            manual_review_needed=review_needed,
            warnings=warnings,
            output_dir=str(out_path),
            success=True,
        )

        logger.info("Imported skill '%s' from Agent Skills format -> %s", name, out_path)
        return report

    # --------------------------------------------------------
    # Batch Import
    # --------------------------------------------------------

    def import_directory(
        self,
        agent_skills_dir: str,
        output_dir: str,
    ) -> List[ImportReport]:
        """
        Batch import all Agent Skills from a directory.

        Scans for subdirectories containing SKILL.md files.
        """
        reports = []
        source = Path(agent_skills_dir)

        if not source.exists():
            logger.error("Source directory does not exist: %s", agent_skills_dir)
            return reports

        for entry in sorted(source.iterdir()):
            if entry.is_dir() and (entry / "SKILL.md").exists():
                report = self.import_skill(str(entry), output_dir)
                reports.append(report)
                status = "OK" if report.success else "FAILED"
                logger.info("  [%s] %s", status, entry.name)

        logger.info(
            "Batch import complete: %d skills (%d successful)",
            len(reports),
            sum(1 for r in reports if r.success),
        )
        return reports

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------

    def validate_import(self, skill_dir: str) -> Dict[str, Any]:
        """
        Validate an imported skill against SkillChain quality standards.

        Returns a dict of issues found and overall quality score.
        """
        path = Path(skill_dir)
        issues = []
        score = 1.0

        # Check required files
        if not (path / "manifest.json").exists():
            issues.append({"severity": "critical", "issue": "Missing manifest.json"})
            score -= 0.3
        else:
            manifest = json.loads((path / "manifest.json").read_text(encoding="utf-8"))

            required = {"name", "version", "domain", "description"}
            missing = required - set(manifest.keys())
            if missing:
                issues.append({"severity": "critical", "issue": f"Missing manifest fields: {missing}"})
                score -= 0.2

            if not manifest.get("inputs"):
                issues.append({"severity": "warning", "issue": "No typed inputs defined"})
                score -= 0.1

            if not manifest.get("outputs"):
                issues.append({"severity": "warning", "issue": "No typed outputs defined"})
                score -= 0.1

            if manifest.get("graduation_threshold", 0) == 0:
                issues.append({"severity": "info", "issue": "Skill is untrusted (graduation_threshold=0.0)"})

        if not (path / "skill.md").exists():
            issues.append({"severity": "critical", "issue": "Missing skill.md"})
            score -= 0.3
        else:
            skill_content = (path / "skill.md").read_text(encoding="utf-8")

            if "TODO" in skill_content:
                issues.append({"severity": "warning", "issue": "skill.md contains TODO items"})
                score -= 0.1

            if not re.search(r"##\s*(OBSERVE|REASON|PLAN|ACT|Phase\s+\d)", skill_content, re.IGNORECASE):
                issues.append({"severity": "warning", "issue": "No structured execution phases detected"})
                score -= 0.1

        if not (path / "tests" / "test_cases.json").exists():
            issues.append({"severity": "warning", "issue": "No test cases defined"})
            score -= 0.1
        else:
            tests = json.loads((path / "tests" / "test_cases.json").read_text(encoding="utf-8"))
            real_tests = [t for t in tests if "TODO" not in json.dumps(t)]
            if not real_tests:
                issues.append({"severity": "warning", "issue": "All test cases are scaffolds (contain TODO)"})
                score -= 0.1

        if not (path / "provenance.json").exists():
            issues.append({"severity": "info", "issue": "Missing provenance.json"})

        score = max(0.0, score)

        return {
            "skill_dir": str(path),
            "skill_name": path.name,
            "issues": issues,
            "quality_score": round(score, 2),
            "ready_for_graduation": score >= 0.75 and not any(i["severity"] == "critical" for i in issues),
            "issue_count": len(issues),
        }


# ============================================================
# CLI Entry Point
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Import Anthropic Agent Skills into SkillChain format",
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to Agent Skills directory (single skill or directory of skills)",
    )
    parser.add_argument(
        "--output", "-o",
        required=True,
        help="Path to output SkillChain marketplace directory",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate imported skills after import",
    )

    args = parser.parse_args()
    importer = AgentSkillsImporter()

    input_path = Path(args.input)

    if (input_path / "SKILL.md").exists():
        # Single skill
        report = importer.import_skill(args.input, args.output)
        print(json.dumps(report.to_dict(), indent=2))

        if args.validate and report.success:
            validation = importer.validate_import(report.output_dir)
            print("\n--- Validation ---")
            print(json.dumps(validation, indent=2))
    else:
        # Directory of skills
        reports = importer.import_directory(args.input, args.output)
        for report in reports:
            status = "OK" if report.success else "FAIL"
            print(f"[{status}] {report.skill_name}")
            if report.manual_review_needed:
                for item in report.manual_review_needed:
                    print(f"  - {item}")

            if args.validate and report.success:
                validation = importer.validate_import(report.output_dir)
                print(f"  Quality: {validation['quality_score']:.0%} | Issues: {validation['issue_count']}")

        total = len(reports)
        ok = sum(1 for r in reports if r.success)
        print(f"\n{ok}/{total} skills imported successfully")


if __name__ == "__main__":
    main()
