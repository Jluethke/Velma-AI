# Pcrm Tool Mapping

Map the schema and cadence rules onto whatever tool will actually hold the data (a spreadsheet, a notes app, phone contact fields, or a dedicated contact tool), choosing the tool by whether you will keep it current rather than by its feature list.

## Inputs

- `tier-cadence-rules`: Target days between contacts per tier
- `cadence-load-estimate`: Implied weekly contact load versus available time

## Outputs

- `tool-field-mapping`: How each schema field maps to a column, property, or custom field in the chosen tool
- `automation-options`: Which parts can be computed automatically (next-due date) versus which stay manual in this tool

## Process

1. Pick the tool by one test: where will you reliably update a record 30 seconds after a conversation? A spreadsheet you keep open beats a polished tool you forget to open.
2. Map each field to a column or property. Add one computed field, next-due-date, as last-contact-date plus the cadence for that tier. In a spreadsheet this is a formula, in a contact app it may be a manual date you set.
3. Decide what the tool can automate. If it supports computed dates and filtered views, set next-due-date to recalculate automatically. If not, plan a weekly recalculation pass instead of pretending the tool will do it.
4. Keep the schema identical across whatever tools you use. If contacts live half in your phone and half in a sheet, the same five fields appear in both so a future consolidation is a copy, not a redesign.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
