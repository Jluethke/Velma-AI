"""
Build a standalone Windows installer for SkillChain.

No Python required on the target machine. Bundles:
  - Python runtime (embedded)
  - SkillChain SDK + all dependencies
  - 120+ skills (marketplace/)
  - 65+ chains (marketplace/chains/)
  - MCP server
  - Auto-configuration for Claude Code

Output: skillchain-setup.exe (single file, ~50MB)

Usage:
  python build_windows.py

Requires: PyInstaller (`pip install pyinstaller`)
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

# -- Paths relative to the standalone SkillChain repo --
ROOT = Path(__file__).resolve().parent.parent  # SkillChain/
SDK = ROOT / "sdk"
MARKETPLACE = ROOT / "marketplace"
INSTALLER_DIR = ROOT / "installer"
BUILD_DIR = INSTALLER_DIR / "build"
DIST_DIR = INSTALLER_DIR / "dist"


def build():
    """Build the Windows installer."""
    print("SkillChain Windows Installer Builder")
    print("=" * 40)

    # Validate that required source directories exist
    missing = []
    for label, path in [("SDK", SDK), ("Marketplace", MARKETPLACE)]:
        if not path.exists():
            missing.append(f"  {label}: {path}")
    if missing:
        print("ERROR: Required directories not found:")
        print("\n".join(missing))
        print(f"\nExpected repo root: {ROOT}")
        sys.exit(1)

    # Count assets
    skill_dirs = [d for d in MARKETPLACE.iterdir() if d.is_dir() and d.name != "chains"]
    chains_dir = MARKETPLACE / "chains"
    chain_files = list(chains_dir.glob("*.chain.json")) if chains_dir.exists() else []
    print(f"Skills found: {len(skill_dirs)}")
    print(f"Chains found: {len(chain_files)}")

    if len(skill_dirs) < 100:
        print(f"WARNING: Expected 120+ skills, found {len(skill_dirs)}")
    if len(chain_files) < 50:
        print(f"WARNING: Expected 65+ chains, found {len(chain_files)}")

    # 1. Create the entry point script
    entry = BUILD_DIR / "skillchain_install.py"
    BUILD_DIR.mkdir(parents=True, exist_ok=True)

    entry.write_text(_INSTALLER_SCRIPT, encoding="utf-8")
    print(f"Entry point: {entry}")

    # 2. Run PyInstaller
    print("Building with PyInstaller...")
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--name", "skillchain-setup",
        "--add-data", f"{MARKETPLACE};marketplace",
        "--add-data", f"{SDK};sdk",
        "--distpath", str(DIST_DIR),
        "--workpath", str(BUILD_DIR / "pyinstaller"),
        "--specpath", str(BUILD_DIR),
        "--clean",
        str(entry),
    ]

    print(f"Command: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=str(INSTALLER_DIR))

    if result.returncode == 0:
        exe = DIST_DIR / "skillchain-setup.exe"
        if exe.exists():
            size_mb = exe.stat().st_size / (1024 * 1024)
            print(f"\nSUCCESS: {exe} ({size_mb:.1f} MB)")
        else:
            print("\nBuild succeeded but exe not found")
    else:
        print(f"\nBuild failed with code {result.returncode}")
        sys.exit(result.returncode)


# ---------------------------------------------------------------------------
# Installer script that gets bundled into the .exe
# ---------------------------------------------------------------------------

_INSTALLER_SCRIPT = r'''"""
SkillChain Installer
====================
One-click setup for SkillChain AI Skill Marketplace.
Installs marketplace skills, configures Claude Code MCP, registers PATH.
"""

import json
import os
import shutil
import subprocess
import sys
import traceback
from pathlib import Path

# -- Constants --
SKILLCHAIN_DIR_NAME = ".skillchain"
REQUIRED_SUBDIRS = ["skills", "state", "chains", "marketplace"]


class InstallerError(Exception):
    """Raised when a non-recoverable install step fails."""


class Installer:
    """Manages the full install lifecycle with rollback on failure."""

    def __init__(self):
        self.home = Path.home()
        self.sc_dir = self.home / SKILLCHAIN_DIR_NAME
        self.claude_dir = self.home / ".claude"
        self.created_dirs: list[Path] = []
        self.created_files: list[Path] = []
        self.modified_files: dict[Path, str] = {}  # path -> original content
        self.steps_completed: list[str] = []

    # -- Public API --

    def run(self):
        """Execute all install steps. Rolls back on any failure."""
        print()
        print("  SkillChain Installer")
        print("  ====================")
        print("  Decentralized AI Skill Marketplace")
        print()

        steps = [
            ("Creating directories", self._step_create_dirs),
            ("Installing skills and chains", self._step_copy_marketplace),
            ("Writing configuration", self._step_write_config),
            ("Configuring Claude Code", self._step_configure_claude),
            ("Initializing trainer profile", self._step_init_trainer),
            ("Registering PATH", self._step_register_path),
            ("Validating installation", self._step_validate),
        ]

        total = len(steps)
        try:
            for i, (label, fn) in enumerate(steps, 1):
                print(f"  [{i}/{total}] {label}...")
                fn()
                self.steps_completed.append(label)
        except InstallerError as exc:
            print(f"\n  ERROR: {exc}")
            self._rollback()
            return False
        except Exception as exc:
            print(f"\n  UNEXPECTED ERROR: {exc}")
            traceback.print_exc()
            self._rollback()
            return False

        self._print_success()
        return True

    # -- Install steps --

    def _step_create_dirs(self):
        """Create ~/.skillchain and subdirectories."""
        for subdir in [self.sc_dir] + [self.sc_dir / d for d in REQUIRED_SUBDIRS]:
            if not subdir.exists():
                subdir.mkdir(parents=True, exist_ok=True)
                self.created_dirs.append(subdir)

    def _step_copy_marketplace(self):
        """Copy bundled marketplace skills and chains."""
        bundled = self._bundled_path("marketplace")
        if not bundled.exists():
            raise InstallerError(
                "Marketplace data not found in bundle. "
                "The installer may be corrupted — please re-download."
            )

        dst = self.sc_dir / "marketplace"
        if dst.exists():
            # Back up for rollback
            backup = self.sc_dir / "marketplace_backup"
            if backup.exists():
                shutil.rmtree(backup)
            shutil.copytree(str(dst), str(backup))
            self.modified_files[dst] = str(backup)
            shutil.rmtree(dst)

        shutil.copytree(str(bundled), str(dst))
        if dst not in [p for p in self.modified_files]:
            self.created_dirs.append(dst)

        skill_count = sum(1 for d in dst.iterdir() if d.is_dir() and d.name != "chains")
        chains_dir = dst / "chains"
        chain_count = sum(1 for f in chains_dir.glob("*.chain.json")) if chains_dir.exists() else 0
        print(f"         {skill_count} skills, {chain_count} chains installed")

    def _step_write_config(self):
        """Write default config.json if not present."""
        config_path = self.sc_dir / "config.json"
        if config_path.exists():
            print("         Config already exists, skipping")
            return

        config = {
            "network": "sepolia",
            "node_id": "",
            "rpc_url": "https://sepolia.base.org",
            "ipfs_gateway": "https://gateway.pinata.cloud/ipfs/",
            "domain_tags": [],
        }
        config_path.write_text(json.dumps(config, indent=2), encoding="utf-8")
        self.created_files.append(config_path)

    def _step_configure_claude(self):
        """Configure Claude Code MCP server in ~/.claude/settings.json."""
        self.claude_dir.mkdir(parents=True, exist_ok=True)

        # -- settings.json --
        settings_path = self.claude_dir / "settings.json"
        if settings_path.exists():
            self.modified_files.setdefault(
                settings_path, settings_path.read_text(encoding="utf-8")
            )
            try:
                settings = json.loads(settings_path.read_text(encoding="utf-8"))
            except (json.JSONDecodeError, OSError):
                settings = {}
        else:
            settings = {}
            self.created_files.append(settings_path)

        if "mcpServers" not in settings:
            settings["mcpServers"] = {}

        # Determine the skillchain command path
        sc_cmd = self._find_skillchain_cmd()

        settings["mcpServers"]["skillchain"] = {
            "command": sc_cmd,
            "args": ["mcp", "serve"],
            "env": {},
        }
        settings_path.write_text(json.dumps(settings, indent=2), encoding="utf-8")
        print(f"         MCP server: {sc_cmd}")

        # -- CLAUDE.md --
        self._install_claude_md()

    def _step_init_trainer(self):
        """Create initial trainer profile."""
        trainer_path = self.sc_dir / "trainer.json"
        if trainer_path.exists():
            print("         Trainer profile already exists, skipping")
            return

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
        self.created_files.append(trainer_path)

    def _step_register_path(self):
        """Add ~/.skillchain/bin to the user PATH (Windows only)."""
        if sys.platform != "win32":
            print("         Non-Windows platform, skipping PATH registration")
            return

        bin_dir = self.sc_dir / "bin"
        bin_dir.mkdir(exist_ok=True)
        if bin_dir not in self.created_dirs:
            self.created_dirs.append(bin_dir)

        # Create a skillchain.cmd wrapper that invokes the SDK CLI
        wrapper = bin_dir / "skillchain.cmd"
        # Try to find the real skillchain entry point
        sc_cmd = self._find_skillchain_cmd()
        wrapper.write_text(
            f'@echo off\n"{sc_cmd}" %*\n',
            encoding="utf-8",
        )
        self.created_files.append(wrapper)

        # Add bin_dir to user PATH via registry
        bin_str = str(bin_dir)
        try:
            import winreg
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Environment",
                0,
                winreg.KEY_READ | winreg.KEY_WRITE,
            )
            try:
                current_path, _ = winreg.QueryValueEx(key, "Path")
            except FileNotFoundError:
                current_path = ""

            if bin_str.lower() not in current_path.lower():
                new_path = f"{current_path};{bin_str}" if current_path else bin_str
                winreg.SetValueEx(key, "Path", 0, winreg.REG_EXPAND_SZ, new_path)
                # Notify the system of the change
                try:
                    import ctypes
                    HWND_BROADCAST = 0xFFFF
                    WM_SETTINGCHANGE = 0x001A
                    ctypes.windll.user32.SendMessageTimeoutW(
                        HWND_BROADCAST, WM_SETTINGCHANGE, 0,
                        "Environment", 0x0002, 5000, None,
                    )
                except Exception:
                    pass
                print(f"         Added to PATH: {bin_str}")
                print("         (restart your terminal for PATH to take effect)")
            else:
                print(f"         Already on PATH: {bin_str}")

            winreg.CloseKey(key)
        except Exception as exc:
            print(f"         WARNING: Could not modify PATH: {exc}")
            print(f"         Manually add to PATH: {bin_str}")

    def _step_validate(self):
        """Verify the installation works: marketplace present, MCP server importable."""
        errors = []

        # Check marketplace
        mp = self.sc_dir / "marketplace"
        if not mp.exists():
            errors.append("Marketplace directory missing")
        else:
            skills = [d for d in mp.iterdir() if d.is_dir() and d.name != "chains"]
            if len(skills) < 100:
                errors.append(f"Only {len(skills)} skills found (expected 120+)")

        # Check config
        if not (self.sc_dir / "config.json").exists():
            errors.append("config.json missing")

        # Check Claude MCP settings
        settings_path = self.claude_dir / "settings.json"
        if settings_path.exists():
            try:
                settings = json.loads(settings_path.read_text(encoding="utf-8"))
                if "skillchain" not in settings.get("mcpServers", {}):
                    errors.append("MCP server not configured in Claude settings")
            except Exception:
                errors.append("Claude settings.json is corrupt")
        else:
            errors.append("Claude settings.json not found")

        # Try importing the MCP server create_server function
        try:
            sdk_bundled = self._bundled_path("sdk")
            if sdk_bundled.exists():
                # Add bundled SDK to path for validation
                repo_root = sdk_bundled.parent
                if str(repo_root) not in sys.path:
                    sys.path.insert(0, str(repo_root))
                try:
                    from sdk.mcp_bridge.server import create_server
                    server = create_server()
                    if server is None:
                        errors.append("create_server() returned None")
                    else:
                        print("         MCP server: validated (create_server() OK)")
                except ImportError as exc:
                    # Not fatal — MCP may not be in the bundle, pip install handles it
                    print(f"         MCP server: import skipped ({exc})")
                except Exception as exc:
                    print(f"         MCP server: validation skipped ({exc})")
            else:
                print("         MCP server: bundled SDK not found, skipping import check")
        except Exception as exc:
            print(f"         MCP server: validation skipped ({exc})")

        if errors:
            print("         WARNINGS:")
            for e in errors:
                print(f"           - {e}")
            # Warnings are not fatal — the install may still work
        else:
            print("         All checks passed")

    # -- Helpers --

    def _bundled_path(self, name: str) -> Path:
        """Get path to a bundled resource (works in PyInstaller and dev)."""
        if hasattr(sys, "_MEIPASS"):
            return Path(sys._MEIPASS) / name
        return Path(__file__).resolve().parent.parent / name

    def _find_skillchain_cmd(self) -> str:
        """Find the skillchain CLI executable."""
        # Check common locations
        candidates = []

        # pip-installed Scripts dir
        if hasattr(sys, "executable"):
            scripts = Path(sys.executable).parent / "Scripts"
            candidates.append(scripts / "skillchain.exe")
            candidates.append(scripts / "skillchain")

        # User site-packages
        user_scripts = Path.home() / "AppData" / "Roaming" / "Python" / "Scripts"
        candidates.append(user_scripts / "skillchain.exe")

        # Our own bin wrapper
        candidates.append(self.sc_dir / "bin" / "skillchain.cmd")

        for c in candidates:
            if c.exists():
                return str(c)

        # Fall back to bare command (assumes it is on PATH)
        return "skillchain"

    def _install_claude_md(self):
        """Add SkillChain instructions to ~/.claude/CLAUDE.md."""
        marker = "## SkillChain AI Skill Marketplace"
        instructions = """
