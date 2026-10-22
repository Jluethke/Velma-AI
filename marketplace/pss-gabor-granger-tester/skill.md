# Pss Gabor Granger Tester

Run the Gabor-Granger descending price test to find the revenue maximizing point.

## Inputs

- `clean-responses`: The respondents from the price survey

## Outputs

- `gabor-granger-schedule`: Purchase likelihood at each descending price
- `revenue-maximizing-price`: The price where likelihood times price peaks

## Process

1. Present descending prices and record purchase likelihood at each.
2. Build the demand schedule from likelihood against price.
3. Find the price where likelihood multiplied by price is highest.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
