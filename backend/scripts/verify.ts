import { run } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const networkName = process.env.DEPLOYMENT_NETWORK || 'arbitrumSepolia';
  const deploymentPath = path.join(process.cwd(), 'deployments', `${networkName}.json`);

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8')) as {
    shadowVault: string;
    shadowOrderBook: string;
    shadowSettlement: string;
  };

  console.log('Verifying ShadowVault...');
  await run('verify:verify', {
    address: deployment.shadowVault,
    constructorArguments: [],
  });

  console.log('Verifying ShadowOrderBook...');
  await run('verify:verify', {
    address: deployment.shadowOrderBook,
    constructorArguments: [deployment.shadowVault],
  });

  console.log('Verifying ShadowSettlement...');
  await run('verify:verify', {
    address: deployment.shadowSettlement,
    constructorArguments: [deployment.shadowOrderBook, deployment.shadowVault],
  });

  console.log('Verification complete.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
