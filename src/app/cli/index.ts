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
  .action(function () {});

program
  .command('switch-chain')
  .description('Switch chain.')
  .argument('[target]', 'chain name or id')
  .option('-f, --fork [chain]', 'Fork from a chain.')
  .action(function () {});

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
