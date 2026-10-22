# Waitlist Entry Creation

Add a customer to the waitlist when the desired slot or service is full.

## Inputs

- `waitlist-request`: The customer's request (desired service, date/time range, contact info)
- `current-availability`: Current booking availability showing the full slots

## Outputs

- `waitlist-entry`: The waitlist record (customer, desired slot, priority, position, expiration)
- `waitlist-confirmation`: Confirmation sent to the customer with their position and expected wait

## Process

1. Confirm the slot is genuinely full (not just showing unavailable due to a hold or buffer).
2. Create the waitlist entry: customer contact, desired service, acceptable date/time range, and any flexibility notes.
3. Assign a position based on the priority rules (first come, VIP, urgency).
4. Send the customer a confirmation with their position and estimated wait time.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
