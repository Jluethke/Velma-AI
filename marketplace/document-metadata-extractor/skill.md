# Document Metadata Extractor

Extract metadata from the classified document: date, author, reference numbers, and key entities.

## Inputs

- `incoming-document`: The document to extract metadata from
- `document-type`: The identified document type to guide extraction

## Outputs

- `document-metadata`: Extracted metadata: date, author, reference numbers, subject, key entities
- `extraction-log`: Record of what was extracted and confidence levels

## Process

1. Extract the document date, author, and reference numbers.
2. Identify key entities (company names, person names, account numbers).
3. Extract the subject or title if present.
4. Compile the metadata record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
