# Pci Scope Segmentation Test

Verify PCI DSS scope boundaries and network segmentation between cardholder data environment and untrusted networks.

## Inputs

- `network-diagram`: Network architecture diagram showing CDE boundaries
- `pci-scope-document`: Documented PCI scope and data flow diagrams

## Outputs

- `scope-findings`: Out-of-scope systems with CDE access, segmentation failures
- `data-flow-map`: Verified cardholder data flow through all systems

## Process

1. Trace cardholder data from entry (terminal, web form, API) through processing to storage
2. Test network segmentation with port scanning and traffic analysis across zone boundaries
3. Identify systems that should be in scope but are documented as out of scope
4. Check for flat network segments where CDE systems share broadcast domains with general IT

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
