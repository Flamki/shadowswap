import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { config } from './config';
import { ORDER_BOOK_ABI } from './abis';

type OrderTuple = {
  encPrice: bigint;
  encAmount: bigint;
  encDirection: number;
  trader: string;
  tokenA: string;
  tokenB: string;
  timestamp: bigint;
  expiry: bigint;
  orderId: string;
  active: boolean;
  filled: boolean;
  partiallyFilled: boolean;
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

        const maybePair = this.buildPair(orderA, orderB);
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
      const maybePair = this.buildPair(source, candidate);
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

  private async getOrder(orderId: string): Promise<OrderTuple> {
    const order = (await this.orderBook.orders(orderId)) as {
      encPrice: bigint;
      encAmount: bigint;
      encDirection: bigint;
      trader: string;
      tokenA: string;
      tokenB: string;
      timestamp: bigint;
      expiry: bigint;
      orderId: string;
      active: boolean;
      filled: boolean;
      partiallyFilled: boolean;
    };

    return {
      encPrice: order.encPrice,
      encAmount: order.encAmount,
      encDirection: Number(order.encDirection),
      trader: order.trader,
      tokenA: order.tokenA,
      tokenB: order.tokenB,
      timestamp: order.timestamp,
      expiry: order.expiry,
      orderId: order.orderId,
      active: order.active,
      filled: order.filled,
      partiallyFilled: order.partiallyFilled,
    };
  }

  private buildPair(a: OrderTuple, b: OrderTuple): { buyId: string; sellId: string } | null {
    if (a.tokenA.toLowerCase() !== b.tokenA.toLowerCase()) return null;
    if (a.tokenB.toLowerCase() !== b.tokenB.toLowerCase()) return null;
    if (a.trader.toLowerCase() === b.trader.toLowerCase()) return null;

    if (a.encDirection === 1 && b.encDirection === 0) {
      return { buyId: a.orderId, sellId: b.orderId };
    }

    if (a.encDirection === 0 && b.encDirection === 1) {
      return { buyId: b.orderId, sellId: a.orderId };
    }

    return null;
  }
}
