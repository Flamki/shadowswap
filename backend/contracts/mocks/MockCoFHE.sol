// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockCoFHE {
    function decryptUint64(uint64 value) external pure returns (uint64) {
        return value;
    }
}
