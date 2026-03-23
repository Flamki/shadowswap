// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@fhenixprotocol/contracts/FHE.sol';

library FHEMatchLib {
    function gte(euint64 a, euint64 b) internal pure returns (ebool) {
        return FHE.gte(a, b);
    }

    function add(euint64 a, euint64 b) internal pure returns (euint64) {
        return FHE.add(a, b);
    }

    function div(euint64 a, uint64 b) internal pure returns (euint64) {
        require(b != 0, 'DIV_BY_ZERO');

        // The current contracts package exposes euint div up to euint32 only.
        // Keep behavior deterministic by decrypting, dividing, and re-encrypting.
        uint64 plain = FHE.decrypt(a, 0);
        return FHE.asEuint64(uint256(plain / b));
    }

    function min(euint64 a, euint64 b) internal pure returns (euint64) {
        return FHE.min(a, b);
    }

    function sub(euint64 a, euint64 b) internal pure returns (euint64) {
        return FHE.sub(a, b);
    }

    function select(ebool condition, euint64 ifTrue, euint64 ifFalse) internal pure returns (euint64) {
        bool decision = FHE.decrypt(condition, false);
        return decision ? ifTrue : ifFalse;
    }
}
