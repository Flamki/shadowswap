// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@fhenixprotocol/contracts/FHE.sol';

library OrderLib {
    uint8 internal constant SELL = 0;
    uint8 internal constant BUY = 1;

    struct EncryptedOrder {
        euint64 encPrice; // 8 decimals
        euint64 encAmount; // 8 decimals
        euint8 encDirection; // BUY=1, SELL=0
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
        euint64 encSettlementPrice;
        euint64 encFillAmount;
        euint64 encBuyResidual;
        euint64 encSellResidual;
        uint256 timestamp;
        bool settled;
        bool exists;
    }
}
