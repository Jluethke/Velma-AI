# Chargeback Intake

Receive the chargeback notification and log the case.

## Inputs

- `chargeback-notification`: Notification from the card network or processor with reason code and amount
- `transaction-reference`: Original transaction ID and details

## Outputs

- `chargeback-case`: Logged case with reason code, amount, deadline, and original transaction
- `response-deadline`: Calendar date by which the representment must be submitted

## Process

1. Log the chargeback with all details from the notification.
2. Look up the original transaction and customer record.
3. Calculate the response deadline from the reason code and network rules.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
