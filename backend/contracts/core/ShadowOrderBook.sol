// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';

import '../libraries/OrderLib.sol';
import '../libraries/FHEMatchLib.sol';
import '../interfaces/IShadowVault.sol';
import '../interfaces/IShadowOrderBook.sol';

contract ShadowOrderBook is Ownable, ReentrancyGuard, Pausable, IShadowOrderBook {
    using OrderLib for OrderLib.EncryptedOrder;

    uint8 private constant BUY = 1;
    uint8 private constant SELL = 0;

    mapping(bytes32 => OrderLib.EncryptedOrder) public orders;
    mapping(bytes32 => OrderLib.MatchResult) public matches;

    bytes32[] private activeOrderIds;
    mapping(bytes32 => uint256) private activeOrderIndexPlusOne;

    IShadowVault public vault;
    address public settlement;
    address public keeper;

    uint256 public totalOrdersSubmitted;
    uint256 public totalOrdersCancelled;
    uint256 public totalOrdersExpired;
    uint256 public totalMatchesFound;
    uint256 public totalSettlementsExecuted;

    event OrderSubmitted(
        bytes32 indexed orderId,
        address indexed trader,
        address indexed tokenA,
        address tokenB,
        uint256 timestamp,
        uint256 expiry
    );

    event OrderCancelled(bytes32 indexed orderId, address indexed trader, uint256 timestamp);

    event MatchFound(
        bytes32 indexed matchId,
        bytes32 indexed buyOrderId,
        bytes32 indexed sellOrderId,
        uint256 timestamp
    );

    event OrderSettled(
        bytes32 indexed matchId,
        address indexed buyer,
        address indexed seller,
        uint64 settlementPrice,
        uint64 fillAmount,
        uint256 timestamp
    );

    event OrderExpired(bytes32 indexed orderId, address indexed trader);

    error InvalidAddress();
    error InvalidInput();
    error InvalidOrderState();
    error NotOrderOwner();
    error NotSettlement();

    modifier onlySettlement() {
        if (msg.sender != settlement) revert NotSettlement();
        _;
    }

    constructor(address initialVault) Ownable(msg.sender) {
        if (initialVault == address(0)) revert InvalidAddress();
        vault = IShadowVault(initialVault);
    }

    function setVault(address newVault) external onlyOwner {
        if (newVault == address(0)) revert InvalidAddress();
        vault = IShadowVault(newVault);
    }

    function setSettlement(address newSettlement) external onlyOwner {
        if (newSettlement == address(0)) revert InvalidAddress();
        settlement = newSettlement;
    }

    function setKeeper(address newKeeper) external onlyOwner {
        if (newKeeper == address(0)) revert InvalidAddress();
        keeper = newKeeper;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function submitOrder(
        uint64 inPrice,
        uint64 inAmount,
        uint8 inDir,
        address tokenA,
        address tokenB,
        uint256 expiry
    ) external nonReentrant whenNotPaused returns (bytes32 orderId) {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidAddress();
        if (tokenA == tokenB) revert InvalidInput();
        if (inPrice == 0 || inAmount == 0) revert InvalidInput();
        if (inDir != BUY && inDir != SELL) revert InvalidInput();
        if (expiry <= block.timestamp || expiry > block.timestamp + 7 days) revert InvalidInput();

        orderId = keccak256(
            abi.encodePacked(msg.sender, tokenA, tokenB, block.timestamp, block.prevrandao, totalOrdersSubmitted)
        );
        if (orders[orderId].active) revert InvalidOrderState();

        orders[orderId] = OrderLib.EncryptedOrder({
            encPrice: inPrice,
            encAmount: inAmount,
            encDirection: inDir,
            trader: msg.sender,
            tokenA: tokenA,
            tokenB: tokenB,
            timestamp: block.timestamp,
            expiry: expiry,
            orderId: orderId,
            active: true,
            filled: false,
            partiallyFilled: false
        });

        _addToActive(orderId);

        totalOrdersSubmitted += 1;

        vault.lockForOrder(orderId, msg.sender, tokenA, tokenB, inPrice, inAmount, inDir);

        emit OrderSubmitted(orderId, msg.sender, tokenA, tokenB, block.timestamp, expiry);
    }

    function tryMatch(bytes32 buyId, bytes32 sellId) external nonReentrant whenNotPaused returns (bytes32 matchId) {
        OrderLib.EncryptedOrder storage buy = orders[buyId];
        OrderLib.EncryptedOrder storage sell = orders[sellId];

        if (!buy.active || !sell.active) revert InvalidOrderState();
        if (buy.filled || sell.filled) revert InvalidOrderState();
        if (buy.encDirection != BUY || sell.encDirection != SELL) revert InvalidInput();
        if (buy.tokenA != sell.tokenA || buy.tokenB != sell.tokenB) revert InvalidInput();
        if (block.timestamp >= buy.expiry || block.timestamp >= sell.expiry) revert InvalidOrderState();
        if (buy.trader == sell.trader) revert InvalidInput();

        bool priceMatch = FHEMatchLib.gte(buy.encPrice, sell.encPrice);
        if (!priceMatch) {
            return bytes32(0);
        }

        uint64 sumPrices = FHEMatchLib.add(buy.encPrice, sell.encPrice);
        uint64 settlementPrice = FHEMatchLib.div(sumPrices, 2);
        uint64 fillAmount = FHEMatchLib.min(buy.encAmount, sell.encAmount);

        uint64 buyResidual = FHEMatchLib.sub(buy.encAmount, fillAmount);
        uint64 sellResidual = FHEMatchLib.sub(sell.encAmount, fillAmount);

        matchId = keccak256(abi.encodePacked(buyId, sellId, block.timestamp, totalMatchesFound));

        matches[matchId] = OrderLib.MatchResult({
            buyOrderId: buyId,
            sellOrderId: sellId,
            encSettlementPrice: settlementPrice,
            encFillAmount: fillAmount,
            encBuyResidual: buyResidual,
            encSellResidual: sellResidual,
            timestamp: block.timestamp,
            settled: false,
            exists: true
        });

        if (buyResidual == 0) {
            buy.filled = true;
            buy.active = false;
            _removeFromActive(buyId);
        } else {
            buy.partiallyFilled = true;
            buy.encAmount = buyResidual;
        }

        if (sellResidual == 0) {
            sell.filled = true;
            sell.active = false;
            _removeFromActive(sellId);
        } else {
            sell.partiallyFilled = true;
            sell.encAmount = sellResidual;
        }

        totalMatchesFound += 1;

        emit MatchFound(matchId, buyId, sellId, block.timestamp);
    }

    function cancelOrder(bytes32 orderId) external nonReentrant whenNotPaused {
        OrderLib.EncryptedOrder storage order = orders[orderId];

        if (order.trader != msg.sender) revert NotOrderOwner();
        if (!order.active || order.filled) revert InvalidOrderState();

        order.active = false;
        _removeFromActive(orderId);

        vault.releaseRemaining(orderId, msg.sender);

        totalOrdersCancelled += 1;

        emit OrderCancelled(orderId, msg.sender, block.timestamp);
    }

    function expireBatch(bytes32[] calldata orderIds) external nonReentrant whenNotPaused {
        uint256 length = orderIds.length;
        for (uint256 i = 0; i < length; i++) {
            bytes32 orderId = orderIds[i];
            OrderLib.EncryptedOrder storage order = orders[orderId];

            if (order.active && !order.filled && block.timestamp >= order.expiry) {
                order.active = false;
                _removeFromActive(orderId);

                vault.releaseRemaining(orderId, order.trader);
                totalOrdersExpired += 1;

                emit OrderExpired(orderId, order.trader);
            }
        }
    }

    function getActiveOrderIds() external view returns (bytes32[] memory) {
        return activeOrderIds;
    }

    function getOrderMeta(bytes32 orderId)
        external
        view
        returns (address trader, address tokenA, address tokenB, uint256 timestamp, uint256 expiry, bool active)
    {
        OrderLib.EncryptedOrder storage order = orders[orderId];
        return (order.trader, order.tokenA, order.tokenB, order.timestamp, order.expiry, order.active);
    }

    function getOrderForSettlement(bytes32 orderId)
        external
        view
        returns (
            address trader,
            address tokenA,
            address tokenB,
            uint64 encPrice,
            uint64 encAmount,
            bool active,
            bool filled
        )
    {
        OrderLib.EncryptedOrder storage order = orders[orderId];
        return (
            order.trader,
            order.tokenA,
            order.tokenB,
            order.encPrice,
            order.encAmount,
            order.active,
            order.filled
        );
    }

    function getMatch(bytes32 matchId) external view returns (OrderLib.MatchResult memory) {
        return matches[matchId];
    }

    function markSettlementComplete(bytes32 matchId, uint64 settlementPrice, uint64 fillAmount) external onlySettlement {
        OrderLib.MatchResult storage matchResult = matches[matchId];
        if (!matchResult.exists || matchResult.settled) revert InvalidOrderState();

        matchResult.settled = true;
        totalSettlementsExecuted += 1;

        address buyer = orders[matchResult.buyOrderId].trader;
        address seller = orders[matchResult.sellOrderId].trader;

        emit OrderSettled(matchId, buyer, seller, settlementPrice, fillAmount, block.timestamp);
    }

    function _addToActive(bytes32 orderId) internal {
        activeOrderIds.push(orderId);
        activeOrderIndexPlusOne[orderId] = activeOrderIds.length;
    }

    function _removeFromActive(bytes32 orderId) internal {
        uint256 indexPlusOne = activeOrderIndexPlusOne[orderId];
        if (indexPlusOne == 0) {
            return;
        }

        uint256 index = indexPlusOne - 1;
        uint256 lastIndex = activeOrderIds.length - 1;

        if (index != lastIndex) {
            bytes32 lastOrderId = activeOrderIds[lastIndex];
            activeOrderIds[index] = lastOrderId;
            activeOrderIndexPlusOne[lastOrderId] = index + 1;
        }

        activeOrderIds.pop();
        delete activeOrderIndexPlusOne[orderId];
    }
}
