import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { config } from './config';
import { ORDER_BOOK_ABI } from './abis';

type OrderMeta = {
  trader: string;
  tokenA: string;
  tokenB: string;
  direction: number;
  expiry: bigint;
  active: boolean;
  filled: boolean;
};

export class MatchingKeeper {
  private readonly provider: JsonRpcProvider;
  private readonly signer: Wallet;
  private readonly orderBook: Contract;
  private readonly pendingMatches: Set<string>;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.provider = new JsonRpcProvider(config.RPC_URL, config.CHAIN_ID);
    this.signer = new Wallet(config.KEEPER_PK, this.provider);
    this.orderBook = new Contract(config.ORDER_BOOK_ADDRESS, ORDER_BOOK_ABI, this.signer);
    this.pendingMatches = new Set();
  }

  async start(): Promise<void> {
    const address = await this.signer.getAddress();
    console.log('[Keeper] Matching engine online:', address);

    this.orderBook.on('OrderSubmitted', async (orderId: string) => {
      try {
        await this.tryMatchForOrder(orderId);
      } catch (error) {
        console.error('[Keeper] order listener error:', error);
      }
    });

    this.sweepTimer = setInterval(() => {
      this.periodicSweep().catch((error) => {
        console.error('[Keeper] periodic sweep error:', error);
      });
    }, config.MATCH_SWEEP_INTERVAL_MS);

    await this.periodicSweep();
  }

  stop(): void {
    this.orderBook.removeAllListeners('OrderSubmitted');
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  private async periodicSweep(): Promise<void> {
    const activeIds: string[] = await this.orderBook.getActiveOrderIds();
    if (activeIds.length < 2) {
      return;
    }

    const orders = await Promise.all(activeIds.map((id) => this.getOrder(id)));

    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        const orderA = orders[i];
        const orderB = orders[j];

        if (!orderA.active || !orderB.active) {
          continue;
        }

        const maybePair = this.buildPair(activeIds[i], orderA, activeIds[j], orderB);
        if (!maybePair) {
          continue;
        }

        const key = `${maybePair.buyId}:${maybePair.sellId}`;
        if (this.pendingMatches.has(key)) {
          continue;
        }

        await this.tryMatch(maybePair.buyId, maybePair.sellId, key);
      }
    }
  }

  private async tryMatchForOrder(orderId: string): Promise<void> {
    const activeIds: string[] = await this.orderBook.getActiveOrderIds();
    if (activeIds.length < 2) {
      return;
    }

    const source = await this.getOrder(orderId);
    if (!source.active) {
      return;
    }

    for (const candidateId of activeIds) {
      if (candidateId.toLowerCase() === orderId.toLowerCase()) {
        continue;
      }

      const candidate = await this.getOrder(candidateId);
      const maybePair = this.buildPair(orderId, source, candidateId, candidate);
      if (!maybePair) {
        continue;
      }

      const key = `${maybePair.buyId}:${maybePair.sellId}`;
      if (this.pendingMatches.has(key)) {
        continue;
      }

      await this.tryMatch(maybePair.buyId, maybePair.sellId, key);
    }
  }

  private async tryMatch(buyId: string, sellId: string, key: string): Promise<void> {
    this.pendingMatches.add(key);
    try {
      const tx = await this.orderBook.tryMatch(buyId, sellId, {
        gasLimit: 1_500_000,
      });
      const receipt = await tx.wait();
      console.log(`[Keeper] tryMatch submitted buy=${buyId.slice(0, 10)} sell=${sellId.slice(0, 10)} tx=${receipt?.hash}`);
    } catch (error) {
      // Reverts are expected when candidates become stale between reads.
      console.debug('[Keeper] tryMatch skipped:', (error as Error).message);
    } finally {
      this.pendingMatches.delete(key);
    }
  }

  private async getOrder(orderId: string): Promise<OrderMeta> {
    const order = (await this.orderBook.getOrderForMatching(orderId)) as {
      trader: string;
      tokenA: string;
      tokenB: string;
      direction: bigint;
      expiry: bigint;
      active: boolean;
      filled: boolean;
    };

    return {
      trader: order.trader,
      tokenA: order.tokenA,
      tokenB: order.tokenB,
      direction: Number(order.direction),
      expiry: order.expiry,
      active: order.active,
      filled: order.filled,
    };
  }

  private buildPair(
    orderIdA: string,
    a: OrderMeta,
    orderIdB: string,
    b: OrderMeta
  ): { buyId: string; sellId: string } | null {
    if (a.tokenA.toLowerCase() !== b.tokenA.toLowerCase()) return null;
    if (a.tokenB.toLowerCase() !== b.tokenB.toLowerCase()) return null;
    if (a.trader.toLowerCase() === b.trader.toLowerCase()) return null;

    if (a.direction === 1 && b.direction === 0) {
      return { buyId: orderIdA, sellId: orderIdB };
    }

    if (a.direction === 0 && b.direction === 1) {
      return { buyId: orderIdB, sellId: orderIdA };
    }

    return null;
  }
}
