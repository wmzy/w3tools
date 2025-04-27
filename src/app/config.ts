import Conf from 'conf';
import { Chain } from 'viem/chains';
import fs from 'fs/promises';
import * as path from 'path';
import {
  name as projectName,
  version as projectVersion,
} from '../../package.json';

type GlobalConfig = {
  currentChain: string;
  previousChain?: string;
  rpcUrls: Record<string, string[]>;
  editor?: string;
};

// 全局配置
export const globalConfig = new Conf<GlobalConfig>({
  projectName,
  projectVersion,
  defaults: {
    currentChain: 'mainnet',
    previousChain: undefined,
    rpcUrls: {},
  },
});

// 获取链配置
export const getChain = (
  name: string
): (Chain & { base?: string }) | undefined => {
  try {
    const config = new Conf<Chain>({
      projectName,
      configName: path.join('chains', `${name}`),
    });
    return config.store;
  } catch {
    return undefined;
  }
};

// 获取所有链
export const getUserChains = async (): Promise<Chain[]> => {
  const config = new Conf<GlobalConfig>({
    projectName,
  });
  const configPath = config.path;
  const dir = path.dirname(configPath);
  const files = await fs.readdir(path.join(dir, 'chains'));
  return files
    .map((file) => {
      // rm .json
      const name = file.slice(0, -5);
      return getChain(name);
    })
    .filter((chain): chain is Chain => chain !== undefined);
};

export const getCurrentChain = () => globalConfig.get('currentChain');

export const setCurrentChain = (chain: string) =>
  globalConfig.set('currentChain', chain);

export const addChain = (name: string, chain: Chain) => {
  const config = new Conf<Chain>({
    projectName,
    configName: path.join('chains', `${name}`),
  });
  config.store = chain;
  return config.path;
};

export const removeChain = (name: string) => {
  const config = new Conf<Chain>({
    projectName,
    configName: path.join('chains', `${name}`),
  });
  config.clear();
};
