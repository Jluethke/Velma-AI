"""Build script: copies source files from monorepo into pypi-package structure and fixes imports."""
import os
import shutil
from pathlib import Path

BASE = str(Path(__file__).resolve().parent.parent)  # SkillChain repo root
DEST = f"{BASE}/pypi-package/src/skillchain"

# Map source dirs to destination subpackage names
COPIES = [
    # (src_dir, dest_subpackage, import_old_prefix, import_new_prefix)
    (f"{BASE}/sdk", f"{DEST}/sdk", None, None),
    (f"{BASE}/tools/debugger", f"{DEST}/debugger", "skillchain.tools.debugger", "skillchain.debugger"),
    (f"{BASE}/tools/solopreneur", f"{DEST}/solopreneur", "skillchain.tools.solopreneur", "skillchain.solopreneur"),
    (f"{BASE}/tools/graduation", f"{DEST}/graduation", "skillchain.tools.graduation", "skillchain.graduation"),
    (f"{BASE}/core/governance_net", f"{DEST}/governance_net", "skillchain.core.governance_net", "skillchain.governance_net"),
]


def fix_imports(content, old_prefix, new_prefix):
    """Fix absolute imports from old monorepo paths to new package paths."""
    if old_prefix and new_prefix:
        content = content.replace(old_prefix, new_prefix)
    # Fix the promotion_pipeline cross-package import
    content = content.replace(
        "from skillchain.sdk import SkillChainSDK",
        "from skillchain.sdk import SkillChainNode as SkillChainSDK",
    )
    return content


def copy_tree(src, dst, old_prefix, new_prefix):
    """Copy .py files from src to dst, fixing imports."""
    count = 0
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d != "__pycache__"]

        for f in files:
            if not f.endswith(".py"):
                continue
            src_path = os.path.join(root, f)
            rel = os.path.relpath(src_path, src)
            dst_path = os.path.join(dst, rel)

            os.makedirs(os.path.dirname(dst_path), exist_ok=True)

            with open(src_path, "r", encoding="utf-8") as fh:
                content = fh.read()

            content = fix_imports(content, old_prefix, new_prefix)

            with open(dst_path, "w", encoding="utf-8") as fh:
                fh.write(content)
            count += 1
            print(f"  {rel}")
    return count


total = 0
for src_dir, dest_dir, old_pfx, new_pfx in COPIES:
    name = os.path.basename(src_dir)
    print(f"\n=== Copying {name} ===")
    n = copy_tree(src_dir, dest_dir, old_pfx, new_pfx)
    total += n
    print(f"  ({n} files)")

print(f"\nTotal: {total} files copied.")
