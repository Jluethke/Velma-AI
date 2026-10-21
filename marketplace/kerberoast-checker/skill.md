# Kerberoast Checker

Check for Kerberoastable service accounts with weak passwords.

## Inputs

- `account-inventory`: All accounts including service accounts
- `domain-credentials`: Domain credentials for ticket requests

## Outputs

- `kerberoastable-accounts`: Service accounts with SPNs and their cracking results
- `asrep-roastable-accounts`: Accounts with pre-authentication disabled

## Process

1. Query for all accounts with registered Service Principal Names
2. Request TGS tickets for each Kerberoastable account
3. Attempt offline cracking of the ticket hashes
4. Query for accounts with Kerberos pre-authentication disabled and attempt AS-REP roasting

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
