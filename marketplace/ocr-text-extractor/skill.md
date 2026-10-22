# Ocr Text Extractor

Run OCR on the preprocessed image to extract raw text.

## Inputs

- `preprocessed-image`: The cleaned image ready for OCR

## Outputs

- `raw-ocr-text`: The raw text extracted by OCR with position data
- `ocr-confidence-map`: Per-character or per-word confidence scores

## Process

1. Run the OCR engine on the preprocessed image.
2. Capture the extracted text with bounding box positions.
3. Record confidence scores for each text region.
4. Identify regions where text could not be read.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
