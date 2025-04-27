// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AddressCodeBatchChecker {
    // 返回一个字节数组，每个字节表示8个地址的代码状态
    // 每个字节的每个位表示一个地址是否是已部署合约
    // 0表示是未部署合约，1表示是已部署合约
    function checkAddressCode(address[] calldata addresses) external view returns (bytes memory) {
        bytes memory result;
        
        assembly {
            // 计算需要的字节数和分配内存
            let len := addresses.length
            let byteCount := div(add(len, 7), 8)
            result := mload(0x40)
            mstore(result, byteCount)
            let dataPtr := add(result, 0x20)
            
            // 更新free memory指针并清零内存
            mstore(0x40, add(dataPtr, mul(div(add(byteCount, 31), 32), 32)))
            calldatacopy(dataPtr, 0, 0)  // trick: 复制calldata的前32字节（0字节）到结果区域 - 即清零
            
            // 处理每个地址
            for { let i := 0 } lt(i, len) { i := add(i, 1) } {
                if extcodesize(calldataload(add(addresses.offset, mul(i, 0x20)))) {
                    let bytePos := add(dataPtr, div(i, 8))
                    mstore8(bytePos, or(byte(0, mload(bytePos)), shl(sub(7, mod(i, 8)), 1)))
                }
            }
        }
        
        return result;
    }
}