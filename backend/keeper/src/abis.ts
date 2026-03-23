export const ORDER_BOOK_ABI = [
  'event OrderSubmitted(bytes32 indexed orderId, address indexed trader, address indexed tokenA, address tokenB, uint256 timestamp, uint256 expiry)',
  'event MatchFound(bytes32 indexed matchId, bytes32 indexed buyOrderId, bytes32 indexed sellOrderId, uint256 timestamp)',
  'function getActiveOrderIds() view returns (bytes32[])',
  'function orders(bytes32) view returns (uint64 encPrice, uint64 encAmount, uint8 encDirection, address trader, address tokenA, address tokenB, uint256 timestamp, uint256 expiry, bytes32 orderId, bool active, bool filled, bool partiallyFilled)',
  'function tryMatch(bytes32 buyId, bytes32 sellId) returns (bytes32 matchId)',
  'function getMatch(bytes32 matchId) view returns ((bytes32 buyOrderId, bytes32 sellOrderId, uint64 encSettlementPrice, uint64 encFillAmount, uint64 encBuyResidual, uint64 encSellResidual, uint256 timestamp, bool settled, bool exists))',
] as const;

export const SETTLEMENT_ABI = [
  'function executeSettlement(bytes32 matchId, uint64 settlementPrice, uint64 fillAmount, uint64 buyResidual, uint64 sellResidual)',
] as const;
