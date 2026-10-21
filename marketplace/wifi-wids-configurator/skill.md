# Wifi Wids Configurator

Configure wireless intrusion detection and prevention to identify rogue access points.

## Inputs

- `ap-inventory`: Access points with WIDS capability
- `ssid-broadcast-config`: Broadcast settings to identify expected SSIDs

## Outputs

- `wids-config`: Applied wireless IDS/IPS settings
- `rogue-detection-test`: Verification that rogue AP detection is functioning

## Process

1. Enable rogue AP detection on the wireless controller or access points
2. Configure alerts for unauthorized SSIDs and unknown MAC addresses
3. Set up containment actions for confirmed rogue access points
4. Test detection with a controlled rogue AP

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
