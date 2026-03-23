// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IShadowVault {
    function lockForOrder(
        bytes32 orderId,
        address trader,
        address tokenA,
        address tokenB,
        uint64 encPrice,
        uint64 encAmount,
        uint8 encDirection
    ) external;

    function releaseRemaining(bytes32 orderId, address recipient) external returns (uint256 amount);

    function transferLocked(
        bytes32 matchId,
        bytes32 orderId,
        address recipient,
        uint256 amount
    ) external;

    function setOrderBook(address newOrderBook) external;

    function setSettlement(address newSettlement) external;
}
