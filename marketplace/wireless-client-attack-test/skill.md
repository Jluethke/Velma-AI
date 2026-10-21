# Wireless Client Attack Test

Test for client-side wireless attacks including karma and known-network exploitation.

## Inputs

- `wireless-survey-results`: Client probe requests and known network names
- `wireless-scope`: Authorization for client-side testing

## Outputs

- `client-attack-findings`: Client-side wireless vulnerabilities found
- `rogue-ap-effectiveness`: Success rate of rogue AP attacks against authorized test devices

## Process

1. Deploy a rogue AP responding to client probe requests (karma attack on test devices)
2. Test for automatic connection to previously known open networks
3. Intercept and analyze traffic from clients connecting to the rogue AP
4. Test for captive portal credential harvesting on authorized test accounts

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
