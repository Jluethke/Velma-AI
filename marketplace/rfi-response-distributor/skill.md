# Rfi Response Distributor

Distribute the RFI response to affected parties and update project documents.

## Inputs

- `response-content`: Response from the reviewer
- `rfi-record`: Original RFI record

## Outputs

- `distribution-confirmation`: Confirmation that the response was distributed
- `document-updates`: List of project documents updated based on the response

## Process

1. Distribute the response to the originator and all affected subcontractors.
2. Update the project drawings or specifications if the response changes the design.
3. Close the RFI in the log.
4. File the complete RFI record in the project files.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
