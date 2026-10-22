# Conversion Tool Selector

Select the conversion tools and libraries for each format pair.

## Inputs

- `conversion-matrix`: Source-to-target format mapping
- `volume-estimate`: Expected processing volume

## Outputs

- `tool-selection`: Selected tool or library for each conversion pair with rationale
- `infrastructure-plan`: Where the tools run (local, server, cloud function) and resource needs

## Process

1. For each format pair, identify the candidate tools (FFmpeg, ImageMagick, LibreOffice, Pandoc, Tesseract, custom scripts).
2. Evaluate each tool on quality, speed, cost, and ease of automation.
3. Select one tool per pair and note any configuration (codec, quality preset, DPI).
4. Plan the infrastructure: local machine for low volume, server or cloud function for high volume.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
