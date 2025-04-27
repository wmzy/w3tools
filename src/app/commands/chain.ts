import { stringify } from 'viem';
import chalk from 'chalk';
import { getChain, globalConfig } from '../config';

export default async function chain(options: { chain?: string }) {
  const chain = await getChain(
    options.chain || globalConfig.get('currentChain') || 'mainnet'
  );
  console.log(chalk.green(`Chain: ${stringify(chain)}`));
}
