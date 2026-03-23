import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { config } from './config';
import { ORDER_BOOK_ABI, SETTLEMENT_ABI } from './abis';

type MatchForSettlement = {
  settlementPrice: bigint;
  fillAmount: bigint;
  buyResidual: bigint;
  sellResidual: bigint;
  settled: boolean;
  exists: boolean;
};

export class SettlementWatcher {
  private readonly provider: JsonRpcProvider;
  private readonly signer: Wallet;
  private readonly orderBook: Contract;
  private readonly settlement: Contract;
  private readonly pendingMatches: Set<string>;

  constructor() {
    this.provider = new JsonRpcProvider(config.RPC_URL, config.CHAIN_ID);
    this.signer = new Wallet(config.KEEPER_PK, this.provider);
    this.orderBook = new Contract(config.ORDER_BOOK_ADDRESS, ORDER_BOOK_ABI, this.signer);
    this.settlement = new Contract(config.SETTLEMENT_ADDRESS, SETTLEMENT_ABI, this.signer);
    this.pendingMatches = new Set();
  }

  async start(): Promise<void> {
    console.log('[Watcher] Settlement watcher online');

    this.orderBook.on('MatchFound', async (matchId: string) => {
      await this.processMatch(matchId).catch((error) => {
        console.error('[Watcher] Match processing error:', error);
      });
    });
  }

  stop(): void {
    this.orderBook.removeAllListeners('MatchFound');
  }

  private async processMatch(matchId: string): Promise<void> {
    if (this.pendingMatches.has(matchId)) {
      return;
    }

    this.pendingMatches.add(matchId);

    try {
      const matchData = (await this.orderBook.getMatchForSettlement(matchId)) as MatchForSettlement;
      if (!matchData.exists || matchData.settled) {
        return;
      }

      const tx = await this.settlement.executeSettlement(
        matchId,
        Number(matchData.settlementPrice),
        Number(matchData.fillAmount),
        Number(matchData.buyResidual),
        Number(matchData.sellResidual),
        { gasLimit: 600_000 }
      );
      const receipt = await tx.wait();
      console.log(`[Watcher] Settlement executed match=${matchId.slice(0, 10)} tx=${receipt?.hash}`);
    } catch (error) {
      console.error(`[Watcher] Failed match=${matchId.slice(0, 10)}:`, (error as Error).message);
      setTimeout(() => {
        this.pendingMatches.delete(matchId);
        this.processMatch(matchId).catch(() => undefined);
      }, 15_000);
      return;
    }

    this.pendingMatches.delete(matchId);
  }
}
