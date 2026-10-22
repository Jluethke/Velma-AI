# Discovery Scope Definer

Define the scope of the e-discovery effort based on the matter and discovery requests.

## Inputs

- `discovery-request`: The discovery request, subpoena, or regulatory demand
- `matter-context`: Background on the legal matter and relevant parties

## Outputs

- `scope-document`: Defined scope including custodians, date range, data sources, and search terms
- `custodian-list`: List of custodians whose data must be collected

## Process

1. Analyze the discovery request to identify the subject matter, date range, and relevant parties.
2. Identify the custodians (people whose data may be responsive).
3. Map the data sources for each custodian (email, documents, chat, cloud storage, mobile).
4. Define the preliminary search terms and produce the scope document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
