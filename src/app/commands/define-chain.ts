import chalk from 'chalk';
import { input, confirm, select } from '@inquirer/prompts';
import { addChain, getChain, getCurrentChain, globalConfig } from '../config';
import * as builtinChains from 'viem/chains';
import { Chain } from 'viem/chains';
import openEditor from 'open-editor';
import { createPublicClient, http } from 'viem';
import { camelCase } from '@/util';
import { allEditors } from 'env-editor';
import { getContractDeployedBlockNumber } from '@/contract';
import { getChainId } from 'viem/actions';

async function testRpcConnection(
  client: ReturnType<typeof createPublicClient>
) {
  try {
    await getChainId(client);
    return true;
  } catch (error) {
    console.error(chalk.yellow('Warning: Failed to connect to RPC endpoint'));
    return false;
  }
}

export default async function defineChain({ fork }: { fork?: string }) {
  const chainKey = fork ? fork : await getCurrentChain();
  const baseChain = (builtinChains[chainKey as keyof typeof builtinChains] ||
    (await getChain(chainKey))) as (Chain & { base?: string }) | undefined;

  if (!baseChain) {
    throw new Error(`Chain ${chainKey} not found`);
  }

  const chain = structuredClone(baseChain);
  if (chain.fees || chain.serializers || chain.formatters) {
    chain.base = baseChain.base || chainKey;
  }
  chain.fees = undefined;
  chain.serializers = undefined;
  chain.formatters = undefined;

  let client: ReturnType<typeof createPublicClient>;

  do {
    const rpcUrlsInput = await input({
      message: 'RPC URL:',
      default: baseChain?.rpcUrls.default.http.join(','),
      validate: (value) => {
        if (!value) return 'RPC URL is required';
        try {
          const urls = value.split(',');
          urls.forEach((url) => {
            new URL(url);
          });
          return true;
        } catch {
          return 'Invalid URL';
        }
      },
    });

    const rpcUrls = (chain.rpcUrls.default.http = rpcUrlsInput.split(','));
    client = createPublicClient({
      transport: http(rpcUrls[0]),
    });
  } while (!(await testRpcConnection(client)));

  // Get chain ID
  chain.id = await getChainId(client);
  console.log(chalk.green(`Detected chain ID: ${chain.id}`));

  // Get chain name
  chain.name = await input({
    message: 'Chain name:',
    default: `${chain.name} Copy`,
    transformer: (value) => value.trim(),
    validate: (value) => {
      if (!value) return 'Chain name is required';
      return true;
    },
  });

  const alias = await input({
    message: 'Chain alias:',
    default: `${camelCase(chain.name)}`,
    validate: (value) => {
      if (!value) return 'Chain alias is required';
      if (!/^[\w]+$/g.test(value)) {
        return 'Chain alias must contain only letters and numbers';
      }
      return true;
    },
  });

  // Configure native currency
  const editNativeCurrency = await confirm({
    message: 'Edit native currency?',
    default: false,
  });

  if (editNativeCurrency) {
    const currencyName = await input({
      message: 'Native currency name:',
      default: chain.nativeCurrency?.name || 'Ether',
      validate: (value) => {
        if (!value) return 'Currency name is required';
        return true;
      },
    });

    const currencySymbol = await input({
      message: 'Native currency symbol:',
      default: chain.nativeCurrency?.symbol || 'ETH',
      validate: (value) => {
        if (!value) return 'Currency symbol is required';
        return true;
      },
    });

    const currencyDecimals = await input({
      message: 'Native currency decimals:',
      default: chain.nativeCurrency?.decimals?.toString() || '18',
      validate: (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0 || num > 255) {
          return 'Decimals must be a number between 0 and 255';
        }
        return true;
      },
    });

    chain.nativeCurrency = {
      name: currencyName,
      symbol: currencySymbol,
      decimals: parseInt(currencyDecimals, 10),
    };
  }

  const multicall3BlockCreated = await getContractDeployedBlockNumber(
    client,
    '0xca11bde05977b3631167028862be2a173976ca11'
  );

  chain.contracts = chain.contracts || {};
  if (multicall3BlockCreated) {
    chain.contracts.multicall3 = {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: Number(multicall3BlockCreated),
    };
  }

  const configPath = addChain(alias, chain);

  const review = await confirm({
    message: 'Review and edit in editor?',
    default: true,
  });

  if (review) {
    let editor = globalConfig.get('editor') || process.env.EDITOR;
    if (!editor) {
      editor = await select({
        message: 'Select editor:',
        choices: allEditors().map((e) => ({
          name: e.name,
          value: e.id,
        })),
      });
      const saveAsDefault = await confirm({
        message: 'Save as default editor?',
        default: true,
      });
      if (saveAsDefault) {
        globalConfig.set('editor', editor);
      }
    }
    await openEditor([configPath], { editor, wait: true });
  }

  console.log(chalk.green(`Chain ${alias} defined successfully!`));
}
