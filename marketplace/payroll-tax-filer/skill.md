# Payroll Tax Filer

File payroll tax returns and remit tax deposits to federal, state, and local authorities.

## Inputs

- `tax-liability-summary`: Tax liabilities by jurisdiction
- `pay-period`: Pay period for deposit timing

## Outputs

- `tax-deposit-confirmations`: Confirmation of tax deposits made
- `quarterly-return-data`: Data accumulated for quarterly return filing

## Process

1. Calculate the deposit due date based on the deposit schedule (semi-weekly or monthly).
2. Remit federal tax deposits via EFTPS.
3. Remit state and local tax deposits per jurisdiction requirements.
4. Accumulate data for quarterly Form 941 and state returns.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
