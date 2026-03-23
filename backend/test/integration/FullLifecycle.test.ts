import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import {
  deployShadowSwapFixture,
  quoteTokenFromPriceAndAmount,
  submitOrder,
  toE8,
  toToken18FromE8,
} from '../helpers/fixture';

describe('FullLifecycle', function () {
  it('runs BUY + SELL -> MATCH -> SETTLEMENT end-to-end', async function () {
    const { buyer, seller, keeper, orderBook, settlement, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyPrice = toE8('2850');
    const sellPrice = toE8('2840');
    const amount = toE8('1.5');

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: buyPrice,
      amountE8: amount,
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitOrder(orderBook, seller, {
      priceE8: sellPrice,
      amountE8: amount,
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const buyerWethBefore = await weth.balanceOf(buyer.address);
    const sellerUsdcBefore = await usdc.balanceOf(seller.address);

    const matchTx = await orderBook.tryMatch(buyId, sellId);
    const matchReceipt = await matchTx.wait();
    const event = matchReceipt?.logs
      .map((log: any) => {
        try {
          return orderBook.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log: any) => log?.name === 'MatchFound');

    const matchId = event.args.matchId;
    const matchData = await orderBook.getMatch(matchId);

    await settlement
      .connect(keeper)
      .executeSettlement(
        matchId,
        matchData.encSettlementPrice,
        matchData.encFillAmount,
        matchData.encBuyResidual,
        matchData.encSellResidual
      );

    const buyerWethAfter = await weth.balanceOf(buyer.address);
    const sellerUsdcAfter = await usdc.balanceOf(seller.address);

    const expectedWeth = toToken18FromE8(amount);
    const expectedUsdc = quoteTokenFromPriceAndAmount(toE8('2845'), amount);

    expect(buyerWethAfter - buyerWethBefore).to.equal(expectedWeth);
    expect(sellerUsdcAfter - sellerUsdcBefore).to.equal(expectedUsdc);

    const buyLock = await vault.lockedFunds(buyId);
    const sellLock = await vault.lockedFunds(sellId);
    expect(buyLock.active).to.equal(false);
    expect(sellLock.active).to.equal(false);

    const settled = await orderBook.getMatch(matchId);
    expect(settled.settled).to.equal(true);
  });
});
