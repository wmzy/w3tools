import { createPublicClient, http } from 'viem';
import { getChainId } from 'viem/actions';

export async function getChainIdByRpcUrl(rpcUrl: string) {
  const client = createPublicClient({
    transport: http(rpcUrl),
  });
  return await getChainId(client);
}
