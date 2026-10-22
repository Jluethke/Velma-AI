# Constituent Request Intake

Receive and categorize a constituent service request.

## Inputs

- `request-details`: The constituent's request (issue description, contact info, preferred response method)
- `service-catalog`: Catalog of services and responsible departments

## Outputs

- `categorized-request`: Request categorized by type and assigned a tracking number
- `department-routing`: The department and contact responsible for handling the request

## Process

1. Log the request with a unique tracking number.
2. Categorize the issue by type (pothole, zoning question, utility, general inquiry, complaint).
3. Match the category to the responsible department in the service catalog.
4. Send the constituent an acknowledgment with the tracking number.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
