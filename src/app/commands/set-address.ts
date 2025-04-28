import chalk from 'chalk';
import { Address, Abi, getAddress } from 'viem';
import { getAddressConfig } from '../config';
import { tryParseAbi } from '../contract';
import { select } from '@inquirer/prompts';

type SetAddressOptions = {
  type?: string;
  abi?: string;
  isProxy?: boolean;
};

export default async function setAddress(
  address: string,
  name: string,
  options: SetAddressOptions
) {
  try {
    const normalizedAddress = getAddress(address);

    const addressConfig = getAddressConfig();
    const { type, abi, isProxy } = options;

    const addressType =
      type?.toLowerCase() ||
      (await select({
        message: 'Please select address type',
        choices: ['wallet', 'contract'],
      }));
    if (addressType === 'contract') {
      const contracts = addressConfig.get('contracts') || [];

      const existingIndex = contracts.findIndex(
        (c) => c.address === normalizedAddress
      );

      let parsedAbi = tryParseAbi(abi);

      if (existingIndex >= 0 && contracts[existingIndex]) {
        const existingContract = contracts[existingIndex]!;
        contracts[existingIndex] = {
          name,
          address: existingContract.address,
          abi: parsedAbi || existingContract.abi,
          isProxy: isProxy !== undefined ? isProxy : existingContract.isProxy,
        };
      } else {
        contracts.push({
          name,
          address: normalizedAddress,
          ...(parsedAbi !== undefined ? { abi: parsedAbi } : {}),
          ...(isProxy !== undefined ? { isProxy } : {}),
        });
      }

      addressConfig.set('contracts', contracts);
    } else {
      // 处理钱包地址
      const wallets = addressConfig.get('wallets') || [];

      // 检查是否已存在
      const existingIndex = wallets.findIndex(
        (w) => w.address === normalizedAddress
      );

      if (existingIndex >= 0 && wallets[existingIndex]) {
        // 更新已存在的地址信息
        const existingWallet = wallets[existingIndex]!;
        wallets[existingIndex] = {
          name,
          address: existingWallet.address,
        };
      } else {
        // 添加新的钱包地址
        wallets.push({
          name,
          address: normalizedAddress,
        });
      }

      addressConfig.set('wallets', wallets);
    }

    console.log(
      chalk.green(`Address ${normalizedAddress} set as ${name} successfully!`)
    );
  } catch (error) {
    console.error(
      chalk.red(
        'Error:',
        error instanceof Error ? error.message : 'Unknown error'
      )
    );
    process.exit(1);
  }
}
