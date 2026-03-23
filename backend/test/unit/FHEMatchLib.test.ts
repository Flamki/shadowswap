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

  it('reverts sub on underflow', async function () {
    const Harness = await ethers.getContractFactory('FHEMatchLibHarness');
    const harness = await Harness.deploy();
    await harness.waitForDeployment();

    await expect(harness.sub(3, 8)).to.be.revertedWith('UNDERFLOW');
  });

  it('reverts div by zero', async function () {
    const Harness = await ethers.getContractFactory('FHEMatchLibHarness');
    const harness = await Harness.deploy();
    await harness.waitForDeployment();

    await expect(harness.div(3, 0)).to.be.revertedWith('DIV_BY_ZERO');
  });
});
