//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Fake_NFTMarketplace {
    mapping(uint256 => address) public tokens;
    uint256 nft_price = 0.1 ether;

    function purchase(uint256 _tokenId) public payable {
        require(msg.value >= nft_price, "insufficient tranfer of ether");
        tokens[_tokenId] = msg.sender;
    }

    function price() public view returns (uint256) {
        return nft_price;
    }

    function available(uint256 _tokenId) public view returns (bool) {
        if (tokens[_tokenId] == address(0)) {
            return true;
        } else {
            return false;
        }
    }
}
