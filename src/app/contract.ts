import { Abi, parseAbi } from 'viem';

export function tryParseAbi(abi?: string) {
  if (!abi) return;
  try {
    if (abi.startsWith('[')) {
      return JSON.parse(abi) as Abi;
    }
    if (abi.startsWith('{')) {
      return [JSON.parse(abi)] as Abi;
    }
    return parseAbi([abi]);
  } catch (error) {
    return;
  }
}
