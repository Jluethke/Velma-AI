# Buyer Question Harvest

Harvest the real questions buyers ask sales and support, since those are the questions content must answer.

## Inputs

- `sales-call-notes`: Notes and recordings from sales calls
- `support-log`: Support and chat logs showing what buyers ask after the sale

## Outputs

- `question-list`: The real questions buyers ask, in their own words
- `question-frequency`: How often each question comes up

## Process

1. Read through sales notes and support logs and write down every question a buyer actually asked.
2. Keep the buyer's phrasing, since their words are the search terms and the objections.
3. Count how often each question or close variant appears.
4. Separate pre-sale questions from post-sale ones, since content should answer the pre-sale set first.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
