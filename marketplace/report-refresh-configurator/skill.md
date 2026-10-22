# Report Refresh Configurator

Set up how and when the report refreshes its data.

## Inputs

- `data-connections`: Configured data source connections
- `layout-template`: The formatted report layout

## Outputs

- `refresh-schedule`: When the report refreshes (daily, hourly, on-demand) and the distribution list
- `report-template-documentation`: Complete documentation: structure, data sources, calculations, layout, refresh schedule, and usage guide

## Process

1. Set the refresh cadence based on how often the underlying data changes and how quickly the audience needs updates.
2. Configure the distribution method (email, shared dashboard, file drop).
3. Set up error notifications if a refresh fails.
4. Compile the template documentation for future maintainers.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
