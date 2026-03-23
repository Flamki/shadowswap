import { useEffect, useMemo, useState } from 'react';
import { type BrowserProvider, type JsonRpcProvider } from 'ethers';
import { createReadProvider, getOrderBookContract, isContractsConfigured } from '../lib/contracts';

export type ActivityFeedItem = {
  type: 'submitted' | 'matched' | 'settled' | 'cancelled' | 'expired';
  id: string;
  timestamp: number;
  pair: string;
};

const MAX_ITEMS = 50;

const pushItem = (current: ActivityFeedItem[], item: ActivityFeedItem): ActivityFeedItem[] => {
  const deduped = current.filter((existing) => !(existing.id === item.id && existing.type === item.type));
  return [item, ...deduped].sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_ITEMS);
};

export function useActivityFeed(providerOverride?: BrowserProvider | JsonRpcProvider | null): ActivityFeedItem[] {
  const [events, setEvents] = useState<ActivityFeedItem[]>([]);

  const provider = useMemo(() => providerOverride ?? createReadProvider(), [providerOverride]);

  useEffect(() => {
    if (!isContractsConfigured()) {
      setEvents([]);
      return;
    }

    const orderBook = getOrderBookContract(provider);
    let mounted = true;

    const loadRecentEvents = async () => {
      try {
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 4000);

        const [submitted, matched, settled, cancelled, expired] = await Promise.all([
          orderBook.queryFilter(orderBook.filters.OrderSubmitted(), fromBlock, latestBlock),
          orderBook.queryFilter(orderBook.filters.MatchFound(), fromBlock, latestBlock),
          orderBook.queryFilter(orderBook.filters.OrderSettled(), fromBlock, latestBlock),
          orderBook.queryFilter(orderBook.filters.OrderCancelled(), fromBlock, latestBlock),
          orderBook.queryFilter(orderBook.filters.OrderExpired(), fromBlock, latestBlock),
        ]);

        if (!mounted) {
          return;
        }

        const items: ActivityFeedItem[] = [
          ...submitted.map((log: any) => ({
            type: 'submitted' as const,
            id: String(log.args.orderId),
            timestamp: Number(log.args.timestamp),
            pair: 'WETH/USDC',
          })),
          ...matched.map((log: any) => ({
            type: 'matched' as const,
            id: String(log.args.matchId),
            timestamp: Number(log.args.timestamp),
            pair: 'WETH/USDC',
          })),
          ...settled.map((log: any) => ({
            type: 'settled' as const,
            id: String(log.args.matchId),
            timestamp: Number(log.args.timestamp),
            pair: 'WETH/USDC',
          })),
          ...cancelled.map((log: any) => ({
            type: 'cancelled' as const,
            id: String(log.args.orderId),
            timestamp: Number(log.args.timestamp),
            pair: 'WETH/USDC',
          })),
          ...expired.map((log: any) => ({
            type: 'expired' as const,
            id: String(log.args.orderId),
            timestamp: Date.now() / 1000,
            pair: 'WETH/USDC',
          })),
        ];

        setEvents(items.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_ITEMS));
      } catch {
        // Keep current items on RPC issues.
      }
    };

    const onSubmitted = (orderId: string, _trader: string, _tokenA: string, _tokenB: string, timestamp: bigint) => {
      setEvents((current) =>
        pushItem(current, {
          type: 'submitted',
          id: orderId,
          timestamp: Number(timestamp),
          pair: 'WETH/USDC',
        }),
      );
    };

    const onMatched = (matchId: string, _buy: string, _sell: string, timestamp: bigint) => {
      setEvents((current) =>
        pushItem(current, {
          type: 'matched',
          id: matchId,
          timestamp: Number(timestamp),
          pair: 'WETH/USDC',
        }),
      );
    };

    const onSettled = (matchId: string, _buyer: string, _seller: string, _price: bigint, _fill: bigint, timestamp: bigint) => {
      setEvents((current) =>
        pushItem(current, {
          type: 'settled',
          id: matchId,
          timestamp: Number(timestamp),
          pair: 'WETH/USDC',
        }),
      );
    };

    orderBook.on('OrderSubmitted', onSubmitted);
    orderBook.on('MatchFound', onMatched);
    orderBook.on('OrderSettled', onSettled);

    void loadRecentEvents();

    return () => {
      mounted = false;
      orderBook.off('OrderSubmitted', onSubmitted);
      orderBook.off('MatchFound', onMatched);
      orderBook.off('OrderSettled', onSettled);
    };
  }, [provider]);

  return events;
}
