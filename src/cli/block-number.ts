import { getBlockNumberByTime } from '@/get-block-number';
import { createPublicClient, http } from 'viem';
import { getBlockNumber } from 'viem/actions';
import * as chains from 'viem/chains';

export default async function blockNumber(
  chain: string,
  time?: number | string
) {
  const client = createPublicClient({
    chain: chains[chain as keyof typeof chains],
    transport: http(),
    batch: {
      multicall: true,
    },
  });
  if (time) {
    const t = +time;
    const block = await getBlockNumberByTime(
      client,
      Number.isNaN(t) ? new Date(time).getTime() : t * 1000
    );
    console.log(block);
  } else {
    const blockNumber = await getBlockNumber(client);
    console.log(blockNumber);
  }
}
