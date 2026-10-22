# Ingestion Endpoint Configurator

Configure the ingestion endpoint for receiving sensor data.

## Inputs

- `data-schema`: The telemetry data schema
- `validation-rules`: Data validation rules

## Outputs

- `ingestion-config`: The configured ingestion endpoint (protocol, address, authentication)
- `ingestion-docs`: Documentation for devices to send data to the endpoint

## Process

1. Select the ingestion protocol (MQTT, HTTP, Kafka) based on the data volume and latency needs.
2. Configure the endpoint with the data schema and validation rules.
3. Set up authentication for the ingestion endpoint.
4. Document the endpoint address, protocol, and payload format.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
