# Threat Intel Disseminator

Disseminate finished intelligence to stakeholders and feed indicators into detection systems.

## Inputs

- `intel-products`: Finished reports and bulletins
- `detection-indicators`: Machine-readable indicators for tools

## Outputs

- `dissemination-record`: Log of what was sent to whom and when
- `feedback-requests`: Requests for feedback on intelligence usefulness from recipients

## Process

1. Distribute reports to the appropriate stakeholder groups based on classification and relevance
2. Ingest indicators into the SIEM, EDR, and firewall block lists
3. Share relevant intelligence with trusted partners and ISACs per sharing agreements
4. Request feedback from recipients to improve future intelligence products

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
