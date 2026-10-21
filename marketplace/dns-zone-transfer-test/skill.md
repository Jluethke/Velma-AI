# Dns Zone Transfer Test

Test whether DNS servers allow unauthorized zone transfers (AXFR/IXFR).

## Inputs

- `zone-list`: List of DNS zones to test
- `dns-record-inventory`: Inventory of DNS records including NS records

## Outputs

- `zone-transfer-results`: Results of zone transfer attempts against each nameserver
- `exposed-records`: Any records disclosed through successful zone transfers

## Process

1. Attempt AXFR against each authoritative nameserver for each zone
2. Attempt IXFR with a serial number of zero to request full transfer
3. Document any successful transfers and the records disclosed
4. Check ACLs on zone transfer permissions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
