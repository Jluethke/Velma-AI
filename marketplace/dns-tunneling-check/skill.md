# Dns Tunneling Check

Check for indicators of DNS tunneling being used for data exfiltration or command and control.

## Inputs

- `dns-record-inventory`: DNS record inventory
- `target-domains`: In-scope domains

## Outputs

- `tunneling-indicators`: Indicators of DNS tunneling activity
- `dns-monitoring-assessment`: Assessment of DNS query monitoring and anomaly detection capabilities

## Process

1. Analyze DNS query logs for high-entropy subdomain patterns
2. Check for unusually large TXT record queries or responses
3. Test DNS query rate limiting and response size restrictions
4. Review DNS monitoring and anomaly detection capabilities

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
