// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AddressCodeChecker {
    function hasNoCode(address addr) external view returns (bool) {
        assembly {
            mstore(0x00, iszero(extcodesize(addr)))
            return(0x00, 32)
        }
    }
}