// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TenderContractBasic {
    struct Bid {
        uint256 amount;
        string organisation;
    }

    mapping(string => Bid[]) private tenders;

    function submitBid(
        string memory tenderId,
        uint256 amount,
        string memory orgName
    ) public {
        tenders[tenderId].push(Bid(amount, orgName));
    }

    function getBids(
        string memory tenderId
    ) public view returns (Bid[] memory) {
        return tenders[tenderId];
    }
}
