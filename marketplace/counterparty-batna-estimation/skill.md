# Counterparty Batna Estimation

Estimate the counterparty's BATNA and reservation price. Their walk-away point determines how much you can push.

## Inputs

- `negotiation-context`: The deal and counterparty
- `reservation-price`: Your own floor

## Outputs

- `counterparty-batna-estimate`: Best guess at their alternatives: other customers, other suppliers, doing nothing, their status quo
- `counterparty-reservation-estimate`: Best guess at their floor: the worst deal they would accept before walking away

## Process

1. Research the counterparty's alternatives. Who else could they work with? What happens if they do nothing? Are they under time pressure?
2. Time pressure weakens a BATNA. If the counterparty has a deadline (budget expires, contract renews, board meeting), their BATNA degrades as the deadline approaches.
3. Multiple options strengthen a BATNA. If the counterparty has 5 other suppliers bidding, their BATNA is strong and you will need to differentiate on value, not just price.
4. The gap between your reservation price and their estimated reservation price is the ZOPA. If your floor is $85K and their estimated floor is $100K, the ZOPA is $85K-$100K. You want to capture as much of that gap as possible.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
