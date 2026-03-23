import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  type ContractRunner,
} from 'ethers';
import deployment from '../../backend/deployments/arbitrumSepolia.json';

export type HexAddress = `0x${string}`;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

const resolveAddress = (envAddress: string | undefined, deploymentAddress: string | undefined): HexAddress => {
  const candidate = envAddress || deploymentAddress || ZERO_ADDRESS;
  return candidate as HexAddress;
};

export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || deployment.chainId || 421614);
export const RPC_URL =
  import.meta.env.VITE_RPC_URL ||
  import.meta.env.VITE_ARB_SEPOLIA_RPC ||
  'https://sepolia-rollup.arbitrum.io/rpc';

export const ORDER_BOOK_ADDRESS = resolveAddress(
  import.meta.env.VITE_ORDER_BOOK_ADDRESS,
  deployment.shadowOrderBook,
);

export const VAULT_ADDRESS = resolveAddress(import.meta.env.VITE_VAULT_ADDRESS, deployment.shadowVault);

export const SETTLEMENT_ADDRESS = resolveAddress(
  import.meta.env.VITE_SETTLEMENT_ADDRESS,
  deployment.shadowSettlement,
);

export const WETH_ADDRESS = resolveAddress(
  import.meta.env.VITE_WETH_ADDRESS,
  '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
);

export const USDC_ADDRESS = resolveAddress(
  import.meta.env.VITE_USDC_ADDRESS,
  '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
);

export const ORDER_BOOK_ABI = [
  'event OrderSubmitted(bytes32 indexed orderId, address indexed trader, address indexed tokenA, address tokenB, uint256 timestamp, uint256 expiry)',
  'event OrderCancelled(bytes32 indexed orderId, address indexed trader, uint256 timestamp)',
  'event MatchFound(bytes32 indexed matchId, bytes32 indexed buyOrderId, bytes32 indexed sellOrderId, uint256 timestamp)',
  'event OrderSettled(bytes32 indexed matchId, address indexed buyer, address indexed seller, uint64 settlementPrice, uint64 fillAmount, uint256 timestamp)',
  'event OrderExpired(bytes32 indexed orderId, address indexed trader)',
  'function submitOrder(uint64 inPrice, uint64 inAmount, uint8 inDir, address tokenA, address tokenB, uint256 expiry) returns (bytes32 orderId)',
  'function cancelOrder(bytes32 orderId)',
  'function getActiveOrderIds() view returns (bytes32[] memory)',
  'function getOrderMeta(bytes32 orderId) view returns (address trader, address tokenA, address tokenB, uint256 timestamp, uint256 expiry, bool active)',
  'function totalMatchesFound() view returns (uint256)',
] as const;

export const ERC20_ABI = [
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
] as const;

export const isConfiguredAddress = (address: string): boolean => address.toLowerCase() !== ZERO_ADDRESS;

export const isContractsConfigured = (): boolean =>
  isConfiguredAddress(ORDER_BOOK_ADDRESS) &&
  isConfiguredAddress(VAULT_ADDRESS) &&
  isConfiguredAddress(SETTLEMENT_ADDRESS);

export const createReadProvider = (): JsonRpcProvider => new JsonRpcProvider(RPC_URL, CHAIN_ID);

export const createBrowserProvider = (): BrowserProvider => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Wallet provider not found. Install MetaMask or another EVM wallet.');
  }
  return new BrowserProvider(window.ethereum);
};

export const getOrderBookContract = (runner: ContractRunner): Contract =>
  new Contract(ORDER_BOOK_ADDRESS, ORDER_BOOK_ABI, runner);

export const getErc20Contract = (tokenAddress: HexAddress, runner: ContractRunner): Contract =>
  new Contract(tokenAddress, ERC20_ABI, runner);

export const buildArbiscanTxUrl = (txHash: string): string => `https://sepolia.arbiscan.io/tx/${txHash}`;

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
    };
  }
}
