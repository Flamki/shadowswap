// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool, euint64, euint8, inEuint64, inEuint8 } from '@fhenixprotocol/contracts/FHE.sol';
import { Permissioned, Permission } from '@fhenixprotocol/contracts/access/Permissioned.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import '../interfaces/IShadowOrderBook.sol';
import '../interfaces/IShadowVault.sol';
import '../libraries/FHEMatchLib.sol';
import '../libraries/OrderLib.sol';

contract ShadowOrderBook is Ownable, ReentrancyGuard, Pausable, Permissioned, IShadowOrderBook {
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
    error NotAuthorized();

    modifier onlySettlement() {
        if (msg.sender != settlement) revert NotSettlement();
        _;
    }

    modifier onlyKeeperOrSettlement() {
        if (msg.sender != keeper && msg.sender != settlement && msg.sender != owner()) revert NotAuthorized();
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
        inEuint64 calldata inPrice,
        inEuint64 calldata inAmount,
        inEuint8 calldata inDir,
        address tokenA,
        address tokenB,
        uint256 expiry
    ) external nonReentrant whenNotPaused returns (bytes32 orderId) {
        uint64 lockPrice = _decodeUint64FromInput(inPrice.data);
        uint64 lockAmount = _decodeUint64FromInput(inAmount.data);
        uint8 direction = _decodeUint8FromInput(inDir.data);

        euint64 encPrice = FHE.asEuint64(inPrice);
        euint64 encAmount = FHE.asEuint64(inAmount);
        euint8 encDir = FHE.asEuint8(inDir);

        // Local mocked inputs are plain bytes; on some runtimes verify() may not initialize these handles.
        // Fall back to trivial encryption from decoded bytes to preserve encrypted-path compatibility.
        if (!FHE.isInitialized(encPrice)) {
            encPrice = FHE.asEuint64(uint256(lockPrice));
        }
        if (!FHE.isInitialized(encAmount)) {
            encAmount = FHE.asEuint64(uint256(lockAmount));
        }
        if (!FHE.isInitialized(encDir)) {
            encDir = FHE.asEuint8(uint256(direction));
        }

        if (lockPrice == 0) {
            lockPrice = FHE.decrypt(encPrice, 0);
        }
        if (lockAmount == 0) {
            lockAmount = FHE.decrypt(encAmount, 0);
        }
        if (direction != BUY && direction != SELL) {
            direction = FHE.decrypt(encDir, SELL);
        }

        orderId = _submitOrder(encPrice, encAmount, encDir, lockPrice, lockAmount, direction, tokenA, tokenB, expiry);
    }

    function submitOrder(
        uint64 inPrice,
        uint64 inAmount,
        uint8 inDir,
        address tokenA,
        address tokenB,
        uint256 expiry
    ) external nonReentrant whenNotPaused returns (bytes32 orderId) {
        euint64 encPrice = FHE.asEuint64(uint256(inPrice));
        euint64 encAmount = FHE.asEuint64(uint256(inAmount));
        euint8 encDir = FHE.asEuint8(uint256(inDir));

        orderId = _submitOrder(encPrice, encAmount, encDir, inPrice, inAmount, inDir, tokenA, tokenB, expiry);
    }

    function tryMatch(bytes32 buyId, bytes32 sellId) external nonReentrant whenNotPaused returns (bytes32 matchId) {
        OrderLib.EncryptedOrder storage buy = orders[buyId];
        OrderLib.EncryptedOrder storage sell = orders[sellId];

        if (!buy.active || !sell.active) revert InvalidOrderState();
        if (buy.filled || sell.filled) revert InvalidOrderState();

        uint8 buyDirection = FHE.decrypt(buy.encDirection, SELL);
        uint8 sellDirection = FHE.decrypt(sell.encDirection, SELL);
        if (buyDirection != BUY || sellDirection != SELL) revert InvalidInput();

        if (buy.tokenA != sell.tokenA || buy.tokenB != sell.tokenB) revert InvalidInput();
        if (block.timestamp >= buy.expiry || block.timestamp >= sell.expiry) revert InvalidOrderState();
        if (buy.trader == sell.trader) revert InvalidInput();

        ebool priceMatch = FHEMatchLib.gte(buy.encPrice, sell.encPrice);
        euint64 sumPrices = FHEMatchLib.add(buy.encPrice, sell.encPrice);
        euint64 settlementPrice = FHEMatchLib.div(sumPrices, 2);
        euint64 fillAmount = FHEMatchLib.min(buy.encAmount, sell.encAmount);
        euint64 buyResidual = FHEMatchLib.sub(buy.encAmount, fillAmount);
        euint64 sellResidual = FHEMatchLib.sub(sell.encAmount, fillAmount);

        euint64 zero = FHE.asEuint64(0);
        euint64 finalSettlement = FHEMatchLib.select(priceMatch, settlementPrice, zero);
        euint64 finalFill = FHEMatchLib.select(priceMatch, fillAmount, zero);
        euint64 finalBuyRes = FHEMatchLib.select(priceMatch, buyResidual, buy.encAmount);
        euint64 finalSellRes = FHEMatchLib.select(priceMatch, sellResidual, sell.encAmount);

        bool matched = FHE.decrypt(priceMatch, false);
        if (!matched) {
            return bytes32(0);
        }

        matchId = keccak256(abi.encodePacked(buyId, sellId, block.timestamp, totalMatchesFound));

        matches[matchId] = OrderLib.MatchResult({
            buyOrderId: buyId,
            sellOrderId: sellId,
            encSettlementPrice: finalSettlement,
            encFillAmount: finalFill,
            encBuyResidual: finalBuyRes,
            encSellResidual: finalSellRes,
            timestamp: block.timestamp,
            settled: false,
            exists: true
        });

        uint64 buyResidualPlain = FHE.decrypt(finalBuyRes, 0);
        uint64 sellResidualPlain = FHE.decrypt(finalSellRes, 0);

        if (buyResidualPlain == 0) {
            buy.filled = true;
            buy.active = false;
            _removeFromActive(buyId);
        } else {
            buy.partiallyFilled = true;
            buy.encAmount = finalBuyRes;
        }

        if (sellResidualPlain == 0) {
            sell.filled = true;
            sell.active = false;
            _removeFromActive(sellId);
        } else {
            sell.partiallyFilled = true;
            sell.encAmount = finalSellRes;
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

        vault.releaseOnCancel(orderId, msg.sender);

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

                vault.releaseOnCancel(orderId, order.trader);
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

    function getOrderForMatching(bytes32 orderId)
        external
        view
        returns (
            address trader,
            address tokenA,
            address tokenB,
            uint8 direction,
            uint256 expiry,
            bool active,
            bool filled
        )
    {
        OrderLib.EncryptedOrder storage order = orders[orderId];
        return (
            order.trader,
            order.tokenA,
            order.tokenB,
            FHE.decrypt(order.encDirection, SELL),
            order.expiry,
            order.active,
            order.filled
        );
    }

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
        )
    {
        OrderLib.EncryptedOrder storage order = orders[orderId];
        return (
            order.trader,
            order.tokenA,
            order.tokenB,
            FHE.decrypt(order.encPrice, 0),
            FHE.decrypt(order.encAmount, 0),
            order.active,
            order.filled
        );
    }

    function getMatch(bytes32 matchId) external view returns (OrderLib.MatchResult memory) {
        return matches[matchId];
    }

    function getMatchForSettlement(bytes32 matchId)
        external
        view
        onlyKeeperOrSettlement
        returns (
            uint64 settlementPrice,
            uint64 fillAmount,
            uint64 buyResidual,
            uint64 sellResidual,
            bool settled,
            bool exists
        )
    {
        OrderLib.MatchResult storage matchResult = matches[matchId];
        if (!matchResult.exists) {
            return (0, 0, 0, 0, false, false);
        }

        return (
            FHE.decrypt(matchResult.encSettlementPrice, 0),
            FHE.decrypt(matchResult.encFillAmount, 0),
            FHE.decrypt(matchResult.encBuyResidual, 0),
            FHE.decrypt(matchResult.encSellResidual, 0),
            matchResult.settled,
            true
        );
    }

    function getSealedMatch(bytes32 matchId, Permission calldata permission)
        external
        view
        onlySender(permission)
        returns (
            string memory settlementPrice,
            string memory fillAmount,
            string memory buyResidual,
            string memory sellResidual
        )
    {
        OrderLib.MatchResult storage matchResult = matches[matchId];
        if (!matchResult.exists) revert InvalidOrderState();

        return (
            FHE.sealoutput(matchResult.encSettlementPrice, permission.publicKey),
            FHE.sealoutput(matchResult.encFillAmount, permission.publicKey),
            FHE.sealoutput(matchResult.encBuyResidual, permission.publicKey),
            FHE.sealoutput(matchResult.encSellResidual, permission.publicKey)
        );
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

    function _submitOrder(
        euint64 encPrice,
        euint64 encAmount,
        euint8 encDir,
        uint64 lockPrice,
        uint64 lockAmount,
        uint8 direction,
        address tokenA,
        address tokenB,
        uint256 expiry
    ) internal returns (bytes32 orderId) {
        if (tokenA == address(0) || tokenB == address(0)) revert InvalidAddress();
        if (tokenA == tokenB) revert InvalidInput();
        if (lockPrice == 0 || lockAmount == 0) revert InvalidInput();
        if (direction != BUY && direction != SELL) revert InvalidInput();
        if (expiry <= block.timestamp || expiry > block.timestamp + 7 days) revert InvalidInput();

        orderId = keccak256(
            abi.encodePacked(msg.sender, tokenA, tokenB, block.timestamp, block.prevrandao, totalOrdersSubmitted)
        );
        if (orders[orderId].active) revert InvalidOrderState();

        orders[orderId] = OrderLib.EncryptedOrder({
            encPrice: encPrice,
            encAmount: encAmount,
            encDirection: encDir,
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

        vault.lockForOrder(orderId, msg.sender, tokenA, tokenB, lockPrice, lockAmount, direction);

        emit OrderSubmitted(orderId, msg.sender, tokenA, tokenB, block.timestamp, expiry);
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

    function _decodeUint64FromInput(bytes memory data) internal pure returns (uint64 value) {
        uint256 length = data.length;
        if (length == 0) {
            return 0;
        }

        uint256 start = length > 8 ? length - 8 : 0;
        for (uint256 i = start; i < length; i++) {
            value = (value << 8) | uint64(uint8(data[i]));
        }
    }

    function _decodeUint8FromInput(bytes memory data) internal pure returns (uint8 value) {
        if (data.length == 0) {
            return 0;
        }
        return uint8(data[data.length - 1]);
    }
}
