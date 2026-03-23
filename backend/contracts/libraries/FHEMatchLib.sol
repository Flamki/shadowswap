// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library FHEMatchLib {
    function gte(uint64 a, uint64 b) internal pure returns (bool) {
        return a >= b;
    }

    function add(uint64 a, uint64 b) internal pure returns (uint64) {
        return a + b;
    }

    function div(uint64 a, uint64 b) internal pure returns (uint64) {
        require(b != 0, 'DIV_BY_ZERO');
        return a / b;
    }

    function min(uint64 a, uint64 b) internal pure returns (uint64) {
        return a < b ? a : b;
    }

    function sub(uint64 a, uint64 b) internal pure returns (uint64) {
        require(a >= b, 'UNDERFLOW');
        return a - b;
    }

    function select(bool condition, uint64 ifTrue, uint64 ifFalse) internal pure returns (uint64) {
        return condition ? ifTrue : ifFalse;
    }
}
