# Rent Invoice Generator

Generate monthly rent invoices for all tenants.

## Inputs

- `lease-portfolio`: Active leases with rent amounts and due dates
- `billing-period`: Month and year for invoicing

## Outputs

- `rent-invoices`: Generated invoices for each tenant
- `expected-revenue`: Total expected rent revenue for the period

## Process

1. Pull active leases and their rent amounts for the billing period.
2. Generate an invoice for each tenant with the amount due, due date, and payment instructions.
3. Calculate the total expected revenue for the period.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
