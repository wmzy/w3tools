# 利用 Deployless Calls 批量检查合约地址的高效方法

## 背景

在区块链开发中，我们经常需要判断一个地址是否为合约地址。传统方法通过是调用 `eth_getCode` RPC 方法获取该地址部署的二进制代码来判断是否是合约，这种方法直觉上就是比较蠢的，要把合约的整个代码拉下来才能判断。

于是我想探索下优化的方法，首先想到的是 rpc 请求时不读取整个 http 响应。这个方案看起来是可行的，但是不够通用，尤其是无法批量调用。

当 LLM 告诉我 evm 上可以通过 extcodesize 来判断时，我脑海中就跳出了 viem 文档中的 [Deployless Calls](https://viem.sh/docs/actions/public/call#deployless-calls)。本文将介绍我是如何利用 Deployless Calls 技术实现批量高效检查合约地址的。

## 什么是 Deployless Calls

Deployless Calls 是指无需部署合约到链上，而是直接在交易中包含合约代码并执行的技术。这种方式可以避免部署合约的成本，非常适合一次性使用的逻辑。

我是在 [viem 的文档](https://viem.sh/docs/contract/readContract#deployless-reads)中了解到这项技术的，所以先通过 viem API 实现了一个简单版本。

## 通过 viem readContract 调用 extcodesize

首先，我写了个简单的合约来验证这种方案的可行性：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AddressCodeChecker {
    function hasCode(address addr) external view returns (bool) {
        assembly {
            mstore(0x00, iszero(iszero(extcodesize(addr))))
            return(31, 1)
        }
    }
}
```

将上面代码编译后在前端调用：


```typescript
export async function hasCode(
  client: Client,
  address: Address,
) {
  const result = await readContract(client, {
	  code: '0x6080604052348015600e575f80fd5b5061015b8061001c5f395ff3fe608060405234801561000f575f80fd5b5060043610610029575f3560e01c80639538c4b31461002d575b5f80fd5b610047600480360381019061004291906100c7565b61005d565b604051610054919061010c565b60405180910390f35b5f813b15155f5260205ff35b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6100968261006d565b9050919050565b6100a68161008c565b81146100b0575f80fd5b50565b5f813590506100c18161009d565b92915050565b5f602082840312156100dc576100db610069565b5b5f6100e9848285016100b3565b91505092915050565b5f8115159050919050565b610106816100f2565b82525050565b5f60208201905061011f5f8301846100fd565b9291505056fea2646970667358221220f3aa75abf38c8b99c4a5669110b9e39b0c223fd3d32dc6c9462813034b0ac55364736f6c634300081a0033',
		abi: parseAbi(['function hasCode(address) view returns (bool)'])
		functionName: 'hasCode',
		args: [address],
  });

  return !result;
}
```

很顺利的我得到了一个 bool 值作为返回值，而不是整个合约。 但是我发现另外一个问题，就是上面的合约编译得到的二进制代码比我预想的大了很多。

另一方面，viem 的内部实现也有一个代理合约用来简化调用：

```solidity
pragma solidity ^0.8.17;

// SPDX-License-Identifier: UNLICENSED

contract DeploylessCallViaBytecode {
    constructor(
        bytes memory bytecode,
        bytes memory data
    ) { 
        address to;
        assembly {
            to := create2(0, add(bytecode, 0x20), mload(bytecode), 0)
            if iszero(extcodesize(to)) {
                revert(0, 0)
            }
        }

        assembly {
            let success := call(gas(), to, 0, add(data, 0x20), mload(data), 0, 0)
            let ptr := mload(0x40)
            returndatacopy(ptr, 0, returndatasize())
            if iszero(success) {
                revert(ptr, returndatasize())
            }
            return(ptr, returndatasize())
        }
    }
}
```

这意味着为了调用一个 `extcodesize` 指令，我们要传输 773 个字节的代码，这看起来也很蠢。

于是我又开始了对二进制代码的分析和优化。

## 使用 Yul 优化代码大小

为了搞清楚编译的二进制产物为什么这么大，我把它丢给 LLM 分析了一下。原来 Solidity 编译器在其中加入了部署代码、参数处理、错误处理及元数据等内容。为了省去这部分内容，我简单研究了下 Yul，就开始让 cursor 帮我写代码，但是 LLM 在参数处理这块总是过不去。

最后结合了viem Deployless call 的源码和这个 [ERC20 的示例](https://docs.soliditylang.org/zh-cn/latest/yul.html#erc20-yul)，总算搞懂了合约是如何部署及运行的。其中最重要的是构造函数解析参数的方法，它不是像合约调用那样通过 calldata 传递的，而是附在部署代码后面的。

下面是完整的代码：

```yul
object "AddressCodeChecker" {
    code {
        datacopy(0, datasize("AddressCodeChecker"), 32)
        let addr := mload(0)

        mstore(0, iszero(extcodesize(addr)))

        return(31, 1)
    }
}
```

编译后的结果：

`602060105f395f513b155f5260205ff3`

这里我们通过将代码放在一个 object 中，就可以很容易的切割出后面附带的参数，所以也不需要 `DeploylessCallViaBytecode` 合约进行参数处理和代理调用了，省去了大量的网络和调用开销。

下面是前端的调用代码:

```typescript
export async function hasContractDeployed(
  client: Client,
  address: Address,
  options?: BlockOptions
) {
  const { data } = await call(client, {
    data: concatHex([
      '0x602060105f395f513b155f5260205ff3',
      encodeAbiParameters([{ type: 'address' }], [address]),
    ]),
    ...options,
  });

  if (!data) throw new Error('No code');

  return !hexToBool(data);
}
```

## 批量检查版本

实现了通过合约检查单个地址，那么批量的版本就没什么难度了。

下面是合约代码：

```yul
object "AddressCodeBatchChecker" {
    code {
        let dataSize := sub(codesize(), datasize("AddressCodeBatchChecker"))
        let addressesCount := div(dataSize, 20)
        let resultSize := div(add(addressesCount, 7), 8)

        datacopy(resultSize, datasize("AddressCodeBatchChecker"), dataSize)

        let len := addressesCount
        let byteCount := resultSize

        for { let i := 0 } lt(i, addressesCount) { i := add(i, 1) } {
            let addr := mload(add(resultSize, mul(i, 20)))
            if extcodesize(shr(96, addr)) {
                let bytePos := div(i, 8)
                mstore8(bytePos, or(byte(0, mload(bytePos)), shl(sub(7, mod(i, 8)), 1)))
            }
        }
        
        return(0, resultSize)
    }
}
```

编译结果也不大：

`604e3803601481046008600782010491604e83395f5b818110601f57825ff35b8060146001920284015160601c3b6036575b016015565b6008810482600883066007031b81515f1a179053603156`

这个合约能够接收多个地址作为输入，然后返回一个位图，表示每个地址是否为合约。

前端调用代码：

```typescript
export async function isContracts(
  client: Client,
  addresses: Address[],
  options?: BlockOptions
): Promise<boolean[]> {
  if (addresses.length === 0) return [];

  const { data } = await call(client, {
    data: concatHex([
      '0x604e3803601481046008600782010491604e83395f5b818110601f57825ff35b8060146001920284015160601c3b6036575b016015565b6008810482600883066007031b81515f1a179053603156',
      ...addresses,
    ]),
    ...options,
  });

  if (!data) throw new Error('No data');

  return Array.from(
    BigInt(data)
      .toString(2)
      .padStart((data.length - 2) * 4, '0')
      .slice(0, addresses.length)
  ).map((flag) => flag === '1');
}
```

## 总结

利用 Deployless Calls 技术实现批量检查合约地址，我们能够显著提高处理效率，减少RPC调用次数和网络延迟。这种技术特别适合需要处理大量地址的应用场景，如数据分析、智能合约监控等。由于 RPC 的批量调用通常存在个数的限制，所以以合约的形式来进行一些批量操作是一个不错的选择。 

这种 Deployless Calls 批量处理技术不仅适用于检查合约地址，还可以扩展到批量检查账户余额等场景。
