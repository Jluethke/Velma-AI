# Tolerance Chain Identification

Identify the tolerance chain: the sequence of dimensions and gaps that connects one functional feature to another through the assembly.

## Inputs

- `assembly-drawing`: Assembly drawing or CAD model showing the parts and their mating features
- `functional-requirement`: The critical dimension or clearance that must be controlled, with its acceptable range

## Outputs

- `dimension-chain`: Ordered list of every dimension in the chain from one functional datum to the other, with direction (+/-), nominal value, and tolerance
- `chain-diagram`: Loop diagram showing how dimensions stack, with positive and negative contributors identified

## Process

1. Start at one end of the functional requirement and trace a continuous path through mating surfaces to the other end. Every part boundary you cross and every gap you span adds a dimension to the chain.
2. Assign a sign convention: positive dimensions increase the gap being analyzed, negative dimensions decrease it. Be consistent. The nominal gap equals the sum of all signed dimensions.
3. Extract each dimension's nominal value and tolerance from the part drawings. Use the tolerance from GD&T callouts where they exist. For dimensions controlled by position tolerances, convert the position tolerance zone to a linear tolerance contribution in the stackup direction.
4. Account for form tolerances that affect fit. A flatness tolerance on a mating surface adds uncertainty to the assembly gap equal to the flatness tolerance value. Include these as separate line items in the chain.
5. Include assembly process contributions: press-fit variations, adhesive bond line thickness range, thermal expansion at assembly temperature vs operating temperature. These are often the largest contributors and are frequently overlooked.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
