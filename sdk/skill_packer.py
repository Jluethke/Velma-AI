"""
skill_packer.py
===============

Creates, extracts, and validates ``.skillpack`` archives.

A .skillpack is a ZIP file containing::

    manifest.json       -- Skill metadata (name, version, domain, tags, etc.)
    skill.md            -- The skill content (Claude Code skill format)
    tests/
        test_cases.json -- Shadow validation test cases
    examples/           -- Optional usage examples
    provenance.json     -- Signed provenance chain (author, timestamps, hashes)

The packer handles creation, extraction, manifest validation, and
provenance signing/verification using SHA-256 chains.
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
import zipfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from .exceptions import PackingError, ValidationError

logger = logging.getLogger(__name__)

# Required fields in manifest.json
REQUIRED_MANIFEST_FIELDS = {
    "name", "version", "domain", "description",
}


@dataclass
class SkillManifest:
    """Metadata for a packaged skill.

    All fields are serialised into manifest.json inside the .skillpack.
    """
    name: str
    version: str
    domain: str
    description: str
    tags: list[str] = field(default_factory=list)
    inputs: list[str] = field(default_factory=list)
    outputs: list[str] = field(default_factory=list)
    price: int = 0  # in wei, 0 = free
    license: str = "MIT"
    min_shadow_count: int = 5
    graduation_threshold: float = 0.75
    author_node_id: str = ""
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to JSON-serialisable dict."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> SkillManifest:
        """Create from a dict (e.g. parsed JSON)."""
        known_fields = {f.name for f in cls.__dataclass_fields__.values()}
        filtered = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered)


@dataclass
class SkillPackContents:
    """Unpacked contents of a .skillpack archive."""
    manifest: SkillManifest
    skill_content: str
    test_cases: List[Dict[str, Any]]
    examples: Dict[str, str]  # filename -> content
    provenance: Dict[str, Any]
    root_dir: Path


def validate_manifest(manifest: Dict[str, Any]) -> List[str]:
    """Validate a manifest dict and return a list of error strings.

    Returns:
        Empty list if valid, otherwise list of human-readable error messages.
    """
    errors: List[str] = []

    for field_name in REQUIRED_MANIFEST_FIELDS:
        if field_name not in manifest or not manifest[field_name]:
            errors.append(f"Missing required field: {field_name}")

    if "version" in manifest:
        v = manifest["version"]
        parts = v.split(".")
        if len(parts) < 2:
            errors.append(f"Invalid version format: '{v}' (expected semver, e.g. 1.0.0)")

    if "domain" in manifest:
        d = manifest["domain"]
        if not d.replace("-", "").replace("_", "").isalnum():
            errors.append(f"Invalid domain: '{d}' (alphanumeric, hyphens, underscores only)")

    if "price" in manifest:
        try:
            p = int(manifest["price"])
            if p < 0:
                errors.append("Price must be non-negative")
        except (ValueError, TypeError):
            errors.append(f"Invalid price: '{manifest['price']}' (must be integer)")

    if "graduation_threshold" in manifest:
        try:
            t = float(manifest["graduation_threshold"])
            if not 0.0 <= t <= 1.0:
                errors.append("graduation_threshold must be between 0.0 and 1.0")
        except (ValueError, TypeError):
            errors.append(f"Invalid graduation_threshold: '{manifest['graduation_threshold']}'")

    return errors


def pack(
    skill_path: Path,
    manifest: SkillManifest,
    test_cases: Optional[List[Dict[str, Any]]] = None,
    examples_dir: Optional[Path] = None,
    output_dir: Optional[Path] = None,
    identity: Optional[Dict[str, Any]] = None,
) -> Path:
    """Create a .skillpack archive.

    Args:
        skill_path: Path to the skill.md file.
        manifest: Skill manifest data.
        test_cases: Optional list of test case dicts for shadow validation.
        examples_dir: Optional directory of example files to include.
        output_dir: Where to write the .skillpack (default: same dir as skill_path).
        identity: Optional identity dict for provenance signing.

    Returns:
        Path to the created .skillpack file.

    Raises:
        PackingError: If the skill file doesn't exist or packing fails.
    """
    if not skill_path.exists():
        raise PackingError(f"Skill file not found: {skill_path}")

    skill_content = skill_path.read_text(encoding="utf-8")

    # Validate manifest
    errors = validate_manifest(manifest.to_dict())
    if errors:
        raise ValidationError(f"Invalid manifest: {'; '.join(errors)}")

    # Determine output path
    out_dir = output_dir or skill_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    safe_name = manifest.name.replace(" ", "_").lower()
    pack_path = out_dir / f"{safe_name}-{manifest.version}.skillpack"

    # Build provenance
    content_hash = hashlib.sha256(skill_content.encode()).hexdigest()
    provenance = sign_provenance(identity or {}, manifest, content_hash)

    try:
        with zipfile.ZipFile(pack_path, "w", zipfile.ZIP_DEFLATED) as zf:
            # Manifest
            zf.writestr("manifest.json", json.dumps(manifest.to_dict(), indent=2))

            # Skill content
            zf.writestr("skill.md", skill_content)

            # Test cases
            cases = test_cases or []
            zf.writestr("tests/test_cases.json", json.dumps(cases, indent=2))

            # Examples
            if examples_dir and examples_dir.is_dir():
                for ex_file in sorted(examples_dir.iterdir()):
                    if ex_file.is_file():
                        zf.writestr(
                            f"examples/{ex_file.name}",
                            ex_file.read_text(encoding="utf-8"),
                        )

            # Provenance
            zf.writestr("provenance.json", json.dumps(provenance, indent=2))

    except Exception as exc:
        raise PackingError(f"Failed to create .skillpack: {exc}") from exc

    logger.info("Packed skill '%s' -> %s", manifest.name, pack_path)
    return pack_path


def unpack(path: Path, target: Optional[Path] = None) -> SkillPackContents:
    """Extract and parse a .skillpack archive.

    Args:
        path: Path to the .skillpack file.
        target: Directory to extract into (default: temp dir alongside the file).

    Returns:
        SkillPackContents with parsed manifest, skill, tests, examples, provenance.

    Raises:
        PackingError: If the archive is invalid or corrupt.
    """
    if not path.exists():
        raise PackingError(f"Skillpack not found: {path}")

    if not zipfile.is_zipfile(path):
        raise PackingError(f"Not a valid ZIP archive: {path}")

    extract_dir = target or path.parent / f".{path.stem}_unpacked"
    extract_dir.mkdir(parents=True, exist_ok=True)

    try:
        with zipfile.ZipFile(path, "r") as zf:
            # Security: reject paths that escape the extraction directory
            # (zip slip attack). Check both string patterns AND canonical paths.
            extract_dir_resolved = extract_dir.resolve()
            for member in zf.namelist():
                if ".." in member or member.startswith("/") or member.startswith("\\"):
                    raise PackingError(f"Unsafe path in archive: {member}")
                # Resolve the full target path and ensure it stays within extract_dir
                target = (extract_dir / member).resolve()
                if not str(target).startswith(str(extract_dir_resolved)):
                    raise PackingError(f"Path traversal detected in archive: {member}")
            zf.extractall(extract_dir)
    except zipfile.BadZipFile as exc:
        raise PackingError(f"Corrupt .skillpack: {exc}") from exc

    # Parse manifest
    manifest_path = extract_dir / "manifest.json"
    if not manifest_path.exists():
        raise PackingError("Missing manifest.json in .skillpack")

    manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest = SkillManifest.from_dict(manifest_data)

    # Read skill content
    skill_path = extract_dir / "skill.md"
    skill_content = skill_path.read_text(encoding="utf-8") if skill_path.exists() else ""

    # Read test cases
    test_path = extract_dir / "tests" / "test_cases.json"
    test_cases = []
    if test_path.exists():
        test_cases = json.loads(test_path.read_text(encoding="utf-8"))

    # Read examples
    examples: Dict[str, str] = {}
    examples_dir = extract_dir / "examples"
    if examples_dir.is_dir():
        for ex_file in sorted(examples_dir.iterdir()):
            if ex_file.is_file():
                examples[ex_file.name] = ex_file.read_text(encoding="utf-8")

    # Read provenance
    prov_path = extract_dir / "provenance.json"
    provenance = {}
    if prov_path.exists():
        provenance = json.loads(prov_path.read_text(encoding="utf-8"))

    return SkillPackContents(
        manifest=manifest,
        skill_content=skill_content,
        test_cases=test_cases,
        examples=examples,
        provenance=provenance,
        root_dir=extract_dir,
    )


def sign_provenance(
    identity: Dict[str, Any],
    manifest: SkillManifest,
    content_hash: str,
) -> Dict[str, Any]:
    """Create a provenance record with SHA-256 chain signature.

    Args:
        identity: Node identity dict (node_id, wallet_address, etc.).
        manifest: The skill manifest.
        content_hash: SHA-256 hex digest of the skill content.

    Returns:
        Provenance dict with author info, timestamps, and chain hash.
    """
    timestamp = time.time()
    chain_input = (
        f"{identity.get('node_id', 'anonymous')}:"
        f"{manifest.name}:{manifest.version}:"
        f"{content_hash}:{timestamp}"
    )
    chain_hash = hashlib.sha256(chain_input.encode()).hexdigest()

    return {
        "author_node_id": identity.get("node_id", "anonymous"),
        "author_wallet": identity.get("wallet_address", ""),
        "skill_name": manifest.name,
        "skill_version": manifest.version,
        "content_hash": content_hash,
        "created_at": timestamp,
        "chain_hash": chain_hash,
        "chain_input_format": "node_id:name:version:content_hash:timestamp",
    }


def verify_provenance(provenance: Dict[str, Any]) -> bool:
    """Verify a provenance chain hash.

    Args:
        provenance: Provenance dict (as produced by sign_provenance).

    Returns:
        True if the chain hash is valid.
    """
    try:
        chain_input = (
            f"{provenance['author_node_id']}:"
            f"{provenance['skill_name']}:{provenance['skill_version']}:"
            f"{provenance['content_hash']}:{provenance['created_at']}"
        )
        expected = hashlib.sha256(chain_input.encode()).hexdigest()
        return expected == provenance.get("chain_hash", "")
    except (KeyError, TypeError):
        return False
