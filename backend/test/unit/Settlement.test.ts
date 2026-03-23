import { expect } from 'chai';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';

import { deployShadowSwapFixture, getMatchIdFromReceipt, submitPlainOrder, toE8 } from '../helpers/fixture';

describe('ShadowSettlement', function () {
  it('executes settlement from oracle and marks match settled', async function () {
    const { buyer, seller, keeper, orderBook, settlement, weth, usdc } = await loadFixture(deployShadowSwapFixture);
    const expiry = (await time.latest()) + 3600;

    const buyId = await submitPlainOrder(orderBook, buyer, {
      priceE8: toE8('2850'),
      amountE8: toE8('1.5'),
      direction: 1,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const sellId = await submitPlainOrder(orderBook, seller, {
      priceE8: toE8('2840'),
      amountE8: toE8('1.5'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const matchTx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await matchTx.wait();
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

    const settled = await orderBook.getMatch(matchId);
    expect(settled.settled).to.equal(true);
  });

  it('reverts settlement execution from non-oracle', async function () {
    const { buyer, seller, keeper, other, orderBook, settlement, weth, usdc } = await loadFixture(deployShadowSwapFixture);
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
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const matchTx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await matchTx.wait();
    const matchId = await getMatchIdFromReceipt(orderBook, receipt);
    const matchData = await orderBook.connect(keeper).getMatchForSettlement(matchId);

    await expect(
      settlement
        .connect(other)
        .executeSettlement(
          matchId,
          matchData.settlementPrice,
          matchData.fillAmount,
          matchData.buyResidual,
          matchData.sellResidual
        )
    ).to.be.reverted;
  });

  it('skips settlement when decrypted values are zero', async function () {
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
      amountE8: toE8('1.0'),
      direction: 0,
      tokenA: await weth.getAddress(),
      tokenB: await usdc.getAddress(),
      expiry,
    });

    const tx = await orderBook.tryMatch(buyId, sellId);
    const receipt = await tx.wait();
    const matchId = await getMatchIdFromReceipt(orderBook, receipt);

    await expect(settlement.connect(keeper).executeSettlement(matchId, 0, 0, 0, 0)).to.emit(settlement, 'SettlementSkipped');

    const matchData = await orderBook.getMatch(matchId);
    expect(matchData.settled).to.equal(true);
  });

  it('reverts settlement if called twice for same match', async function () {
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
    ).to.be.reverted;
  });

  it('allows owner to update decryption oracle', async function () {
    const { owner, other, settlement } = await loadFixture(deployShadowSwapFixture);

    await expect(settlement.connect(owner).setDecryptionOracle(other.address)).to.not.be.reverted;
    expect(await settlement.decryptionOracle()).to.equal(other.address);
  });

  it('reverts executeSettlement for unknown match id', async function () {
    const { keeper, settlement } = await loadFixture(deployShadowSwapFixture);

    await expect(settlement.connect(keeper).executeSettlement(ethers.ZeroHash, 1, 1, 0, 0)).to.be.reverted;
  });
});
