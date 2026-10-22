# Audit Query Interface Designer

Build the query interface and produce the audit trail design document.

## Inputs

- `audit-record-schema`: Schema for audit records
- `storage-design`: How records are stored
- `retention-policy`: Retention periods

## Outputs

- `query-interface-spec`: Specification for searching and filtering audit records
- `audit-trail-design-document`: Complete audit trail design document

## Process

1. Define the query dimensions (by actor, by resource, by time range, by action type).
2. Design the search interface (API, dashboard, CLI).
3. Set access controls for who can query audit records.
4. Produce the complete audit trail design document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
