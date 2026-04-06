export const ValidationRegistryABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_nodeRegistry",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_skillRegistry",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "CONSENSUS_THRESHOLD_BPS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "DOMAIN_COMPETENCE_MIN",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "MIN_VALIDATORS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "NUM_ARBITRATORS",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "bootstrapExpertise",
    "inputs": [
      {
        "name": "nodeId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "domain",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "challengeCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "challengeValidation",
    "inputs": [
      {
        "name": "skillId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "targetValidationIdx",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "challenges",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "challengeId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "skillId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "challengerNodeId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "targetValidationIdx",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "votesUpheld",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "votesDenied",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "resolved",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "upheld",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "createdAt",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "domainExpertise",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getValidationConsensus",
    "inputs": [
      {
        "name": "skillId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "hasConsensus",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "numValidators",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "successRateBps",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextChallengeId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nodeRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract NodeRegistry"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerDomainContribution",
    "inputs": [
      {
        "name": "nodeId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "domain",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setStakingContract",
    "inputs": [
      {
        "name": "_staking",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "skillRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract SkillRegistry"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "stakingContract",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "submitValidation",
    "inputs": [
      {
        "name": "skillId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "domain",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "success",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "shadowRunCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "matchCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "avgSimilarity",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "resultIpfsCid",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "successCount",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalCount",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "validationCount",
    "inputs": [
      {
        "name": "skillId",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "validations",
    "inputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "skillId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "validatorNodeId",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "success",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "shadowRunCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "matchCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "avgSimilarity",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "resultIpfsCid",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "validatorSubmissionCount",
    "inputs": [
      {
        "name": "validator",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "voteOnChallenge",
    "inputs": [
      {
        "name": "challengeId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "upheld",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "ArbitratorVoted",
    "inputs": [
      {
        "name": "challengeId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "arbitratorNodeId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "upheld",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ChallengeCreated",
    "inputs": [
      {
        "name": "challengeId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "skillId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "challengerNodeId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ChallengeResolved",
    "inputs": [
      {
        "name": "challengeId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "upheld",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ConsensusReached",
    "inputs": [
      {
        "name": "skillId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "totalValidations",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "successRate",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "StakingContractSet",
    "inputs": [
      {
        "name": "stakingContract",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ValidationSubmitted",
    "inputs": [
      {
        "name": "skillId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "validatorNodeId",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "success",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const;
