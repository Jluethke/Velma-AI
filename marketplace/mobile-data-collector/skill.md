# Mobile Data Collector

Set up a mobile data collection app or platform with GPS tagging, photo capture, offline capability, and automatic upload.

## Inputs

- `data-form`: Standardized data entry form from the protocol step
- `platform-choice`: Selected platform (iNaturalist, ODK, Survey123, custom app)
- `offline-requirements`: Whether data entry must work without cell service

## Outputs

- `configured-app`: Ready-to-deploy mobile data collection form with all fields and validation rules
- `user-guide`: Screenshot-annotated guide for downloading, logging in, and submitting observations
- `data-pipeline`: Automatic sync and storage architecture from phone to central database

## Process

1. Translate the data form into the selected platform's form builder
2. Configure GPS auto-capture, timestamp, and photo attachment fields
3. Set up field validation rules (required fields, numeric ranges, picklist constraints)
4. Enable offline data entry with automatic upload when connectivity returns
5. Write the user guide with annotated screenshots for each step

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
