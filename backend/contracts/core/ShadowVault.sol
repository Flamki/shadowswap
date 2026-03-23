// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import '../interfaces/IShadowVault.sol';

contract ShadowVault is Ownable, ReentrancyGuard, IShadowVault {
    using SafeERC20 for IERC20;

    uint8 private constant BUY = 1;
    uint256 private constant PRICE_DECIMALS = 1e8;
    uint256 private constant SCALE_E8_TO_E18 = 1e10;

    struct LockedFunds {
        address trader;
        address token;
        uint256 amount;
        bytes32 orderId;
        bool active;
    }

    mapping(bytes32 => LockedFunds) public lockedFunds;
    mapping(address => mapping(address => uint256)) public traderBalances;

    address public orderBook;
    address public settlement;

    event FundsLocked(bytes32 indexed orderId, address indexed trader, address indexed token, uint256 amount);
    event FundsReleased(bytes32 indexed orderId, address indexed to, address indexed token, uint256 amount);
    event FundsTransferred(
        bytes32 indexed matchId,
        address indexed from,
        address indexed to,
        address token,
        uint256 amount
    );

    error NotOrderBook();
    error NotSettlement();
    error InvalidAddress();
    error InvalidState();
    error AmountTooLarge();

    modifier onlyOrderBook() {
        if (msg.sender != orderBook) revert NotOrderBook();
        _;
    }

    modifier onlySettlement() {
        if (msg.sender != settlement) revert NotSettlement();
        _;
    }

    modifier onlyOrderBookOrSettlement() {
        if (msg.sender != orderBook && msg.sender != settlement) revert InvalidState();
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setOrderBook(address newOrderBook) external onlyOwner {
        if (newOrderBook == address(0)) revert InvalidAddress();
        orderBook = newOrderBook;
    }

    function setSettlement(address newSettlement) external onlyOwner {
        if (newSettlement == address(0)) revert InvalidAddress();
        settlement = newSettlement;
    }

    function lockForOrder(
        bytes32 orderId,
        address trader,
        address tokenA,
        address tokenB,
        uint64 priceE8,
        uint64 amountE8,
        uint8 direction
    ) external onlyOrderBook nonReentrant {
        if (trader == address(0) || tokenA == address(0) || tokenB == address(0)) revert InvalidAddress();
        if (lockedFunds[orderId].active) revert InvalidState();

        address tokenToLock;
        uint256 amountToLock;

        if (direction == BUY) {
            tokenToLock = tokenB;
            uint256 quoteNotionalE8 = (uint256(priceE8) * uint256(amountE8)) / PRICE_DECIMALS;
            amountToLock = quoteNotionalE8 * SCALE_E8_TO_E18;
        } else {
            tokenToLock = tokenA;
            amountToLock = uint256(amountE8) * SCALE_E8_TO_E18;
        }

        if (amountToLock == 0) revert InvalidState();

        IERC20(tokenToLock).safeTransferFrom(trader, address(this), amountToLock);

        lockedFunds[orderId] = LockedFunds({
            trader: trader,
            token: tokenToLock,
            amount: amountToLock,
            orderId: orderId,
            active: true
        });

        traderBalances[trader][tokenToLock] += amountToLock;

        emit FundsLocked(orderId, trader, tokenToLock, amountToLock);
    }

    function releaseOnCancel(bytes32 orderId, address recipient)
        external
        onlyOrderBookOrSettlement
        nonReentrant
        returns (uint256 amount)
    {
        return _releaseOnCancel(orderId, recipient);
    }

    function _releaseOnCancel(bytes32 orderId, address recipient) internal returns (uint256 amount) {
        if (recipient == address(0)) revert InvalidAddress();

        LockedFunds storage lockInfo = lockedFunds[orderId];
        if (!lockInfo.active) {
            return 0;
        }

        amount = lockInfo.amount;
        lockInfo.amount = 0;
        lockInfo.active = false;

        traderBalances[lockInfo.trader][lockInfo.token] -= amount;
        IERC20(lockInfo.token).safeTransfer(recipient, amount);

        emit FundsReleased(orderId, recipient, lockInfo.token, amount);
    }

    function releaseOnFill(
        bytes32 matchId,
        bytes32 orderId,
        address recipient,
        uint256 amount
    ) external onlySettlement nonReentrant {
        _releaseOnFill(matchId, orderId, recipient, amount);
    }

    function _releaseOnFill(bytes32 matchId, bytes32 orderId, address recipient, uint256 amount) internal {
        if (recipient == address(0)) revert InvalidAddress();

        LockedFunds storage lockInfo = lockedFunds[orderId];
        if (!lockInfo.active) revert InvalidState();
        if (amount == 0 || amount > lockInfo.amount) revert AmountTooLarge();

        lockInfo.amount -= amount;
        traderBalances[lockInfo.trader][lockInfo.token] -= amount;

        if (lockInfo.amount == 0) {
            lockInfo.active = false;
        }

        IERC20(lockInfo.token).safeTransfer(recipient, amount);

        emit FundsTransferred(matchId, lockInfo.trader, recipient, lockInfo.token, amount);
    }

    // Backward-compatible aliases.
    function releaseRemaining(bytes32 orderId, address recipient)
        external
        onlyOrderBookOrSettlement
        nonReentrant
        returns (uint256 amount)
    {
        return _releaseOnCancel(orderId, recipient);
    }

    function transferLocked(
        bytes32 matchId,
        bytes32 orderId,
        address recipient,
        uint256 amount
    ) external onlySettlement nonReentrant {
        _releaseOnFill(matchId, orderId, recipient, amount);
    }
}
