# Client Isolation Testing

Test wireless client isolation to verify that connected clients cannot communicate with or attack other clients on the same network.

## Inputs

- `access-point-inventory`: Access points and their configurations
- `auth-attack-results`: Authentication testing results

## Outputs

- `isolation-findings`: Client isolation failures and bypass methods
- `client-to-client-paths`: Confirmed communication paths between wireless clients

## Process

1. Connect two test devices to the same SSID and attempt direct communication.
2. Test ARP spoofing and DHCP starvation on the wireless network.
3. Check if client isolation is enforced at the AP or only at the controller level.
4. Test whether isolation can be bypassed through VLAN hopping or routing tricks.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
