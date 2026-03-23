import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployShadowSwapFixture, submitOrder, toE8 } from '../helpers/fixture';

describe('PartialFill', function () {
  it('keeps residual BUY order active after partial settlement', async function () {
    const { buyer, seller, keeper, orderBook, settlement, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const tx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await tx.wait();
    const matchEvent = receipt?.logs
      .map((log: any) => {
        try {
          return orderBook.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log: any) => log?.name === 'MatchFound');

    const matchId = matchEvent.args.matchId;
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

    const buyOrder = await orderBook.orders(buyId);
    expect(buyOrder.active).to.equal(true);
    expect(buyOrder.partiallyFilled).to.equal(true);
    expect(buyOrder.encAmount).to.equal(toE8('1.0'));

    const buyLock = await vault.lockedFunds(buyId);
    expect(buyLock.active).to.equal(true);
    expect(buyLock.amount).to.be.greaterThan(0);
  });

  it('allows second fill to fully close residual order', async function () {
    const { buyer, seller, keeper, orderBook, settlement, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const firstSellId = await submitOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const firstTx = await orderBook.tryMatch(buyId, firstSellId);
    const firstReceipt = await firstTx.wait();
    const firstMatchEvent = firstReceipt?.logs
      .map((log: any) => {
        try {
          return orderBook.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log: any) => log?.name === 'MatchFound');
    const firstMatchId = firstMatchEvent.args.matchId;
    const firstMatch = await orderBook.getMatch(firstMatchId);

    await settlement
      .connect(keeper)
      .executeSettlement(
        firstMatchId,
        firstMatch.encSettlementPrice,
        firstMatch.encFillAmount,
        firstMatch.encBuyResidual,
        firstMatch.encSellResidual
      );

    await (await weth.mint(seller.address, 10n ** 18n)).wait();

    const secondSellId = await submitOrder(orderBook, seller, {
      priceE8: toE8('2845'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const secondTx = await orderBook.tryMatch(buyId, secondSellId);
    const secondReceipt = await secondTx.wait();
    const secondMatchEvent = secondReceipt?.logs
      .map((log: any) => {
        try {
          return orderBook.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log: any) => log?.name === 'MatchFound');
    const secondMatchId = secondMatchEvent.args.matchId;
    const secondMatch = await orderBook.getMatch(secondMatchId);

    await settlement
      .connect(keeper)
      .executeSettlement(
        secondMatchId,
        secondMatch.encSettlementPrice,
        secondMatch.encFillAmount,
        secondMatch.encBuyResidual,
        secondMatch.encSellResidual
      );

    const buyOrder = await orderBook.orders(buyId);
    expect(buyOrder.active).to.equal(false);
    expect(buyOrder.filled).to.equal(true);

    const buyLock = await vault.lockedFunds(buyId);
    expect(buyLock.active).to.equal(false);
  });
});
