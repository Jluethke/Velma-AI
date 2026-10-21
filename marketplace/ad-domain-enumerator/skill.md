# Ad Domain Enumerator

Enumerate the Active Directory domain structure, trusts, and organizational units.

## Inputs

- `domain-credentials`: Domain-joined account credentials for enumeration
- `assessment-scope`: Which domains and forests are in scope

## Outputs

- `domain-structure`: Forest, domain, trust, and OU hierarchy
- `account-inventory`: Users, groups, computers, and service accounts

## Process

1. Enumerate the forest structure, all domains, and trust relationships
2. Map organizational units and their linked Group Policy Objects
3. Inventory all user accounts, computer accounts, and service accounts
4. Identify trust types (forest, external, realm) and their direction and transitivity

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
