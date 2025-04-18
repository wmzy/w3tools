import { getBlockNumberByTime } from '../src/get-block-number';
import { http } from 'viem';
import { createPublicClient } from 'viem';

describe('getBlockNumberByTime', () => {
  it('should get block number by time', async ({ expect }) => {
    const result = await getBlockNumberByTime(
      createPublicClient({
        transport: http(),
      }),
      new Date('2024-04-17T00:00:00Z').getTime()
    );
    await expect(result).resolves.toMatchSnapshot();
  });
});
