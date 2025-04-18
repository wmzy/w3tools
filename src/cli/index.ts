import { Command } from 'commander';
import { version } from '../../package.json';
import chalk from 'chalk';
import { createPublicClient, http, stringify } from 'viem';
import * as chains from 'viem/chains';
import { getBlock } from 'viem/actions';

const program = new Command();

program
  .name('w3tools')
  .description('A collection of Web3 tools')
  .version(version)
  .option(
    '-c, --chain <chain>',
    'Chain to use (mainnet, hoodi, etc.)',
    'mainnet'
  );

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
        await import('./block-number')
      ).default(globalOptions.chain, options.time);
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

const blockCommand = program
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
      const client = createPublicClient({
        chain: chains[globalOptions.chain as keyof typeof chains],
        transport: http(),
      });
      const block = await getBlock(client, options);
      console.log(chalk.green(`Block: ${stringify(block)}`));
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
