import chalk from 'chalk';
import { confirm, select } from '@inquirer/prompts';
import {
  removeChain,
  getUserChains,
  getCurrentChain,
  setCurrentChain,
  getChain,
  globalConfig,
} from '../config';
import Conf from 'conf';

export default async function removeChainCommand(chainName?: string) {
  // Get user-defined chains list
  const userChains = await getUserChains();

  if (userChains.length === 0) {
    console.log(chalk.yellow('No user-defined chains to remove'));
    return;
  }

  // Get configuration file names list
  const config = new Conf({ projectName: 'w3tools' });
  const path = await import('path');
  const fs = await import('fs/promises');
  const chainsDir = path.join(path.dirname(config.path), 'chains');
  const chainFiles = await fs.readdir(chainsDir);
  const chainConfigs = chainFiles.map((file) => file.slice(0, -5));

  // If chain name is provided as parameter
  let selectedChain = chainName;
  if (selectedChain) {
    let chainConfig;
    const chainId = Number(selectedChain);
    if (Number.isNaN(chainId)) {
      chainConfig = getChain(selectedChain);
    } else {
      for (const chain of userChains) {
        const c = getChain(chain);
        if (c?.id === chainId) {
          chainConfig = c;
          selectedChain = chain;
          break;
        }
      }
    }
    if (!chainConfig) {
      console.log(chalk.red(`Chain ${selectedChain} not found`));
      return;
    }
  }

  if (!selectedChain) {
    // Create options list
    const choices = userChains.map((chain) => {
      const chainConfig = getChain(chain);
      return {
        name: `${chainConfig?.name} (ID: ${chainConfig?.id})`,
        value: chain,
      };
    });

    selectedChain = await select({
      message: 'Select chain to remove:',
      choices,
    });
  }

  // Confirm deletion
  const confirmed = await confirm({
    message: `Are you sure you want to remove chain ${selectedChain}?`,
    default: false,
  });

  if (!confirmed) {
    console.log(chalk.yellow('Operation cancelled'));
    return;
  }

  // Check if it's the current chain
  const currentChain = await getCurrentChain();
  if (currentChain === selectedChain) {
    console.log(
      chalk.yellow(`Note: You are removing the currently active chain`)
    );
    const previousChain = globalConfig.get('previousChain') || 'mainnet';
    const confirmCurrent = await confirm({
      message: `Current chain will be reset to ${previousChain}, continue?`,
      default: false,
    });

    if (!confirmCurrent) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }

    // Reset current chain to previous or mainnet
    setCurrentChain(previousChain);
    globalConfig.set('previousChain', undefined);
  }

  // Execute deletion
  removeChain(selectedChain);
  console.log(
    chalk.green(`Chain ${selectedChain} has been successfully removed`)
  );
}
