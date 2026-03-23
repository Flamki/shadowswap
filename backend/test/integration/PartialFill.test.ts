import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';

import { deployShadowSwapFixture, getMatchIdFromReceipt, submitPlainOrder, toE8 } from '../helpers/fixture';

describe('PartialFill', function () {
  it('keeps residual BUY order active after partial settlement', async function () {
    const { buyer, seller, keeper, orderBook, settlement, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const tx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await tx.wait();
    const matchId = await getMatchIdFromReceipt(orderBook, receipt);
    const matchData = await orderBook.connect(keeper).getMatchForSettlement(matchId);

    await settlement
      .connect(keeper)
      .executeSettlement(
        matchId,
        matchData.settlementPrice,
        matchData.fillAmount,
        matchData.buyResidual,
        matchData.sellResidual
      );

    const [, , , , amountLeft, active, filled] = await orderBook.getOrderForSettlement(buyId);
    expect(active).to.equal(true);
    expect(filled).to.equal(false);
    expect(amountLeft).to.equal(toE8('1.0'));

    const buyLock = await vault.lockedFunds(buyId);
    expect(buyLock.active).to.equal(true);
    expect(buyLock.amount).to.be.greaterThan(0);
  });

  it('allows second fill to fully close residual BUY order', async function () {
    const { buyer, seller, keeper, orderBook, settlement, vault, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const firstSellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const firstTx = await orderBook.tryMatch(buyId, firstSellId);
    const firstReceipt = await firstTx.wait();
    const firstMatchId = await getMatchIdFromReceipt(orderBook, firstReceipt);
    const firstMatch = await orderBook.connect(keeper).getMatchForSettlement(firstMatchId);

    await settlement
      .connect(keeper)
      .executeSettlement(
        firstMatchId,
        firstMatch.settlementPrice,
        firstMatch.fillAmount,
        firstMatch.buyResidual,
        firstMatch.sellResidual
      );

    await (await weth.mint(seller.address, 10n ** 18n)).wait();

    const secondSellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2845'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const secondTx = await orderBook.tryMatch(buyId, secondSellId);
    const secondReceipt = await secondTx.wait();
    const secondMatchId = await getMatchIdFromReceipt(orderBook, secondReceipt);
    const secondMatch = await orderBook.connect(keeper).getMatchForSettlement(secondMatchId);

    await settlement
      .connect(keeper)
      .executeSettlement(
        secondMatchId,
        secondMatch.settlementPrice,
        secondMatch.fillAmount,
        secondMatch.buyResidual,
        secondMatch.sellResidual
      );

    const [, , , , , active, filled] = await orderBook.getOrderForSettlement(buyId);
    expect(active).to.equal(false);
    expect(filled).to.equal(true);

    const buyLock = await vault.lockedFunds(buyId);
    expect(buyLock.active).to.equal(false);
  });

  it('keeps residual SELL order active when BUY is smaller', async function () {
    const { buyer, seller, keeper, orderBook, settlement, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('2.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const tx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await tx.wait();
    const matchId = await getMatchIdFromReceipt(orderBook, receipt);
    const matchData = await orderBook.connect(keeper).getMatchForSettlement(matchId);

    await settlement
      .connect(keeper)
      .executeSettlement(
        matchId,
        matchData.settlementPrice,
        matchData.fillAmount,
        matchData.buyResidual,
        matchData.sellResidual
      );

    const [, , , , , buyActive, buyFilled] = await orderBook.getOrderForSettlement(buyId);
    const [, , , , sellLeft, sellActive] = await orderBook.getOrderForSettlement(sellId);

    expect(buyActive).to.equal(false);
    expect(buyFilled).to.equal(true);
    expect(sellLeft).to.equal(toE8('1.0'));
    expect(sellActive).to.equal(true);
  });

  it('settlement emits OrderSettled for partial fills', async function () {
    const { buyer, seller, keeper, orderBook, settlement, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('2.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const tx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await tx.wait();
    const matchId = await getMatchIdFromReceipt(orderBook, receipt);
    const matchData = await orderBook.connect(keeper).getMatchForSettlement(matchId);

    await expect(
      settlement
        .connect(keeper)
        .executeSettlement(
          matchId,
          matchData.settlementPrice,
          matchData.fillAmount,
          matchData.buyResidual,
          matchData.sellResidual
        )
    ).to.emit(orderBook, 'OrderSettled');
  });
});
