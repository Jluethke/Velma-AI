# Transaction Matcher

Match processor transactions to bank transactions by amount, date, and reference.

## Inputs

- `processor-transactions`: Normalized processor records
- `bank-transactions`: Normalized bank records

## Outputs

- `matched-transactions`: Successfully matched pairs
- `unmatched-items`: Items with no match on either side

## Process

1. Match transactions by exact amount and reference number.
2. For remaining items, attempt fuzzy matching by date range and amount.
3. Separate matched pairs from unmatched items on both sides.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
