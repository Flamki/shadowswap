import { MatchingKeeper } from './matchingKeeper';
import { SettlementWatcher } from './settlementWatcher';

async function main() {
  const keeper = new MatchingKeeper();
  const watcher = new SettlementWatcher();

  await keeper.start();
  await watcher.start();

  console.log('[Main] ShadowSwap keeper services started');

  const shutdown = () => {
    console.log('[Main] Shutting down...');
    keeper.stop();
    watcher.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
