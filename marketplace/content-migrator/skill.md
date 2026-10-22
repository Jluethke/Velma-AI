# Content Migrator

Migrate existing course content from legacy systems into the new LMS.

## Inputs

- `configured-lms`: LMS configured and ready for content
- `existing-systems`: Current systems containing course content

## Outputs

- `migrated-content`: All content migrated and verified in the new LMS
- `migration-report`: Report of items migrated, skipped, or requiring manual work

## Process

1. Export content from legacy systems (SCORM, files, assessments)
2. Import into the new LMS using bulk tools or APIs
3. Verify content renders and functions correctly
4. Document any items requiring manual recreation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
