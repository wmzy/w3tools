object "AddressCodeChecker" {
    code {
        datacopy(0, datasize("AddressCodeChecker"), 32)
        let addr := mload(0)

        mstore(0, iszero(extcodesize(addr)))

        return(31, 1)
    }
}
