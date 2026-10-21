# Shadow It Identifier

Identify shadow IT and forgotten assets that are externally reachable but not tracked in official inventories.

## Inputs

- `discovered-assets`: All discovered external assets
- `known-domains`: Official asset inventory

## Outputs

- `shadow-it-list`: Assets not in the official inventory with their risk assessment
- `orphaned-assets`: Assets with no identifiable owner

## Process

1. Compare discovered assets against the official CMDB or asset inventory
2. Flag assets not present in the inventory as shadow IT candidates
3. Attempt to identify the owner through WHOIS, DNS admin contacts, and cloud tagging
4. Mark assets with no identifiable owner as orphaned

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
