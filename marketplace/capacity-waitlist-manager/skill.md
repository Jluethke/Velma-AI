# Capacity Waitlist Manager

Manage division and program capacity limits, waitlists, and overflow handling.

## Inputs

- `payment-configuration`: Fee and refund rules for waitlisted registrants
- `payment-processor-setup`: Payment handling for waitlist-to-registered transitions

## Outputs

- `capacity-status`: Real-time capacity status for each division and program
- `waitlist-queue`: Ordered waitlist with notification preferences

## Process

1. Set capacity limits for each division and program.
2. When capacity is reached, move new registrations to the waitlist.
3. When a spot opens (cancellation or added capacity), notify the next waitlisted registrant.
4. Track waitlist conversion rates for future planning.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
