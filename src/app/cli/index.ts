import { Command } from 'commander';
import { version } from '../../../package.json';
import chalk from 'chalk';

const program = new Command();

program
  .name('w3tools')
  .description('A collection of Web3 tools')
  .version(version)
  .option('-c, --chain <chain>', 'Chain to use (mainnet, hoodi, etc.)');

program
  .command('chain')
  .description('Show chain info.')
  .action(async () => {
    const globalOptions = program.opts();
    try {
      await (await import('../commands/chain')).default(globalOptions);
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program
  .command('define-chain')
  .description('Define chain.')
  .option('-f, --fork [chain]', 'Fork from a chain.')
  .action(async (options) => {
    try {
      await (await import('../commands/define-chain')).default(options);
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program
  .command('remove-chain')
  .description('Remove chain.')
  .argument('[chain]', 'chain key or id to remove')
  .action(async (chain) => {
    try {
      await (await import('../commands/remove-chain')).default(chain);
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program
  .command('switch-chain')
  .description('Switch chain.')
  .argument('[target]', 'chain key or id, or "-" to switch to previous chain')
  .action(async (target) => {
    try {
      await (await import('../commands/switch-chain')).default(target);
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program
  .command('set-rpc')
  .description('Set RPC URL for a chain.')
  .argument('<...urls>', 'RPC URL')
  .action(async (...urls) => {
    try {
      await (await import('../commands/set-rpc')).default({ urls });
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program
  .command('add-rpc')
  .description('Add RPC URL for a chain.')
  .argument('<...urls>', 'RPC URL')
  .action(async (...urls) => {
    try {
      await (await import('../commands/add-rpc')).default({ urls });
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program
  .command('block-number')
  .description('Returns the number of the most recent block seen.')
  .option(
    '-t, --time <time>',
    'Timestamp in seconds (e.g. 1672531200) or a date string'
  )
  .action(async (options) => {
    try {
      const globalOptions = program.opts();
      await (
        await import('../commands/block-number')
      ).default({ ...globalOptions, ...options });
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
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
    try {
      const globalOptions = program.opts();
      await (
        await import('../commands/block')
      ).default({
        ...globalOptions,
        ...options,
      });
    } catch (error) {
      console.error(
        chalk.red(
          'Error:',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
      process.exit(1);
    }
  });

program.parse(process.argv);
