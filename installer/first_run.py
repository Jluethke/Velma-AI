"""
first_run.py
============

First-run setup for SkillChain standalone installation.

Detects Claude Code, injects MCP config, creates ~/.skillchain/,
copies marketplace data, verifies everything works, prints next steps.

Usage:
    python first_run.py           # Full setup
    python first_run.py --check   # Verify existing installation
    python first_run.py --uninstall  # Clean removal
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

# Ensure the repo root is importable
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def _ok(msg: str) -> None:
    print(f"  [OK]   {msg}")


def _warn(msg: str) -> None:
    print(f"  [WARN] {msg}")


def _fail(msg: str) -> None:
    print(f"  [FAIL] {msg}")


def _step(n: int, total: int, msg: str) -> None:
    print(f"  [{n}/{total}] {msg}")


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------

def detect_claude_code() -> bool:
    """Check if Claude Code is installed (has ~/.claude/ directory)."""
    claude_dir = Path.home() / ".claude"
    if claude_dir.is_dir():
        _ok("Claude Code detected (~/.claude/ exists)")
        return True

    # Check if the claude CLI is on PATH
    if shutil.which("claude"):
        _ok("Claude Code CLI found on PATH")
        return True

    _warn("Claude Code not detected — will create ~/.claude/ directory")
    return False


# ---------------------------------------------------------------------------
# Setup steps
# ---------------------------------------------------------------------------

def setup_skillchain_dir() -> Path:
    """Create ~/.skillchain/ with required subdirectories and config."""
    sc_dir = Path.home() / ".skillchain"
    for sub in ("skills", "state", "chains", "marketplace"):
        (sc_dir / sub).mkdir(parents=True, exist_ok=True)

    # Copy marketplace data from repo if available
    repo_marketplace = REPO_ROOT / "marketplace"
    dest_marketplace = sc_dir / "marketplace"

    if repo_marketplace.is_dir():
        # Count existing vs source
        src_skills = [d for d in repo_marketplace.iterdir() if d.is_dir() and d.name != "chains"]
        src_chains_dir = repo_marketplace / "chains"
        src_chains = list(src_chains_dir.glob("*.chain.json")) if src_chains_dir.is_dir() else []

        # Copy skill directories
        for skill_dir in src_skills:
            dest = dest_marketplace / skill_dir.name
            if not dest.exists():
                shutil.copytree(str(skill_dir), str(dest))

        # Copy chain files
        if src_chains_dir.is_dir():
            dest_chains = dest_marketplace / "chains"
            dest_chains.mkdir(exist_ok=True)
            for chain_file in src_chains:
                dest_file = dest_chains / chain_file.name
                if not dest_file.exists():
                    shutil.copy2(str(chain_file), str(dest_file))

        _ok(f"Marketplace: {len(src_skills)} skills, {len(src_chains)} chains")
    else:
        _warn("Marketplace data not found in repo — skills will be empty until pip install")

    # Write default config if not present
    config_path = sc_dir / "config.json"
    if not config_path.exists():
        config_path.write_text(json.dumps({
            "network": "sepolia",
            "node_id": "",
            "rpc_url": "https://sepolia.base.org",
            "ipfs_gateway": "https://gateway.pinata.cloud/ipfs/",
            "domain_tags": [],
        }, indent=2), encoding="utf-8")

    # Initialize trainer profile if not present
    trainer_path = sc_dir / "trainer.json"
    if not trainer_path.exists():
        trainer_path.write_text(json.dumps({
            "xp": 0, "level": 1, "title": "Novice",
            "skills_discovered": [], "chains_completed": [],
            "achievements_unlocked": {},
            "streak_current": 0, "streak_best": 0, "streak_last_date": "",
            "evolution_levels": {},
            "daily_runs_today": [], "daily_runs_date": "",
            "categories_today": [],
            "total_skill_runs": 0, "total_chain_runs": 0,
        }, indent=2), encoding="utf-8")

    return sc_dir


def inject_mcp_config() -> bool:
    """Run the safe MCP config injection."""
    from skillchain.sdk.mcp_bridge.claude_settings import (
        install_mcp_server,
        verify_dependencies,
    )

    # Verify dependencies first
    deps_ok, dep_msgs = verify_dependencies()
    for msg in dep_msgs:
        if deps_ok:
            _ok(msg)
        else:
            _fail(msg)

    if not deps_ok:
        return False

    try:
        settings_path = install_mcp_server()
        _ok(f"MCP config injected into {settings_path}")
        return True
    except Exception as exc:
        _fail(f"MCP config injection failed: {exc}")
        return False


def validate_setup() -> bool:
    """Run post-install validation."""
    from skillchain.sdk.mcp_bridge.claude_settings import validate_installation

    ok, messages = validate_installation()
    for msg in messages:
        if "WARNING" in msg or "failed" in msg.lower():
            _warn(msg)
        elif ok:
            _ok(msg)
        else:
            _fail(msg)
    return ok


# ---------------------------------------------------------------------------
# Main flows
# ---------------------------------------------------------------------------

def run_install() -> bool:
    """Full first-run installation."""
    print()
    print("  SkillChain — First Run Setup")
    print("  " + "=" * 35)
    print()

    total = 5
    errors = 0

    # Step 1: Detect Claude Code
    _step(1, total, "Detecting Claude Code...")
    detect_claude_code()

    # Step 2: Verify dependencies
    _step(2, total, "Checking dependencies...")
    from skillchain.sdk.mcp_bridge.claude_settings import verify_dependencies
    deps_ok, dep_msgs = verify_dependencies()
    for msg in dep_msgs:
        _ok(msg) if deps_ok else _fail(msg)
    if not deps_ok:
        errors += 1

    # Step 3: Create ~/.skillchain/ with marketplace data
    _step(3, total, "Setting up SkillChain directory...")
    try:
        sc_dir = setup_skillchain_dir()
        _ok(f"Directory ready: {sc_dir}")
    except Exception as exc:
        _fail(f"Directory setup failed: {exc}")
        errors += 1

    # Step 4: Inject MCP config into Claude Code settings
    _step(4, total, "Configuring Claude Code MCP server...")
    if not inject_mcp_config():
        errors += 1

    # Step 5: Validate everything
    _step(5, total, "Validating installation...")
    if not validate_setup():
        errors += 1

    # Summary
    print()
    if errors == 0:
        print("  " + "=" * 40)
        print("  Setup complete! Everything looks good.")
        print("  " + "=" * 40)
        print()
        print("  Next steps:")
        print("    1. Restart Claude Code (or any MCP-compatible AI)")
        print("    2. Talk to it normally — say things like:")
        print('       - "I hate my job"')
        print('       - "help me budget"')
        print('       - "I feel stuck"')
        print("    3. Claude will find the right skill chain and walk you through it")
        print()
        print("  Your AI just got 120+ skills and 65+ chains.")
        print("  No extra apps. No websites. Just talk.")
        print()
    else:
        print(f"  Setup completed with {errors} warning(s).")
        print("  SkillChain may still work — check the warnings above.")
        print()

    return errors == 0


def run_check() -> bool:
    """Verify an existing installation."""
    print()
    print("  SkillChain — Installation Check")
    print("  " + "=" * 35)
    print()

    from skillchain.sdk.mcp_bridge.claude_settings import is_installed

    # Check ~/.skillchain/
    sc_dir = Path.home() / ".skillchain"
    if sc_dir.is_dir():
        _ok(f"SkillChain directory: {sc_dir}")
        for sub in ("skills", "state", "chains", "marketplace"):
            if (sc_dir / sub).is_dir():
                _ok(f"  {sub}/ exists")
            else:
                _warn(f"  {sub}/ missing")
    else:
        _fail("~/.skillchain/ not found — run first_run.py to set up")
        return False

    # Check MCP config
    if is_installed():
        _ok("MCP server configured in Claude Code settings")
    else:
        _fail("MCP server not found in Claude Code settings")
        return False

    # Validate
    ok = validate_setup()

    print()
    if ok:
        print("  Installation is healthy.")
    else:
        print("  Issues found — re-run first_run.py to fix.")
    print()
    return ok


def run_uninstall() -> bool:
    """Clean removal of SkillChain from Claude Code."""
    print()
    print("  SkillChain — Uninstall")
    print("  " + "=" * 35)
    print()

    from skillchain.sdk.mcp_bridge.claude_settings import (
        uninstall_mcp_server,
        uninstall_claude_md,
    )

    # Remove MCP config
    if uninstall_mcp_server():
        _ok("Removed SkillChain from Claude Code MCP settings")
    else:
        _warn("SkillChain was not in Claude Code settings")

    # Remove CLAUDE.md block
    if uninstall_claude_md():
        _ok("Removed SkillChain instructions from CLAUDE.md")
    else:
        _warn("SkillChain instructions were not in CLAUDE.md")

    # Note: we do NOT delete ~/.skillchain/ — user may want to keep their data
    sc_dir = Path.home() / ".skillchain"
    if sc_dir.is_dir():
        print()
        print(f"  Note: ~/.skillchain/ was NOT deleted (contains your data).")
        print(f"  To fully remove, delete: {sc_dir}")

    print()
    print("  Uninstall complete. Restart Claude Code to apply.")
    print()
    return True


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="SkillChain first-run setup for Claude Code integration",
    )
    parser.add_argument(
        "--check", action="store_true",
        help="Verify existing installation without making changes",
    )
    parser.add_argument(
        "--uninstall", action="store_true",
        help="Remove SkillChain from Claude Code settings",
    )
    args = parser.parse_args()

    if args.uninstall:
        ok = run_uninstall()
    elif args.check:
        ok = run_check()
    else:
        ok = run_install()

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