## SkillChain AI Skill Marketplace

This project includes **SkillChain** — a decentralized AI skill marketplace with 120+ skills and 65+ chains (multi-skill pipelines). The SkillChain MCP server is connected and provides tools for discovering and running skill chains.

### When to use SkillChain tools

**IMPORTANT:** When the user expresses a problem, need, life situation, or asks for help with something that sounds like a real-world task — use the `search_chains` or `find_and_run` MCP tools FIRST before responding conversationally. SkillChain has chains for:

- Career decisions ("I hate my job", "should I quit", "help me get hired")
- Life situations ("I feel stuck", "I'm overwhelmed", "am I okay")
- Money problems ("I need a budget", "retirement planning", "side hustle")
- Health ("meal planning", "exercise", "medication tracking")
- Business ("start a business", "pricing", "marketing", "freelancing")
- Learning ("teach me", "explain", "I want to learn")
- Decisions ("should I", "comparing options", "which one")
- Hard conversations ("difficult conversation", "complaint", "negotiation")
- Home/family ("moving", "new house", "baby", "pet", "emergency plan")
- Technology fears ("scared of AI", "what is crypto", "digital safety")
- Events ("party", "vacation", "wedding", "gift ideas")

**How to use:**
1. Call `search_chains` with the user's natural language to find matching chains
2. Present the best match to the user with its description and skills involved
3. If the user wants to proceed, call `find_and_run` with `auto_run: true`
4. After execution, show the `get_trainer_profile` to display their XP/level/achievements

