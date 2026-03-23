import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { deployShadowSwapFixture, submitOrder, toE8 } from '../helpers/fixture';

describe('ShadowSettlement', function () {
  it('executes settlement from oracle and marks match settled', async function () {
    const { buyer, seller, keeper, orderBook, settlement, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.5'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.5'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const matchTx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await matchTx.wait();
    const event = receipt?.logs
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

    await expect(
      settlement
        .connect(keeper)
        .executeSettlement(
          matchId,
          matchData.encSettlementPrice,
          matchData.encFillAmount,
          matchData.encBuyResidual,
          matchData.encSellResidual
        )
    ).to.emit(settlement, 'SettlementExecuted');

    const settled = await orderBook.getMatch(matchId);
    expect(settled.settled).to.equal(true);
  });

  it('reverts settlement execution from non-oracle', async function () {
    const { buyer, seller, other, orderBook, settlement, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
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

    const matchTx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await matchTx.wait();
    const event = receipt?.logs
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

    await expect(
      settlement
        .connect(other)
        .executeSettlement(
          matchId,
          matchData.encSettlementPrice,
          matchData.encFillAmount,
          matchData.encBuyResidual,
          matchData.encSellResidual
        )
    ).to.be.revertedWithCustomError(settlement, 'NotOracle');
  });

  it('skips settlement cleanly when decrypted values are zero', async function () {
    const { buyer, seller, keeper, orderBook, settlement, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
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
    const event = receipt?.logs
      .map((log: any) => {
        try {
          return orderBook.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((log: any) => log?.name === 'MatchFound');

    const matchId = event.args.matchId;

    await expect(settlement.connect(keeper).executeSettlement(matchId, 0, 0, 0, 0)).to.emit(settlement, 'SettlementSkipped');

    const matchData = await orderBook.getMatch(matchId);
    expect(matchData.settled).to.equal(true);
  });
});
