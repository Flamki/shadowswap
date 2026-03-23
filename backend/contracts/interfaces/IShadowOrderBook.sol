// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '../libraries/OrderLib.sol';

interface IShadowOrderBook {
    function getMatch(bytes32 matchId) external view returns (OrderLib.MatchResult memory);

    function getOrderForSettlement(bytes32 orderId)
        external
        view
        returns (
            address trader,
            address tokenA,
            address tokenB,
            uint64 priceE8,
            uint64 amountE8,
            bool active,
            bool filled
        );

    function markSettlementComplete(bytes32 matchId, uint64 settlementPrice, uint64 fillAmount) external;
}
