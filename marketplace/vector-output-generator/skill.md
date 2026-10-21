# Vector Output Generator

Export the figure as vector format (PDF, SVG, or EPS) at publication resolution, with fonts embedded and no rasterization of line art.

## Inputs

- `draft-figure`: The figure to export
- `style-config`: Required format and resolution

## Outputs

- `vector-figure-file`: The exported vector file ready for submission
- `export-log`: Format, resolution, file size, and any warnings

## Process

1. Set the output format based on journal requirements (PDF preferred, SVG or EPS as fallback).
2. Embed all fonts to prevent substitution on the reviewer's or typesetter's machine.
3. Ensure line art is not rasterized: lines, text, and axes should remain vector.
4. Check the file size against the journal's upload limit.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
