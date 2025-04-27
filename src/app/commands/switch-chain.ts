import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import * as builtinChains from 'viem/chains';
import {
  getUserChains,
  getCurrentChain,
  setCurrentChain,
  getChain,
  globalConfig,
} from '../config';
import { createPublicClient, http } from 'viem';
import { getChainId } from 'viem/actions';

export default async function switchChain(target?: string) {
  // Get current chain
  const currentChain = getCurrentChain();

  // Handle quick switch to previous chain (when parameter is '-')
  if (target === '-') {
    const previousChain = globalConfig.get('previousChain');
    if (!previousChain) {
      console.log(chalk.yellow('No previous chain to switch to'));
      return;
    }

    // Set current chain as the previous chain's previous chain (for next switch)
    globalConfig.set('previousChain', currentChain);

    // Switch to previous chain
    setCurrentChain(previousChain);

    // Output information
    const chainObj =
      builtinChains[previousChain as keyof typeof builtinChains] ||
      getChain(previousChain);
    console.log(
      chalk.green(
        `Switched to chain ${previousChain} (${chainObj?.name || previousChain})`
      )
    );
    return;
  }

  if (target && target === currentChain) {
    console.log(chalk.yellow(`Already using chain ${target}`));
    return;
  }

  // Get all available chains
  const userChains = await getUserChains();
  // Get built-in chain names
  const builtinChainNames = Object.keys(builtinChains);

  // If target chain is provided
  if (target) {
    let targetChain;
    // Check if it's a chain ID
    const chainId = Number(target);

    if (!Number.isNaN(chainId)) {
      // Search built-in chains by ID
      targetChain = Object.values(builtinChains).find(
        (chain) => chain.id === chainId
      );
      if (targetChain) {
        // Find the name of the built-in chain
        target =
          Object.keys(builtinChains).find(
            (key) => (builtinChains as any)[key].id === chainId
          ) || '';
      } else {
        // Search user-defined chains
        for (const chain of userChains) {
          const chainConfig = getChain(chain);
          if (chainConfig?.id === chainId) {
            targetChain = chainConfig;
            target = chain;
            break;
          }
        }
      }
    } else {
      // Search by name
      if (builtinChainNames.includes(target)) {
        targetChain = (builtinChains as any)[target];
      } else {
        targetChain = getChain(target);
      }
    }

    if (!targetChain) {
      console.log(chalk.red(`Chain ${target} not found`));
      return;
    }

    // Validate RPC connection
    try {
      const transport = http(
        Array.isArray(targetChain.rpcUrls?.default?.http)
          ? targetChain.rpcUrls.default.http[0]
          : targetChain.rpcUrls?.default?.http
      );

      if (!transport) {
        console.log(chalk.red(`Chain ${target} has no valid RPC URL`));
        return;
      }

      const client = createPublicClient({ transport });
      const chainId = await getChainId(client);

      if (chainId !== targetChain.id) {
        console.log(
          chalk.red(
            `Chain ID mismatch: RPC returned ${chainId}, but config has ${targetChain.id}`
          )
        );
        return;
      }
    } catch (error) {
      console.log(
        chalk.red(
          `Cannot connect to chain ${target} RPC: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }

    // Save previous chain for fallback option
    globalConfig.set('previousChain', currentChain);

    // Switch chain
    setCurrentChain(target);
    console.log(
      chalk.green(`Switched to chain ${target} (${targetChain.name})`)
    );
    return;
  }

  // If no target chain is provided, show selection list
  const allChains = [
    ...builtinChainNames.map((name) => ({
      name: `${(builtinChains as any)[name].name} [Built-in]`,
      value: name,
      id: (builtinChains as any)[name].id,
    })),
    ...userChains.map((name) => {
      const chain = getChain(name);
      return {
        name: `${chain?.name || name} [Custom]`,
        value: name,
        id: chain?.id,
      };
    }),
  ];

  // Sort by name
  allChains.sort((a, b) => a.name.localeCompare(b.name));

  // User selection
  const selectedChain = await select({
    message: 'Select chain to switch to:',
    choices: allChains.map((chain) => ({
      name: `${chain.name} ${currentChain === chain.value ? '[Current]' : ''}`,
      value: chain.value,
      disabled: currentChain === chain.value,
    })),
  });

  // Save previous chain for fallback option
  globalConfig.set('previousChain', currentChain);

  // Switch chain
  setCurrentChain(selectedChain);
  const targetChainObj =
    getChain(selectedChain) || (builtinChains as any)[selectedChain];
  console.log(
    chalk.green(`Switched to chain ${selectedChain} (${targetChainObj.name})`)
  );
}
