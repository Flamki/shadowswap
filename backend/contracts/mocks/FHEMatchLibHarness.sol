// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '../libraries/FHEMatchLib.sol';

contract FHEMatchLibHarness {
    function gte(uint64 a, uint64 b) external pure returns (bool) {
        return FHEMatchLib.gte(a, b);
    }

    function add(uint64 a, uint64 b) external pure returns (uint64) {
        return FHEMatchLib.add(a, b);
    }

    function div(uint64 a, uint64 b) external pure returns (uint64) {
        return FHEMatchLib.div(a, b);
    }

    function min(uint64 a, uint64 b) external pure returns (uint64) {
        return FHEMatchLib.min(a, b);
    }

    function sub(uint64 a, uint64 b) external pure returns (uint64) {
        return FHEMatchLib.sub(a, b);
    }

    function select(bool condition, uint64 ifTrue, uint64 ifFalse) external pure returns (uint64) {
        return FHEMatchLib.select(condition, ifTrue, ifFalse);
    }
}
