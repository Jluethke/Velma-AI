# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved.
#
# This file is part of the Velma Ecosystem — SkillChain.
# Unauthorized copying, modification, distribution, or use of this file,
# via any medium, is strictly prohibited.
#
# Proprietary and Confidential.
# Classification: PROPRIETARY
"""
SkillChain — Decentralized AI Skill-Sharing Network
====================================================

Package layout::

    skillchain/
    ├── core/           Protocol infrastructure + governance ML
    │   ├── protocol/       P2P networking, consensus, trust, blocks, validation
    │   └── governance_net/ Neural network for trust inference
    ├── sdk/            Python SDK — CLI, adapters, skill packing, social, MCP bridge
    ├── tools/          Standalone tool modules
    │   ├── debugger/       Automated debug-and-fix engine
    │   ├── graduation/     Skill lifecycle pipeline (pattern → code)
    │   └── solopreneur/    Business automation engine
    ├── contracts/      Solidity smart contracts (Foundry / Base L2)
    ├── marketplace/    Skill definition templates (.md)
    ├── website/        React landing page
    └── docs/           Whitepaper, specs, reports
"""
