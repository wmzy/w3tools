import { getBlockNumberByTime } from '../src/get-block-number';
import { http, createPublicClient } from 'viem';
import { mainnet } from 'viem/chains';

describe('getBlockNumberByTime', () => {
  it('should get block number by time', async ({ expect }) => {
    const result = await getBlockNumberByTime(
      createPublicClient({
        chain: mainnet,
        transport: http(),
      }),
      new Date('2024-04-17T00:00:00Z').getTime()
    );
    expect(typeof result).toBe('bigint');
    expect(result > 0n).toBe(true);
  }, 120000);
});
