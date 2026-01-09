import { Address } from 'viem';
import * as ff from 'fetch-fun';
import { throwWith } from './error';

export async function fetchAbiFromExplorer(
  address: Address,
  { apiUrl, apiKey }: { apiUrl: string; apiKey?: string }
) {
  const res = await ff
    .create()
    .with(
      ff.url,
      `${apiUrl}?module=contract&action=getabi&address=${address}${apiKey ? `&apikey=${apiKey}` : ''}`
    )
    .with(ff.retry, 3)
    .pipe(ff.fetchJSON<{ result: string }>);
  if (res.result.startsWith('[')) return res.result;
  if (res.result === 'Missing/Invalid API Key') {
    throwWith(new Error(res.result), {
      code: 'EXPLORER_MISSING_INVALID_API_KEY',
    });
  }

  throwWith(new Error(res.result), {
    code: 'EXPLORER_UNKNOWN_ERROR',
  });
}
