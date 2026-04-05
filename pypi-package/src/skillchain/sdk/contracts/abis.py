"""
abis.py
=======

Contract ABIs for the SkillChain smart contracts, extracted from Foundry
compilation output (``contracts/out/``).

Only the function and event signatures the SDK actually calls are included
to keep this module manageable.  The full ABIs live in the compiled JSON
artefacts under ``contracts/out/<Contract>.sol/<Contract>.json``.
"""

from __future__ import annotations

# -- SkillToken (ERC-20) -------------------------------------------------------

SKILL_TOKEN_ABI = [
    # -- Functions --
    {
        "type": "function",
        "name": "approve",
        "inputs": [
            {"name": "spender", "type": "address", "internalType": "address"},
            {"name": "value", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "transfer",
        "inputs": [
            {"name": "to", "type": "address", "internalType": "address"},
            {"name": "value", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "transferFrom",
        "inputs": [
            {"name": "from", "type": "address", "internalType": "address"},
            {"name": "to", "type": "address", "internalType": "address"},
            {"name": "value", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "balanceOf",
        "inputs": [
            {"name": "account", "type": "address", "internalType": "address"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "allowance",
        "inputs": [
            {"name": "owner", "type": "address", "internalType": "address"},
            {"name": "spender", "type": "address", "internalType": "address"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "decimals",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint8", "internalType": "uint8"}],
        "stateMutability": "view",
    },
    # -- Events --
    {
        "type": "event",
        "name": "Transfer",
        "inputs": [
            {"name": "from", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "to", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "value", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "Approval",
        "inputs": [
            {"name": "owner", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "spender", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "value", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
]

# -- SkillRegistry -------------------------------------------------------------

SKILL_REGISTRY_ABI = [
    # -- Functions --
    {
        "type": "function",
        "name": "registerSkill",
        "inputs": [
            {"name": "ipfsCid", "type": "string", "internalType": "string"},
            {"name": "name", "type": "string", "internalType": "string"},
            {"name": "domain", "type": "string", "internalType": "string"},
            {"name": "tags", "type": "string[]", "internalType": "string[]"},
            {"name": "inputKeys", "type": "string[]", "internalType": "string[]"},
            {"name": "outputKeys", "type": "string[]", "internalType": "string[]"},
            {"name": "price", "type": "uint256", "internalType": "uint256"},
            {"name": "licenseType", "type": "uint8", "internalType": "uint8"},
        ],
        "outputs": [{"name": "skillId", "type": "bytes32", "internalType": "bytes32"}],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "updateSkill",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "newIpfsCid", "type": "string", "internalType": "string"},
            {"name": "newPrice", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "deactivateSkill",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "getSkill",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [
            {"name": "creator", "type": "address", "internalType": "address"},
            {"name": "ipfsCid", "type": "string", "internalType": "string"},
            {"name": "name", "type": "string", "internalType": "string"},
            {"name": "domain", "type": "string", "internalType": "string"},
            {"name": "price", "type": "uint256", "internalType": "uint256"},
            {"name": "licenseType", "type": "uint8", "internalType": "uint8"},
            {"name": "version", "type": "uint256", "internalType": "uint256"},
            {"name": "active", "type": "bool", "internalType": "bool"},
            {"name": "totalValidations", "type": "uint256", "internalType": "uint256"},
            {"name": "successRate", "type": "uint256", "internalType": "uint256"},
        ],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "creatorOf",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "address", "internalType": "address"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "isActive",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "priceOf",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "skillCount",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "skillIds",
        "inputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
        "stateMutability": "view",
    },
    # -- Events --
    {
        "type": "event",
        "name": "SkillRegistered",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "creator", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "name", "type": "string", "indexed": False, "internalType": "string"},
            {"name": "ipfsCid", "type": "string", "indexed": False, "internalType": "string"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "SkillUpdated",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "version", "type": "uint256", "indexed": False, "internalType": "uint256"},
            {"name": "newIpfsCid", "type": "string", "indexed": False, "internalType": "string"},
            {"name": "newPrice", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "SkillDeactivated",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "SkillStatsUpdated",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "totalValidations", "type": "uint256", "indexed": False, "internalType": "uint256"},
            {"name": "successRate", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
]

# -- NodeRegistry --------------------------------------------------------------

NODE_REGISTRY_ABI = [
    # -- Functions --
    {
        "type": "function",
        "name": "registerNode",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "publicKey", "type": "bytes", "internalType": "bytes"},
            {"name": "domainTags", "type": "string[]", "internalType": "string[]"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "deregisterNode",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "getNode",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [
            {"name": "", "type": "bytes32", "internalType": "bytes32"},
            {"name": "", "type": "address", "internalType": "address"},
            {"name": "", "type": "bytes", "internalType": "bytes"},
            {"name": "", "type": "string[]", "internalType": "string[]"},
            {"name": "", "type": "uint256", "internalType": "uint256"},
            {"name": "", "type": "bool", "internalType": "bool"},
            {"name": "", "type": "uint256", "internalType": "uint256"},
        ],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "isRegistered",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "ownerToNode",
        "inputs": [
            {"name": "", "type": "address", "internalType": "address"},
        ],
        "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "nodeOwner",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "address", "internalType": "address"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "nodeCount",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    # -- Events --
    {
        "type": "event",
        "name": "NodeRegistered",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "owner", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "stakeAmount", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "NodeDeregistered",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "owner", "type": "address", "indexed": True, "internalType": "address"},
        ],
        "anonymous": False,
    },
]

# -- TrustOracle ---------------------------------------------------------------

TRUST_ORACLE_ABI = [
    # -- Functions --
    {
        "type": "function",
        "name": "reportTrust",
        "inputs": [
            {"name": "targetNodeId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "trustScore", "type": "uint256", "internalType": "uint256"},
            {"name": "", "type": "bytes", "internalType": "bytes"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "getTrustScore",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "getTrustWeightedVote",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "attestationCount",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    # -- Events --
    {
        "type": "event",
        "name": "TrustReported",
        "inputs": [
            {"name": "targetNodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "reporterNodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "trustScore", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "TrustAggregated",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "aggregatedScore", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
]

# -- ValidationRegistry --------------------------------------------------------

VALIDATION_REGISTRY_ABI = [
    # -- Functions --
    {
        "type": "function",
        "name": "submitValidation",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "success", "type": "bool", "internalType": "bool"},
            {"name": "shadowRunCount", "type": "uint256", "internalType": "uint256"},
            {"name": "matchCount", "type": "uint256", "internalType": "uint256"},
            {"name": "avgSimilarity", "type": "uint256", "internalType": "uint256"},
            {"name": "resultIpfsCid", "type": "string", "internalType": "string"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "getValidationConsensus",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [
            {"name": "hasConsensus", "type": "bool", "internalType": "bool"},
            {"name": "numValidators", "type": "uint256", "internalType": "uint256"},
            {"name": "successRateBps", "type": "uint256", "internalType": "uint256"},
        ],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "challengeValidation",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "targetValidationIdx", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "resolveChallenge",
        "inputs": [
            {"name": "challengeId", "type": "uint256", "internalType": "uint256"},
            {"name": "upheld", "type": "bool", "internalType": "bool"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    # -- Events --
    {
        "type": "event",
        "name": "ValidationSubmitted",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "validatorNodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "success", "type": "bool", "indexed": False, "internalType": "bool"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "ConsensusReached",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "totalValidations", "type": "uint256", "indexed": False, "internalType": "uint256"},
            {"name": "successRate", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "ChallengeCreated",
        "inputs": [
            {"name": "challengeId", "type": "uint256", "indexed": True, "internalType": "uint256"},
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "challengerNodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "ChallengeResolved",
        "inputs": [
            {"name": "challengeId", "type": "uint256", "indexed": True, "internalType": "uint256"},
            {"name": "upheld", "type": "bool", "indexed": False, "internalType": "bool"},
        ],
        "anonymous": False,
    },
]

# -- Marketplace ---------------------------------------------------------------

MARKETPLACE_ABI = [
    # -- Functions --
    {
        "type": "function",
        "name": "purchaseSkill",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "claimRoyalties",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "claimValidatorRewards",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "subscribe",
        "inputs": [
            {"name": "tier", "type": "uint8", "internalType": "uint8"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "checkAccess",
        "inputs": [
            {"name": "user", "type": "address", "internalType": "address"},
            {"name": "skillId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "creatorRoyalties",
        "inputs": [
            {"name": "", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "validatorRewards",
        "inputs": [
            {"name": "", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    # -- Events --
    {
        "type": "event",
        "name": "SkillPurchased",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "buyer", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "price", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "RoyaltiesClaimed",
        "inputs": [
            {"name": "skillId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "creator", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "amount", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "ValidatorRewardsClaimed",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "owner", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "amount", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "Subscribed",
        "inputs": [
            {"name": "user", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "tier", "type": "uint8", "indexed": False, "internalType": "uint8"},
            {"name": "expiresAt", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
]

# -- Staking -------------------------------------------------------------------

STAKING_ABI = [
    # -- Functions --
    {
        "type": "function",
        "name": "stake",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "unstake",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "amount", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "completeUnstake",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "stakedAmount",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "getTier",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint8", "internalType": "uint8"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "rewardMultiplier",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "isBanned",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "view",
    },
    # -- Events --
    {
        "type": "event",
        "name": "Staked",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "amount", "type": "uint256", "indexed": False, "internalType": "uint256"},
            {"name": "tier", "type": "uint8", "indexed": False, "internalType": "uint8"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "UnstakeRequested",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "amount", "type": "uint256", "indexed": False, "internalType": "uint256"},
            {"name": "availableAt", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "Unstaked",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "amount", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "Slashed",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
            {"name": "amount", "type": "uint256", "indexed": False, "internalType": "uint256"},
            {"name": "reason", "type": "uint8", "indexed": False, "internalType": "uint8"},
            {"name": "affected", "type": "address", "indexed": False, "internalType": "address"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "Banned",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "indexed": True, "internalType": "bytes32"},
        ],
        "anonymous": False,
    },
]

# -- GovernanceDAO -------------------------------------------------------------

GOVERNANCE_DAO_ABI = [
    # -- Functions --
    {
        "type": "function",
        "name": "propose",
        "inputs": [
            {"name": "proposalType", "type": "uint8", "internalType": "uint8"},
            {"name": "data", "type": "bytes", "internalType": "bytes"},
            {"name": "description", "type": "string", "internalType": "string"},
        ],
        "outputs": [{"name": "proposalId", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "vote",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "internalType": "uint256"},
            {"name": "support", "type": "bool", "internalType": "bool"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "execute",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "finalize",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "cancel",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
    {
        "type": "function",
        "name": "getProposalState",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "internalType": "uint256"},
        ],
        "outputs": [{"name": "", "type": "uint8", "internalType": "uint8"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "proposalCount",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "votingPower",
        "inputs": [
            {"name": "nodeId", "type": "bytes32", "internalType": "bytes32"},
        ],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    # -- Events --
    {
        "type": "event",
        "name": "ProposalCreated",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "indexed": True, "internalType": "uint256"},
            {"name": "proposer", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "proposalType", "type": "uint8", "indexed": False, "internalType": "uint8"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "Voted",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "indexed": True, "internalType": "uint256"},
            {"name": "voter", "type": "address", "indexed": True, "internalType": "address"},
            {"name": "support", "type": "bool", "indexed": False, "internalType": "bool"},
            {"name": "weight", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "ProposalExecuted",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "indexed": True, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "ProposalCancelled",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "indexed": True, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
    {
        "type": "event",
        "name": "ProposalQueued",
        "inputs": [
            {"name": "proposalId", "type": "uint256", "indexed": True, "internalType": "uint256"},
            {"name": "executableAt", "type": "uint256", "indexed": False, "internalType": "uint256"},
        ],
        "anonymous": False,
    },
]
