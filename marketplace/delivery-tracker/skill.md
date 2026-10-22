# Delivery Tracker

Track shipments in transit and report delivery status.

## Inputs

- `booking-confirmations`: Carrier booking confirmations with tracking numbers
- `pickup-schedule`: Scheduled pickup dates and locations

## Outputs

- `delivery-status-report`: Current status of all shipments
- `exception-log`: Log of delays, damages, or delivery exceptions

## Process

1. Monitor carrier tracking feeds for each shipment
2. Flag delays or exceptions against the delivery deadlines
3. Record proof of delivery for completed shipments
4. Produce the delivery status report and exception log

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
