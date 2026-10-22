# Document Queue Router

Route the classified document to the appropriate processing queue based on type and metadata.

## Inputs

- `document-type`: The identified document type
- `document-metadata`: Extracted metadata for routing decisions

## Outputs

- `routing-destination`: The queue or team the document was routed to
- `classification-record`: Complete record: document type, metadata, routing, timestamp

## Process

1. Match the document type and metadata to the routing rules.
2. Route invoices to accounts payable, contracts to legal, correspondence to the relevant department.
3. Tag and index the document for search and retrieval.
4. Produce the classification record.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
