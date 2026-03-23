// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library OrderLib {
    uint8 internal constant SELL = 0;
    uint8 internal constant BUY = 1;

    struct EncryptedOrder {
        uint64 encPrice; // 8 decimals
        uint64 encAmount; // 8 decimals
        uint8 encDirection; // BUY=1, SELL=0
        address trader;
        address tokenA;
        address tokenB;
        uint256 timestamp;
        uint256 expiry;
        bytes32 orderId;
        bool active;
        bool filled;
        bool partiallyFilled;
    }

    struct MatchResult {
        bytes32 buyOrderId;
        bytes32 sellOrderId;
        uint64 encSettlementPrice;
        uint64 encFillAmount;
        uint64 encBuyResidual;
        uint64 encSellResidual;
        uint256 timestamp;
        bool settled;
        bool exists;
    }

    function isBuy(EncryptedOrder storage order) internal view returns (bool) {
        return order.encDirection == BUY;
    }

    function isSell(EncryptedOrder storage order) internal view returns (bool) {
        return order.encDirection == SELL;
    }
}
