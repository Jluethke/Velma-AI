# Ddos Upstream Coordination

Coordinate with upstream providers and ISPs for additional mitigation support.

## Inputs

- `mitigation-status`: Current mitigation measures and their effectiveness
- `traffic-profile`: Attack traffic details for upstream filtering

## Outputs

- `upstream-actions`: Actions taken by upstream providers
- `escalation-log`: Record of all provider communications and requests

## Process

1. Contact the ISP or hosting provider with attack details and request upstream filtering
2. Engage the CDN provider to absorb volumetric attack traffic
3. Request blackhole routing for specific attack source prefixes if needed
4. Document all communications and actions taken by each provider

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
