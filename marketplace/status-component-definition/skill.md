# Status Component Definition

Define the components and services displayed on the status page.

## Inputs

- `service-catalog`: List of services and their dependencies
- `customer-facing-services`: Which services are visible to customers

## Outputs

- `component-list`: List of components to display on the status page with grouping
- `dependency-map`: Map of which components depend on which backend services

## Process

1. List every customer-facing service and group them into logical categories (API, web app, mobile, payments, integrations).
2. Map each component to its backend dependencies so you know what affects what.
3. Define the status levels for each component (operational, degraded, partial outage, major outage, maintenance).
4. Decide which internal services are hidden from the public page but tracked internally.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
