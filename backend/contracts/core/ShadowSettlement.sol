// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import '../interfaces/IShadowOrderBook.sol';
import '../interfaces/IShadowVault.sol';
import '../libraries/OrderLib.sol';

contract ShadowSettlement is Ownable, ReentrancyGuard {
    IShadowOrderBook public orderBook;
    IShadowVault public vault;
    address public decryptionOracle;

    uint256 private constant PRICE_DECIMALS = 1e8;
    uint256 private constant SCALE_E8_TO_E18 = 1e10;

    event SettlementExecuted(
        bytes32 indexed matchId,
        uint64 settlementPrice,
        uint64 fillAmount,
        uint256 tokenATransferred,
        uint256 tokenBTransferred
    );

    event SettlementSkipped(bytes32 indexed matchId, string reason);

    error InvalidAddress();
    error NotOracle();
    error InvalidMatch();

    modifier onlyOracle() {
        if (msg.sender != decryptionOracle && msg.sender != owner()) revert NotOracle();
        _;
    }

    constructor(address orderBookAddress, address vaultAddress) Ownable(msg.sender) {
        if (orderBookAddress == address(0) || vaultAddress == address(0)) revert InvalidAddress();
        orderBook = IShadowOrderBook(orderBookAddress);
        vault = IShadowVault(vaultAddress);
        decryptionOracle = msg.sender;
    }

    function setDecryptionOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert InvalidAddress();
        decryptionOracle = newOracle;
    }

    function executeSettlement(
        bytes32 matchId,
        uint64 settlementPrice,
        uint64 fillAmount,
        uint64,
        uint64
    ) external onlyOracle nonReentrant {
        OrderLib.MatchResult memory matchResult = orderBook.getMatch(matchId);
        if (!matchResult.exists || matchResult.settled) revert InvalidMatch();

        if (settlementPrice == 0 || fillAmount == 0) {
            emit SettlementSkipped(matchId, 'NO_PRICE_MATCH');
            orderBook.markSettlementComplete(matchId, settlementPrice, fillAmount);
            return;
        }

        (
            address buyer,
            address tokenA,
            address tokenB,
            ,
            ,
            ,
            bool buyFilled
        ) = orderBook.getOrderForSettlement(matchResult.buyOrderId);

        (
            address seller,
            address sellTokenA,
            address sellTokenB,
            ,
            ,
            ,
            bool sellFilled
        ) = orderBook.getOrderForSettlement(matchResult.sellOrderId);

        if (buyer == address(0) || seller == address(0)) revert InvalidMatch();
        if (tokenA != sellTokenA || tokenB != sellTokenB) revert InvalidMatch();

        uint256 tokenATransferAmount = uint256(fillAmount) * SCALE_E8_TO_E18;
        uint256 quoteNotionalE8 = (uint256(settlementPrice) * uint256(fillAmount)) / PRICE_DECIMALS;
        uint256 tokenBTransferAmount = quoteNotionalE8 * SCALE_E8_TO_E18;

        vault.releaseOnFill(matchId, matchResult.sellOrderId, buyer, tokenATransferAmount);
        vault.releaseOnFill(matchId, matchResult.buyOrderId, seller, tokenBTransferAmount);

        if (buyFilled) {
            vault.releaseOnCancel(matchResult.buyOrderId, buyer);
        }

        if (sellFilled) {
            vault.releaseOnCancel(matchResult.sellOrderId, seller);
        }

        orderBook.markSettlementComplete(matchId, settlementPrice, fillAmount);

        emit SettlementExecuted(matchId, settlementPrice, fillAmount, tokenATransferAmount, tokenBTransferAmount);
    }
}
