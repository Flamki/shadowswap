import * as dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  RPC_URL: process.env.RPC_URL || process.env.ARB_SEPOLIA_RPC || 'http://127.0.0.1:8545',
  KEEPER_PK: required('KEEPER_PK'),
  ORDER_BOOK_ADDRESS: required('ORDER_BOOK_ADDRESS'),
  SETTLEMENT_ADDRESS: required('SETTLEMENT_ADDRESS'),
  CHAIN_ID: Number(process.env.CHAIN_ID || 421614),
  MATCH_SWEEP_INTERVAL_MS: Number(process.env.MATCH_SWEEP_INTERVAL_MS || 15_000),
};
