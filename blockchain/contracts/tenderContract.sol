// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TenderContract {
    struct Bid {
        uint256 bidAmount;
        string orgName;
    }

    struct Tender {
        Bid minBid;
        Bid[] biddings;
    }

    mapping(uint256 => Tender) private tenders;

    function submitBid(
        uint256 tenderId,
        uint256 amount,
        string memory organisation
    ) public {
        Tender storage currTender = tenders[tenderId];

        currTender.biddings.push(Bid(amount, organisation));

        if (
            currTender.biddings.length == 1 ||
            currTender.minBid.bidAmount > amount
        ) {
            currTender.minBid.bidAmount = amount;
            currTender.minBid.orgName = organisation;
        }
    }

    function getMinBid(
        uint256 tenderId
    ) public view returns (uint256, string memory) {
        Tender storage currTender = tenders[tenderId];

        return (currTender.minBid.bidAmount, currTender.minBid.orgName);
    }
}
