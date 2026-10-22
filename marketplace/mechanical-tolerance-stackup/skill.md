# Mechanical Tolerance Stackup

Analyze the tolerance stackup across the assembly to confirm fit and function, using worst-case and statistical methods and sound geometric dimensioning.

## Inputs

- `dfm-findings`: The flagged features and tolerances from the checklist review
- `assembly-definition`: The mating parts, the dimension chain, and the functional gap or fit that must be controlled

## Outputs

- `stackup-result`: The predicted gap or fit distribution from the dimension chain, by worst-case and statistical methods, against the functional limits
- `tolerance-allocation`: The revised tolerance allocation across the chain that meets the functional requirement at acceptable cost

## Process

1. Build the one-dimensional dimension loop for the functional gap. Identify the controlling requirement (a clearance, an interference, a flush condition), list every dimension that contributes to it with sign, and confirm the loop closes. Most assembly fit problems are a single dimension chain that nobody summed.
2. Run the worst-case stack first. Sum the tolerances arithmetically; if the worst-case result keeps the gap inside its functional limits, the assembly always fits and no statistics are needed. Worst-case is the right method for safety-critical fits and low-volume assemblies where you cannot rely on averaging.
3. Run the statistical stack where worst-case is too costly. Combine the contributing tolerances in a root-sum-square (assuming independent, centered, roughly normal distributions) to predict the realistic spread. The statistical gap is much tighter than worst-case for long chains, which often recovers a design that worst-case rejected, at a quantified low defect rate.
4. Use geometric dimensioning and tolerancing (GD&T) to control the chain, not just plus/minus sizes. Datum references, position, and profile control how features actually locate in assembly; a chain toleranced only with plus/minus linear dimensions often does not control the real functional relationship. Apply bonus tolerance from maximum material condition where the function allows it.
5. Reallocate tolerances to the cheapest-to-hold features. If the stack fails, open the tolerances on the features that are expensive to hold tight and tighten the ones that are cheap, keeping the total within the functional limit. Allocation, not uniform tightening, is how a stackup is closed at minimum cost.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
