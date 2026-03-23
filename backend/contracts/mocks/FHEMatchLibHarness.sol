// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@fhenixprotocol/contracts/FHE.sol';

import '../libraries/FHEMatchLib.sol';

contract FHEMatchLibHarness {
    function gte(uint64 a, uint64 b) external pure returns (bool) {
        ebool result = FHEMatchLib.gte(FHE.asEuint64(uint256(a)), FHE.asEuint64(uint256(b)));
        return FHE.decrypt(result, false);
    }

    function add(uint64 a, uint64 b) external pure returns (uint64) {
        euint64 result = FHEMatchLib.add(FHE.asEuint64(uint256(a)), FHE.asEuint64(uint256(b)));
        return FHE.decrypt(result, 0);
    }

    function div(uint64 a, uint64 b) external pure returns (uint64) {
        euint64 result = FHEMatchLib.div(FHE.asEuint64(uint256(a)), b);
        return FHE.decrypt(result, 0);
    }

    function min(uint64 a, uint64 b) external pure returns (uint64) {
        euint64 result = FHEMatchLib.min(FHE.asEuint64(uint256(a)), FHE.asEuint64(uint256(b)));
        return FHE.decrypt(result, 0);
    }

    function sub(uint64 a, uint64 b) external pure returns (uint64) {
        euint64 result = FHEMatchLib.sub(FHE.asEuint64(uint256(a)), FHE.asEuint64(uint256(b)));
        return FHE.decrypt(result, 0);
    }

    function select(bool condition, uint64 ifTrue, uint64 ifFalse) external pure returns (uint64) {
        euint64 result = FHEMatchLib.select(
            FHE.asEbool(condition),
            FHE.asEuint64(uint256(ifTrue)),
            FHE.asEuint64(uint256(ifFalse))
        );
        return FHE.decrypt(result, 0);
    }
}
