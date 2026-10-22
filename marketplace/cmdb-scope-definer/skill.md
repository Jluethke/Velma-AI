# Cmdb Scope Definer

Define the scope and depth of the CMDB.

## Inputs

- `it-environment`: Overview of the IT environment (servers, network, applications)
- `business-priorities`: Which services and systems matter most

## Outputs

- `cmdb-scope`: What configuration items to track and at what depth
- `ci-types`: The types of configuration items and their attributes

## Process

1. Identify the CI types to track (hardware, software, network, cloud, services).
2. Define the attributes to capture for each CI type.
3. Set the depth: track to the server level, component level, or both.
4. Prioritize: start with CIs that support critical business services.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
