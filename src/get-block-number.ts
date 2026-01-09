import { Block, BlockTag, Client } from 'viem';
import { getBlock as _getBlock } from 'viem/actions';
import { range } from './util';

import { max, min } from './util/bigint';

type SupportedBlockTag = Exclude<BlockTag, 'pending'>;
type SupportedBlock = Block<bigint, false, SupportedBlockTag>;

const cacheMap = new WeakMap<Client, Map<bigint, SupportedBlock>>();

async function getBlock(
  client: Client,
  params?:
    | { blockNumber?: bigint }
    | { blockTag?: Exclude<BlockTag, 'pending'> }
): Promise<SupportedBlock> {
  const cache = cacheMap.get(client) || new Map<bigint, SupportedBlock>();
  cacheMap.set(client, cache);
  const bn = (params as undefined | { blockNumber?: bigint })?.blockNumber;
  const cached = bn && cache.get(bn);
  if (cached) return cached;

  const block = (await _getBlock(client, params)) as SupportedBlock;
  cache.set(block.number, block);
  return block;
}

async function getBlockTime(
  client: Client,
  blockNumber: bigint
): Promise<number> {
  const block = await getBlock(client, { blockNumber });
  return Number(block.timestamp);
}

function toBigInt(n: number): bigint {
  return BigInt(Math.floor(n));
}

async function getBlockNumberByTimeBase(
  client: Client,
  timestamp: number,
  before: bigint,
  after: bigint
): Promise<bigint> {
  const [beforeTime, afterTime] = await Promise.all([
    getBlockTime(client, before),
    getBlockTime(client, after),
  ]);
  if (timestamp <= beforeTime) return before;
  if (timestamp >= afterTime) return after;

  const blockCount = after - before;

  if (blockCount === 1n) return before;
  if (blockCount < 5n) {
    const blocks = range(Number(before) + 1, Number(after)).map(BigInt);
    const times = await Promise.all(
      blocks.map((block) => getBlockTime(client, block))
    );
    const i = times.findIndex((time) => time > timestamp);
    if (i === -1) return after - 1n;
    if (i === 0) return before;
    return blocks[i - 1]!;
  }

  const estimateBlocks = () => {
    const timeGap = afterTime - beforeTime;
    const floatBlocks = blockCount / 10n || 1n;
    const blockTime = timeGap / Number(blockCount);
    const estimatedBlock =
      toBigInt((timestamp - beforeTime) / blockTime) + before;
    const estimated = max(before + 1n, min(estimatedBlock, after - 1n));
    const floatLeft = max(before, estimated - floatBlocks);
    // const floatLeft = (before + estimated) / 2n;
    const floatRight = min(estimated + floatBlocks, after);
    // const floatRight = (estimated + after) / 2n;

    return [floatLeft, estimated, floatRight] as const;
  };

  const estimated = estimateBlocks();
  const estimatedTimes = await Promise.all(
    estimated.map((b) => getBlockTime(client, b))
  );
  const estimatedIndex = estimatedTimes.findIndex((time) => time > timestamp);
  if (estimatedIndex === -1) {
    return getBlockNumberByTimeBase(
      client,
      timestamp,
      estimated[2],
      after - 1n
    );
  }
  if (estimatedIndex === 0) {
    return getBlockNumberByTimeBase(
      client,
      timestamp,
      before + 1n,
      estimated[0]
    );
  }
  return getBlockNumberByTimeBase(
    client,
    timestamp,
    estimated[estimatedIndex - 1]!,
    estimated[estimatedIndex]!
  );
}

export async function getBlockNumberByTime(
  client: Client,
  timestamp: number,
  fromBlock: bigint | SupportedBlockTag = 'earliest',
  toBlock: bigint | SupportedBlockTag = 'latest'
): Promise<bigint> {
  const getBlockByNumberOrTag = (numOrTag?: bigint | SupportedBlockTag) =>
    getBlock(
      client,
      typeof numOrTag === 'bigint'
        ? { blockNumber: numOrTag }
        : { blockTag: numOrTag }
    );

  const [before, after] = (
    await Promise.all([
      getBlockByNumberOrTag(fromBlock),
      getBlockByNumberOrTag(toBlock),
    ])
  ).sort((a, b) => Number(a.number) - Number(b.number));

  const t = Math.floor(timestamp / 1000);
  if (t < before.timestamp || t > after.timestamp) {
    throw new Error('timestamp is out of range');
  }

  const beforeNumber =
    before.timestamp === 0n ? before.number + 1n : before.number;

  return getBlockNumberByTimeBase(client, t, beforeNumber, after.number);
}
