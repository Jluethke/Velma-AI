# Patient Cost Estimate

Calculate and communicate the patient's estimated out-of-pocket cost for the visit.

## Inputs

- `benefits-detail`: Copay, coinsurance, deductible details
- `visit-type`: The planned service type

## Outputs

- `cost-estimate`: Estimated patient responsibility for the visit (copay, coinsurance, deductible applied)
- `verification-record`: Complete verification record for the patient chart

## Process

1. Calculate the expected charge based on the fee schedule for the visit type.
2. Apply the patient's copay, coinsurance, and remaining deductible to estimate out-of-pocket cost.
3. Prepare the cost estimate for communication to the patient before the visit.
4. File the complete verification record in the patient chart.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
