# Industrial Data Collector Setup

Configure the data collection from industrial sensors.

## Inputs

- `sensor-plan`: Sensors and their target equipment
- `criticality-ranking`: Equipment priority ranking

## Outputs

- `collection-config`: The data collection configuration (sampling rate, protocol, gateway)
- `data-flow-diagram`: Diagram of data flow from sensor to platform

## Process

1. Set the sampling rate for each sensor based on the measurement type and criticality.
2. Configure the industrial protocol (Modbus, OPC-UA, MQTT, BACnet).
3. Set up the gateway or edge device for protocol translation and buffering.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