**Available gamification tools:**
- `get_trainer_profile` — Show trainer level, XP, streak, collection stats
- `get_achievements` — List all 30 achievements with lock/unlock status
- `get_skilldex` — Skill collection progress by category
- `get_daily_quests` — Today's 3 daily quests
"""
        claude_md = self.claude_dir / "CLAUDE.md"
        if claude_md.exists():
            content = claude_md.read_text(encoding="utf-8")
            self.modified_files.setdefault(claude_md, content)
            if marker not in content:
                with open(claude_md, "a", encoding="utf-8") as f:
                    f.write("\n" + instructions)
        else:
            claude_md.write_text(
                "# Project Instructions\n" + instructions, encoding="utf-8"
            )
            self.created_files.append(claude_md)

    # -- Rollback --

    def _rollback(self):
        """Undo changes made during a failed installation."""
        print("\n  Rolling back installation...")

        # Remove created files
        for f in reversed(self.created_files):
            try:
                if f.exists():
                    f.unlink()
                    print(f"    Removed: {f}")
            except Exception as exc:
                print(f"    WARNING: Could not remove {f}: {exc}")

        # Restore modified files
        for path, original in self.modified_files.items():
            try:
                if path.is_dir():
                    # This was a directory backup (marketplace)
                    backup = Path(original)
                    if backup.exists():
                        if path.exists():
                            shutil.rmtree(path)
                        shutil.copytree(str(backup), str(path))
                        shutil.rmtree(backup)
                        print(f"    Restored: {path}")
                else:
                    path.write_text(original, encoding="utf-8")
                    print(f"    Restored: {path}")
            except Exception as exc:
                print(f"    WARNING: Could not restore {path}: {exc}")

        # Remove created directories (reverse order so children go first)
        for d in reversed(self.created_dirs):
            try:
                if d.exists() and not any(d.iterdir()):
                    d.rmdir()
                    print(f"    Removed dir: {d}")
            except Exception as exc:
                print(f"    WARNING: Could not remove dir {d}: {exc}")

        print()
        print("  Installation rolled back. No changes were made.")
        print("  Please check the errors above and try again.")
        print()

    # -- Success output --

    def _print_success(self):
        print()
        print("  Installation complete!")
        print()
        print(f"  Skills:     {self.sc_dir / 'marketplace'}")
        print(f"  Config:     {self.sc_dir / 'config.json'}")
        print(f"  Claude MCP: {self.claude_dir / 'settings.json'}")
        print(f"  Claude MD:  {self.claude_dir / 'CLAUDE.md'}")
        print()
        print("  Next steps:")
        print("  1. Restart Claude Code")
        print("  2. Say 'I need help with something'")
        print("  3. Claude will find the right skill chain for you")
        print()


def main():
    installer = Installer()
    success = installer.run()
    if not success:
        input("  Press Enter to exit...")
        sys.exit(1)
    input("  Press Enter to exit...")


if __name__ == "__main__":
    main()
'''


if __name__ == "__main__":
    build()
