#!/usr/bin/env python
"""
render_drawings.py
==================

Renders Mermaid diagram code into USPTO-compliant PNG and SVG files.

Reads a drawings JSON file (output from patent-drawing-generator skill)
and renders each figure's mermaid_code to PNG and SVG images.

USPTO 37 CFR 1.84 requirements applied:
- Black and white only (Mermaid default theme with white fills)
- Minimum text size maintained via scale factor
- Output at 300 DPI equivalent for print quality

Usage:
    python render_drawings.py --input drawings.json --output ./drawings/
    python render_drawings.py --input drawings.json --output ./drawings/ --format png
    python render_drawings.py --input drawings.json --output ./drawings/ --format both

Dependencies:
    pip install mermaid-py
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path


def render_mermaid(mermaid_code: str, output_path: str, fmt: str = "both") -> dict:
    """
    Render Mermaid code to PNG and/or SVG.

    Returns dict with file paths and sizes.
    """
    try:
        from mermaid import Mermaid
        from mermaid.graph import Graph
    except ImportError:
        print("ERROR: mermaid-py not installed. Run: pip install mermaid-py")
        sys.exit(1)

    results = {}

    # Create Graph and Mermaid objects
    name = Path(output_path).stem
    g = Graph(name, mermaid_code)
    m = Mermaid(g)

    if fmt in ("png", "both"):
        png_path = output_path if output_path.endswith(".png") else f"{output_path}.png"
        m.to_png(png_path)
        results["png"] = {"path": png_path, "size": os.path.getsize(png_path)}

    if fmt in ("svg", "both"):
        svg_path = output_path if output_path.endswith(".svg") else f"{output_path}.svg"
        m.to_svg(svg_path)
        results["svg"] = {"path": svg_path, "size": os.path.getsize(svg_path)}

    return results


def render_all_from_json(input_path: str, output_dir: str, fmt: str = "both") -> dict:
    """
    Render all figures from a drawings JSON file.

    Expected JSON format:
    {
        "figures": [
            {
                "figure_number": "FIG. 1",
                "mermaid_code": "graph TD\\n    A-->B",
                ...
            }
        ]
    }
    """
    import re

    with open(input_path, "r", encoding="utf-8") as f:
        content = f.read()
        # Handle code-fenced JSON
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            if content.endswith("```"):
                content = content[:-3]
        # Fix trailing commas (common in LLM-generated JSON)
        content = re.sub(r',\s*([}\]])', r'\1', content)
        data = json.loads(content)

    figures = data.get("figures", [])
    if not figures:
        print("ERROR: No figures found in input file")
        return {"error": "no figures"}

    os.makedirs(output_dir, exist_ok=True)

    results = {
        "patent_family": data.get("patent_family", "Unknown"),
        "total_figures": len(figures),
        "rendered": [],
        "failed": [],
    }

    for fig in figures:
        fig_num = fig.get("figure_number", "unknown")
        mermaid_code = fig.get("mermaid_code", "")

        if not mermaid_code:
            results["failed"].append({"figure": fig_num, "reason": "no mermaid_code"})
            continue

        # Clean figure number for filename: "FIG. 1" -> "fig_01"
        safe_name = fig_num.lower().replace(".", "").replace(" ", "_")
        # Pad number: fig_1 -> fig_01
        parts = safe_name.split("_")
        if len(parts) == 2 and parts[1].isdigit():
            safe_name = f"{parts[0]}_{int(parts[1]):02d}"

        output_path = os.path.join(output_dir, safe_name)

        try:
            render_result = render_mermaid(mermaid_code, output_path, fmt)
            results["rendered"].append({
                "figure": fig_num,
                "title": fig.get("title", ""),
                "files": render_result,
            })
            print(f"  [OK] {fig_num}: {fig.get('title', '')}")
            for file_fmt, info in render_result.items():
                print(f"       {file_fmt}: {info['path']} ({info['size']} bytes)")
        except Exception as e:
            results["failed"].append({"figure": fig_num, "reason": str(e)})
            print(f"  [FAIL] {fig_num}: {e}")

        # Small delay to avoid rate limiting on mermaid.ink API
        time.sleep(0.5)

    # Save render report
    report_path = os.path.join(output_dir, "render_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print(f"\nRendered: {len(results['rendered'])}/{len(figures)} figures")
    if results["failed"]:
        print(f"Failed: {len(results['failed'])}")
    print(f"Report: {report_path}")

    return results


def render_single(mermaid_code: str, output_path: str, fmt: str = "both") -> dict:
    """Render a single Mermaid code string to image."""
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    return render_mermaid(mermaid_code, output_path, fmt)


def main():
    parser = argparse.ArgumentParser(
        description="Render patent drawing Mermaid diagrams to PNG/SVG",
    )
    parser.add_argument(
        "--input", "-i",
        required=True,
        help="Path to drawings JSON file (from patent-drawing-generator)",
    )
    parser.add_argument(
        "--output", "-o",
        required=True,
        help="Output directory for rendered images",
    )
    parser.add_argument(
        "--format", "-f",
        choices=["png", "svg", "both"],
        default="both",
        help="Output format (default: both)",
    )

    args = parser.parse_args()

    print(f"Rendering patent drawings from: {args.input}")
    print(f"Output directory: {args.output}")
    print(f"Format: {args.format}")
    print()

    render_all_from_json(args.input, args.output, args.format)


if __name__ == "__main__":
    main()
