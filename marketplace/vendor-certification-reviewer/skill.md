# Vendor Certification Reviewer

Review vendor security certifications, audit reports, and compliance documentation.

## Inputs

- `integration-inventory`: Vendor integration inventory
- `vendor-list`: Vendor list with contact information

## Outputs

- `certification-status`: SOC2, ISO 27001, and other certifications with expiry dates and scope
- `audit-findings-summary`: Notable findings from vendor audit reports

## Process

1. Collect current SOC2 Type II reports, ISO 27001 certificates, and other relevant certifications
2. Verify that certification scope covers the services you use
3. Review audit report findings and management responses
4. Flag vendors missing certifications or with expired reports

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
