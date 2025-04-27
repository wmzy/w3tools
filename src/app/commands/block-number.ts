import { getBlockNumberByTime } from '@/get-block-number';
import { createClient } from '../client';
import { getBlockNumber } from 'viem/actions';
import { GlobalOptions } from '../types';

export default async function blockNumber({
  time,
  ...options
}: {
  time?: number | string;
} & GlobalOptions) {
  const client = createClient(options);
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
