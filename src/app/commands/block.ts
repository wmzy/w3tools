import { GlobalOptions } from '../types';
import { createClient } from '../client';
import { getBlock } from 'viem/actions';

export default async function block(
  options: GlobalOptions & {
    hash?: string;
    number?: number;
    tag?: string;
    includeTransactions?: boolean;
  }
) {
  const client = createClient(options);
  const block = await getBlock(client, options);
  console.log(block);
}
