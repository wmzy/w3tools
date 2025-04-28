import { Command } from 'commander';
import { version } from '../../../package.json';
import chalk from 'chalk';

const program = new Command();

process.on('unhandledRejection', (error, promise) => {
  if (program.opts().debug) {
    throw error;
  }
  console.error(
    chalk.red('Error:'),
    error instanceof Error ? error.message : 'Unknown error'
  );
  process.exit(1);
});

program
  .name('w3tools')
  .description('A collection of Web3 tools')
  .version(version)
  .option('-d, --debug', 'Debug mode')
  .option('-c, --chain <chain>', 'Chain to use (mainnet, hoodi, etc.)');

program
  .command('chain')
  .description('Show chain info.')
  .action(async () => {
    const globalOptions = program.opts();
    await (await import('../commands/chain')).default(globalOptions);
  });

program
  .command('define-chain')
  .description('Define chain.')
  .option('-f, --fork [chain]', 'Fork from a chain.')
  .action(async (options) => {
    await (await import('../commands/define-chain')).default(options);
  });

program
  .command('remove-chain')
  .description('Remove chain.')
  .argument('[chain]', 'chain key or id to remove')
  .action(async (chain) => {
    await (await import('../commands/remove-chain')).default(chain);
  });

program
  .command('switch-chain')
  .description('Switch chain.')
  .argument('[target]', 'chain key or id, or "-" to switch to previous chain')
  .action(async (target) => {
    await (await import('../commands/switch-chain')).default(target);
  });

program
  .command('set-rpc')
  .description('Set RPC URL for a chain.')
  .argument('<...urls>', 'RPC URL')
  .action(async (...urls) => {
    await (await import('../commands/set-rpc')).default({ urls });
  });

program
  .command('add-rpc')
  .description('Add RPC URL for a chain.')
  .argument('<...urls>', 'RPC URL')
  .action(async (...urls) => {
    await (await import('../commands/add-rpc')).default({ urls });
  });

program
  .command('set-address')
  .description('Set address info.')
  .argument('<address>', 'address')
  .argument('<name>', 'name')
  .option('-t, --type <type>', 'type (contract, wallet)')
  .option('-a, --abi <abi>', 'abi')
  .option('-p, --is-proxy', 'is proxy')
  .action(async (address, name, options) => {
    await (
      await import('../commands/set-address')
    ).default(address, name, options);
  });

program
  .command('block-number')
  .description('Returns the number of the most recent block seen.')
  .option(
    '-t, --time <time>',
    'Timestamp in seconds (e.g. 1672531200) or a date string'
  )
  .action(async (options) => {
    const globalOptions = program.opts();
    await (
      await import('../commands/block-number')
    ).default({ ...globalOptions, ...options });
  });

program
  .command('block')
  .description(
    'Returns information about a block at a block number, hash or tag.'
  )
  .option('-h, --hash <hash>', 'block hash')
  .option('-n, --number <number>', 'block number', (value) =>
    parseInt(value, 10)
  )
  .option(
    '-t, --tag <tag>',
    'block tag (latest, earliest, pending, safe, finalized)'
  )
  .option(
    '-i, --include-transactions',
    'Whether or not to include transactions',
    false
  )
  .action(async (options) => {
    const globalOptions = program.opts();
    await (
      await import('../commands/block')
    ).default({
      ...globalOptions,
      ...options,
    });
  });

program
  .command('call')
  .description('Calls a contract method.')
  .argument('[contract]', 'contract name or address')
  .argument('[...args]', 'method arguments')
  .option('-a, --abi <abi>', 'abi')
  .option('-m, --method <method>', 'method name')
  .option('-b, --block <block>', 'block number or tag')
  .action(async (contract, args, options) => {
    await (
      await import('../commands/call')
    ).default({ ...program.opts(), contract, args, ...options });
  });

program.parse(process.argv);
