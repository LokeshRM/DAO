//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface INft_contract {
    function balanceOf(address) external view returns (uint256);

    function tokenOfOwnerByIndex(address, uint256)
        external
        view
        returns (uint256);
}

interface IFake_NFT {
    function purchase(uint256 _tokenId) external payable;

    function price() external view returns (uint256);

    function available(uint256 _tokenId) external view returns (bool);
}

contract DAO is Ownable {
    struct Proposal {
        uint256 nftTokenId;
        mapping(uint256 => bool) votes;
        uint256 upVotes;
        uint256 downVotes;
        uint256 deadline;
        bool executed;
    }
    INft_contract nft_contract;
    IFake_NFT fakeNFT;

    uint256 public proposalIndex;

    mapping(uint256 => Proposal) public proposals;

    constructor(address _nftAddress, address _fakeNFT) {
        nft_contract = INft_contract(_nftAddress);
        fakeNFT = IFake_NFT(_fakeNFT);
    }

    modifier onlyNFTHolder() {
        require(nft_contract.balanceOf(msg.sender) > 0, "not an nft holder");
        _;
    }

    modifier activeProposal(uint256 _proposalIndex) {
        require(
            proposals[_proposalIndex].deadline > block.timestamp,
            "proposal ended"
        );
        _;
    }

    modifier deadProposal(uint256 _proposalIndex) {
        require(
            proposals[_proposalIndex].deadline < block.timestamp,
            "proposal ended"
        );
        _;
    }

    enum Status {
        down,
        up
    }

    function createProposal(uint256 _tokenId) public onlyNFTHolder {
        require(fakeNFT.available(_tokenId), "NFT not availabe");
        Proposal storage proposal = proposals[proposalIndex];
        proposal.nftTokenId = _tokenId;
        proposal.deadline = block.timestamp + 5 minutes;
        proposalIndex++;
    }

    function voteProposal(Status _state, uint256 _proposalIndex)
        public
        onlyNFTHolder
        activeProposal(_proposalIndex)
    {
        uint256 balance = nft_contract.balanceOf(msg.sender);
        Proposal storage proposal = proposals[_proposalIndex];
        uint256 votes;
        for (uint256 i; i < balance; i++) {
            uint256 tokenId = nft_contract.tokenOfOwnerByIndex(msg.sender, i);
            if (!proposal.votes[tokenId]) {
                votes++;
                proposal.votes[tokenId] = true;
            }
        }
        require(votes > 0, "Votes are already casted");
        if (_state == Status.down) {
            proposal.downVotes += votes;
        } else {
            proposal.upVotes += votes;
        }
    }

    function execute(uint256 _proposalIndex)
        public
        onlyNFTHolder
        deadProposal(_proposalIndex)
    {
        Proposal storage proposal = proposals[_proposalIndex];
        if (proposal.upVotes > proposal.downVotes) {
            uint256 price = fakeNFT.price();
            require(address(this).balance >= price, "insufficient balace");
            fakeNFT.purchase{value: price}(proposal.nftTokenId);
        }
        proposal.executed = true;
    }

    function withdrawEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}

    fallback() external payable {}
}
