# Rpch Constraint Identifier

Find the scarcest resource that caps revenue.

## Inputs

- `operation-context`: The operation and the period under review
- `candidate-resources`: Resources that might limit output, such as staff hours or machine time

## Outputs

- `binding-constraint`: The one resource that caps revenue
- `constraint-capacity`: The total units of the constraint available in the period

## Process

1. List the resources that limit output, such as staff hours, machine time, or senior attention.
2. Estimate the available units of each over the period.
3. Name the one resource that caps revenue and record its total capacity.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
