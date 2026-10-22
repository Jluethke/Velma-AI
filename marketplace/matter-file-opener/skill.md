# Matter File Opener

Open the matter file with all required fields and assign the responsible attorney.

## Inputs

- `matter-summary`: Structured summary from intake
- `matter-type`: Classification of the matter

## Outputs

- `matter-record`: The opened matter file with ID, type, parties, dates, and assigned attorney
- `key-dates`: List of critical dates and deadlines for the matter

## Process

1. Assign a matter ID and create the file with the matter type, parties, and description.
2. Identify the responsible attorney or team based on matter type and current workload.
3. Record all known key dates: statute of limitations, filing deadlines, hearing dates, and internal review dates.
4. Set the initial status and priority level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
