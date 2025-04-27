import { Address, createPublicClient } from 'viem';
import { http } from 'viem';
import { hasContractDeployed, isContracts } from '../src/contract';
import { mainnet } from 'viem/chains';
import { zeroAddress } from 'viem';
import { rangeMap } from '@/util';

describe('contract', () => {
  it('should return true if contract deployed', async ({ expect }) => {
    const result = await hasContractDeployed(
      createPublicClient({
        chain: mainnet,
        transport: http(),
      }),
      '0xcA11bde05977b3631167028862bE2a173976CA11'
    );
    expect(result).toBe(true);
  }, 1000000);

  it('should return false if contract not deployed', async ({ expect }) => {
    const result = await hasContractDeployed(
      createPublicClient({ chain: mainnet, transport: http() }),
      zeroAddress
    );
    expect(result).toBe(false);
  }, 1000000);

  it('should return true if contract deployed', async ({ expect }) => {
    const result = await isContracts(
      createPublicClient({ chain: mainnet, transport: http() }),
      [
        '0xcA11bde05977b3631167028862bE2a173976CA11',
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        '0xcA11bde05977b3631167028862bE2a173976CA11',
        zeroAddress,
        '0xcA11bde05977b3631167028862bE2a173976CA11',
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        '0xcA11bde05977b3631167028862bE2a173976CA11',
        zeroAddress,
        '0xcA11bde05977b3631167028862bE2a173976CA11',
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        '0xcA11bde05977b3631167028862bE2a173976CA11',
        zeroAddress,
        '0xcA11bde05977b3631167028862bE2a173976CA11',
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        zeroAddress,
        '0xcA11bde05977b3631167028862bE2a173976CA11',
        zeroAddress,
      ]
    );
    expect(result).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
    ]);
  }, 1000000);

  it('should check multiple contracts right', async ({ expect }) => {
    const contractAddresses = Object.values(mainnet.contracts).map(
      (c) => c.address
    ) as Address[];
    const contractSet = new Set(contractAddresses);

    const eoaAddresses = Array.from(
      { length: 1000 },
      () =>
        `0x${Math.random().toString(16).slice(2).padStart(40, '0')}` as Address
    );
    const addresses = [
      ...rangeMap(100, () => contractAddresses).flat(),
      ...eoaAddresses,
    ].sort(() => (Math.random() > 0.5 ? 1 : -1));

    const result = await isContracts(
      createPublicClient({ chain: mainnet, transport: http() }),
      addresses
    );

    expect(result).toEqual(
      addresses.map((address) => contractSet.has(address))
    );
  }, 1000000);
});
