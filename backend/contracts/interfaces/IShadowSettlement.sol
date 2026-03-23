// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IShadowSettlement {
    function executeSettlement(
        bytes32 matchId,
        uint64 settlementPrice,
        uint64 fillAmount,
        uint64 buyResidual,
        uint64 sellResidual
    ) external;
}
