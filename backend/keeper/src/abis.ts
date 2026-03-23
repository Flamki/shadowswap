export const ORDER_BOOK_ABI = [
  'event OrderSubmitted(bytes32 indexed orderId, address indexed trader, address indexed tokenA, address tokenB, uint256 timestamp, uint256 expiry)',
  'event MatchFound(bytes32 indexed matchId, bytes32 indexed buyOrderId, bytes32 indexed sellOrderId, uint256 timestamp)',
  'function getActiveOrderIds() view returns (bytes32[])',
  'function getOrderForMatching(bytes32 orderId) view returns (address trader, address tokenA, address tokenB, uint8 direction, uint256 expiry, bool active, bool filled)',
  'function tryMatch(bytes32 buyId, bytes32 sellId) returns (bytes32 matchId)',
  'function getMatchForSettlement(bytes32 matchId) view returns (uint64 settlementPrice, uint64 fillAmount, uint64 buyResidual, uint64 sellResidual, bool settled, bool exists)',
] as const;

export const SETTLEMENT_ABI = [
  'function executeSettlement(bytes32 matchId, uint64 settlementPrice, uint64 fillAmount, uint64 buyResidual, uint64 sellResidual)',
] as const;
