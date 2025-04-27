import {
  Address,
  BlockTag,
  Client,
  concatHex,
  encodeAbiParameters,
  hexToBool,
} from 'viem';
import { call, getBlock, getBlockNumber } from 'viem/actions';

type BlockOptions =
  | {
      blockNumber?: bigint;
    }
  | {
      blockTag?: BlockTag;
    };

export async function hasContractDeployed(
  client: Client,
  address: Address,
  options?: BlockOptions
) {
  const { data } = await call(client, {
    data: concatHex([
      '0x602060115f395f513b155f526001601ff3',
      encodeAbiParameters([{ type: 'address' }], [address]),
    ]),
    ...options,
  });

  if (!data) throw new Error('No code');

  return !hexToBool(data);
}

export async function getContractDeployedBlockNumber(
  client: Client,
  address: Address
) {
  const [hasDeployed, latest, earliest] = await Promise.all([
    hasContractDeployed(client, address),
    getBlockNumber(client),
    getBlock(client, {
      blockTag: 'earliest',
    }),
  ]);
  if (hasDeployed) {
    return;
  }
  return getContractDeployedBlockNumberBinary(
    client,
    address,
    earliest.number,
    latest
  );
}

async function getContractDeployedBlockNumberBinary(
  client: Client,
  address: Address,
  from: bigint,
  to: bigint
) {
  if (from + 1n === to) {
    return to;
  }
  const mid = (from + to) / 2n;
  const hasDeployed = await hasContractDeployed(client, address, {
    blockNumber: mid,
  });
  if (hasDeployed) {
    return getContractDeployedBlockNumberBinary(client, address, from, mid);
  }
  return getContractDeployedBlockNumberBinary(client, address, mid, to);
}

export async function isContracts(
  client: Client,
  addresses: Address[],
  options?: BlockOptions
): Promise<boolean[]> {
  if (addresses.length === 0) return [];

  const { data } = await call(client, {
    data: concatHex([
      '0x604e3803601481046008600782010491604e83395f5b818110601f57825ff35b8060146001920284015160601c3b6036575b016015565b6008810482600883066007031b81515f1a179053603156',
      ...addresses,
    ]),
    ...options,
  });

  if (!data) throw new Error('No data');

  return Array.from(
    BigInt(data)
      .toString(2)
      .padStart((data.length - 2) * 4, '0')
      .slice(0, addresses.length)
  ).map((flag) => flag === '1');
}
