# Bookable Space Inventory

Inventory all bookable spaces with their attributes and availability windows.

## Inputs

- `facility-list`: List of facilities or spaces to be made bookable
- `operating-parameters`: Hours of operation, maintenance windows, seasonal closures

## Outputs

- `space-catalog`: Catalog of bookable spaces with capacity, equipment, and features
- `availability-windows`: Default availability for each space by day and time

## Process

1. List each bookable space with its type (field, court, pool lane, meeting room).
2. Record the capacity, equipment, surface type, and lighting for each space.
3. Define the default availability windows and any recurring maintenance blocks.
4. Produce the space catalog.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
