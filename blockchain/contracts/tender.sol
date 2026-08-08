// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Tender {
    struct Bid {
        uint256 bidAmount;
        string orgName;
    }

    Bid public minBid;
    Bid[] private biddings;

    function submitBid(uint256 amount, string memory organisation) public {
        biddings.push(Bid(amount, organisation));

        if (biddings.length == 1 || minBid.bidAmount > amount) {
            minBid.bidAmount = amount;
            minBid.orgName = organisation;
        }
    }

    function getMinBid() public view returns (uint256, string memory) {
        return (minBid.bidAmount, minBid.orgName);
    }
}
