import { createPublicClient, fallback, http, Transport } from 'viem';
import { GlobalOptions } from './types';
import { getChain } from './config';
import { globalConfig } from './config';

export function createClient(options: GlobalOptions) {
  const chain = getChain(
    options.chain || globalConfig.get('currentChain') || 'mainnet'
  );
  if (!chain) {
    throw new Error(`Chain ${options.chain} not found`);
  }
  const rpcUrls = globalConfig.get('rpcUrls')[chain.id];
  let transport: Transport = http();
  if (rpcUrls?.length) {
    if (rpcUrls.length === 1) {
      transport = http(rpcUrls[0]);
    } else {
      transport = fallback(rpcUrls.map((r) => http(r)));
    }
  }
  return createPublicClient({
    chain,
    transport,
    batch: {
      multicall: true,
    },
  });
}
