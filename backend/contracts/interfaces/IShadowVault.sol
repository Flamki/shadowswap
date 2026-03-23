// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IShadowVault {
    function lockForOrder(
        bytes32 orderId,
        address trader,
        address tokenA,
        address tokenB,
        uint64 priceE8,
        uint64 amountE8,
        uint8 direction
    ) external;

    function releaseOnCancel(bytes32 orderId, address recipient) external returns (uint256 amount);

    function releaseOnFill(
        bytes32 matchId,
        bytes32 orderId,
        address recipient,
        uint256 amount
    ) external;

    function setOrderBook(address newOrderBook) external;

    function setSettlement(address newSettlement) external;
}
