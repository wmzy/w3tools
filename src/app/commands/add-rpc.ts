import chalk from 'chalk';
import { globalConfig } from '../config';
import { getChainIdByRpcUrl } from '../rpc';

type SetRpcOptions = {
  urls: string[];
};

export default async function addRpc({ urls }: SetRpcOptions) {
  const chainIds = await Promise.all(urls.map(getChainIdByRpcUrl));
  const newRpcUrls = chainIds.reduce((acc, chainId, index) => {
    const rpcs = acc[chainId];
    const rpcUrl = urls[index]!;
    acc[chainId] = [rpcUrl, ...(urls || [])];
    return {
      ...acc,
      [chainId]: [rpcUrl, ...(rpcs || [])],
    };
  }, globalConfig.get('rpcUrls'));

  globalConfig.set('rpcUrls', newRpcUrls);

  console.log(chalk.green('RPC URLs added successfully'));
}
