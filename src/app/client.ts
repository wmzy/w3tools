import { createPublicClient, http } from 'viem';
import { GlobalOptions } from './types';
import { getChain } from './config';
import { globalConfig } from './config';

export function createClient(options: GlobalOptions) {
  const chain = getChain(
    options.chain || globalConfig.get('currentChain') || 'mainnet'
  );
  return createPublicClient({
    chain,
    transport: http(),
    batch: {
      multicall: true,
    },
  });
}
