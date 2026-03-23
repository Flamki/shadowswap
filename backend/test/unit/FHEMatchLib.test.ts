import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('FHEMatchLib', function () {
  it('computes core operations correctly', async function () {
    const Harness = await ethers.getContractFactory('FHEMatchLibHarness');
    const harness = await Harness.deploy();
    await harness.waitForDeployment();

    expect(await harness.gte(10, 9)).to.equal(true);
    expect(await harness.add(10, 9)).to.equal(19);
    expect(await harness.div(20, 2)).to.equal(10);
    expect(await harness.min(3, 8)).to.equal(3);
    expect(await harness.sub(8, 3)).to.equal(5);
    expect(await harness.select(true, 11, 22)).to.equal(11);
  });

  it('supports false select branch', async function () {
    const Harness = await ethers.getContractFactory('FHEMatchLibHarness');
    const harness = await Harness.deploy();
    await harness.waitForDeployment();

    expect(await harness.select(false, 11, 22)).to.equal(22);
    expect(await harness.gte(3, 8)).to.equal(false);
  });

  it('reverts div by zero', async function () {
    const Harness = await ethers.getContractFactory('FHEMatchLibHarness');
    const harness = await Harness.deploy();
    await harness.waitForDeployment();

    await expect(harness.div(3, 0)).to.be.revertedWith('DIV_BY_ZERO');
  });

  it('handles large uint64-compatible values', async function () {
    const Harness = await ethers.getContractFactory('FHEMatchLibHarness');
    const harness = await Harness.deploy();
    await harness.waitForDeployment();

    const a = 9_999_999_000_000n;
    const b = 9_000_000_000_000n;

    expect(await harness.gte(a, b)).to.equal(true);
    expect(await harness.min(a, b)).to.equal(b);
  });
});
