import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';

import {
  deployShadowSwapFixture,
  getMatchIdFromReceipt,
  quoteTokenFromPriceAndAmount,
  submitEncryptedOrder,
  submitPlainOrder,
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

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: buyPrice,
      amountE8: amount,
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
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
    const matchId = await getMatchIdFromReceipt(orderBook, matchReceipt);
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
  });

  it('returns zero match id when price does not cross', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2800'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const matchId = await orderBook.tryMatch.staticCall(buyId, sellId);
    expect(matchId).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000');
  });

  it('supports encrypted-submit lifecycle path', async function () {
    const { buyer, seller, keeper, orderBook, settlement, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitEncryptedOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.0'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitEncryptedOrder(orderBook, seller, {
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
    ).to.emit(settlement, 'SettlementExecuted');
  });

  it('cannot match expired orders', async function () {
    const { buyer, seller, orderBook, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 5;

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
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    await time.increaseTo(expiry + 1);
    await expect(orderBook.tryMatch(buyId, sellId)).to.be.reverted;
  });
});
