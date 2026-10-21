# Persistent Id Assigner

Reserve persistent identifiers (DOIs) for datasets and link them to the manuscript DOI.

## Inputs

- `file-inventory`: Catalog of files to be deposited
- `manuscript-doi`: DOI of the associated publication if available

## Outputs

- `doi-assignments`: DOI reserved for each dataset or dataset collection
- `linkage-record`: Mapping between dataset DOIs and the manuscript DOI

## Process

1. Decide the granularity of DOI assignment (one per dataset, one per collection, or one per version).
2. Reserve DOIs through the repository's registration service (DataCite).
3. Record the bidirectional link between dataset and manuscript DOIs.
4. Verify that reserved DOIs resolve to the expected landing page.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
