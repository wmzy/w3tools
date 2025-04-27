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
