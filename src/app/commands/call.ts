import chalk from 'chalk';
import {
  getAddress,
  type Address,
  AbiFunction,
  isAddress,
  stringify,
} from 'viem';
import { getAddressConfig } from '../config';
import { input, select } from '@inquirer/prompts';
import { createClient } from '../client';
import { GlobalOptions } from '../types';
import { tryParseAbi } from '../contract';
import { readContract } from 'viem/actions';

export default async function call({
  contract,
  method,
  args,
  abi,
  block,
  ...options
}: {
  contract?: string;
  method?: string;
  args?: string[];
  abi?: string;
  block?: string;
} & GlobalOptions) {
  const client = createClient(options);

  let contractAddress: Address;
  let contractAbi = tryParseAbi(abi);

  if (!contract) {
    const addressConfig = getAddressConfig();
    const contracts = addressConfig.get('contracts') || [];

    if (contracts.length === 0) {
      throw new Error(
        'No contracts configured. Use set-address command to configure contracts first.'
      );
    }

    const choice = await select({
      message: 'Select contract to call:',
      choices: contracts.map((c) => ({
        name: `${c.name} (${c.address})`,
        value: c,
      })),
    });

    contractAddress = choice.address;
    contractAbi = contractAbi || choice.abi;
  } else {
    if (isAddress(contract, { strict: false })) {
      // 直接使用输入的地址
      contractAddress = getAddress(contract);

      if (!contractAbi) {
        // 检查是否在已配置的合约中有此地址的 ABI
        const addressConfig = getAddressConfig();
        const contracts = addressConfig.get('contracts') || [];
        const savedContract = contracts.find(
          (c) => c.address === contractAddress
        );

        contractAbi = savedContract?.abi;
      }
    } else {
      // 通过名称查找合约
      const addressConfig = getAddressConfig();
      const contracts = addressConfig.get('contracts') || [];
      const savedContract = contracts.find((c) => c.name === contract);

      if (!savedContract) {
        throw new Error(`Contract with name "${contract}" not found`);
      }

      contractAddress = savedContract.address;
      contractAbi = contractAbi || savedContract.abi;
    }
  }

  if (!contractAbi) {
    throw new Error(
      'Contract ABI not found. Please provide ABI with --abi option'
    );
  }

  let functionAbi = contractAbi?.filter(
    (a) => a.type === 'function'
  ) as AbiFunction[];

  if (method) {
    functionAbi = functionAbi.filter((a) => a.name === method);
  }

  let abiItem = functionAbi[0];

  if (functionAbi.length > 1) {
    abiItem = await select({
      message: 'Select ABI to call:',
      choices: functionAbi.map((a) => ({
        name: `${a.name}(${a.inputs?.map((i) => `${i.type} ${i.name || ''}`).join(', ')})`,
        value: a,
      })),
    });
  }

  if (!abiItem) {
    throw new Error('No ABI item found');
  }

  const inputs = abiItem.inputs;

  if (!args?.length) {
    args = [];
    for (const i of inputs) {
      args.push(
        await input({
          message: `Enter ${i.name || ''}(${i.type})`,
        })
      );
    }
  }

  if (args.length !== inputs.length) {
    throw new Error('Invalid number of arguments');
  }

  const parsedArgs = args.map((arg, index) => {
    const t = abiItem.inputs[index]!;
    if (t.type.startsWith('int')) {
      // 1e18
      const [n, e] = arg.split('e');
      return BigInt(n!) * BigInt(10 ** Number(e || 0));
    }

    if (t.type === 'bool') {
      return arg === 'true';
    }

    return arg;
  });

  const blockParam = block
    ? isNaN(Number(block))
      ? block
      : Number(block)
    : undefined;

  const result = await readContract(client, {
    address: contractAddress,
    abi: [abiItem],
    functionName: abiItem!.name,
    args: parsedArgs,
    ...(blockParam
      ? {
          blockNumber:
            typeof blockParam === 'number' ? BigInt(blockParam) : undefined,
          blockTag:
            typeof blockParam === 'string' ? (blockParam as any) : undefined,
        }
      : {}),
  });

  console.log(chalk.green('Call result:'));
  console.log(stringify(result, null, 2));
}
