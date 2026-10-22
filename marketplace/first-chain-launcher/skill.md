# First Chain Launcher

Help the user actually start their first chain: gather the entry inputs it needs and begin step 1.

## Inputs

- `recommended-first-chain`: The chain to start with
- `recommended-path`: The full recommended path for context

## Outputs

- `chain-entry-inputs`: The entry inputs collected from the user for their first chain
- `first-step-output`: The output of running step 1 of the first chain

## Process

1. Read the recommended chain's chain.json to identify its entry_inputs.
2. For each entry input, explain what it is and ask the user to provide it. Use plain language, not field names.
3. Once all entry inputs are collected, read the first step's skill.md and execute its process.
4. Present the first step's output to the user and explain what comes next in the chain.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
