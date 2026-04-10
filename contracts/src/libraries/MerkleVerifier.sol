// SPDX-License-Identifier: UNLICENSED
// Copyright (c) 2024-present The Wayfinder Trust — FlowFabric
// All Rights Reserved. Proprietary and Confidential.

pragma solidity ^0.8.24;

/**
 * @title MerkleVerifier
 * @notice Standard Merkle proof verification library.
 * @dev Used for off-chain data attestation in the FlowFabric network.
 */
library MerkleVerifier {
    /**
     * @notice Verify that a leaf belongs to a Merkle tree with the given root.
     * @param leaf  The hashed leaf node.
     * @param proof The sibling hashes from leaf to root.
     * @param root  The expected Merkle root.
     * @return valid True if the proof is valid.
     */
    function verify(
        bytes32 leaf,
        bytes32[] memory proof,
        bytes32 root
    ) internal pure returns (bool) {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            if (computed <= proof[i]) {
                computed = keccak256(abi.encodePacked(computed, proof[i]));
            } else {
                computed = keccak256(abi.encodePacked(proof[i], computed));
            }
        }
        return computed == root;
    }
}
