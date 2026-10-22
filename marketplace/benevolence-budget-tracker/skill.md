# Benevolence Budget Tracker

Track benevolence spending against the budget and produce the program report.

## Inputs

- `disbursement-record`: Payments made this period
- `applicant-notification`: Decisions communicated

## Outputs

- `budget-status`: Spent vs. remaining by assistance type and total
- `program-report`: Number of requests, approvals, denials, total distributed, and remaining budget

## Process

1. Total disbursements by assistance type and compare against the allocated budget.
2. Track the number of unique households served and repeat requests.
3. Flag if spending is on pace to exhaust the budget before the period ends.
4. Produce the program report for the governing board: requests received, approved, denied, dollars distributed, and budget remaining.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
