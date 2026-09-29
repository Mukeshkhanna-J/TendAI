// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FindMinBids {
    struct Commitment {
        address submitter;
        uint256 amount;
    }

    struct TopBids {
        Commitment l1;
        Commitment l2;
        Commitment l3;
        uint8 count;
    }

    // tender_id is a string
    mapping(string => TopBids) private bidMap;

    function addCommitment(string memory tender_id, uint256 amount) external {
        TopBids storage bids = bidMap[tender_id];

        Commitment memory newBid = Commitment({
            submitter: msg.sender,
            amount: amount
        });

        // First bid
        if (bids.count == 0) {
            bids.l1 = newBid;
            bids.count = 1;
            return;
        }

        // Second bid
        if (bids.count == 1) {
            if (amount < bids.l1.amount) {
                bids.l2 = bids.l1;
                bids.l1 = newBid;
            } else {
                bids.l2 = newBid;
            }

            bids.count = 2;
            return;
        }

        // Third bid
        if (bids.count == 2) {
            if (amount < bids.l1.amount) {
                bids.l3 = bids.l2;
                bids.l2 = bids.l1;
                bids.l1 = newBid;
            } else if (amount < bids.l2.amount) {
                bids.l3 = bids.l2;
                bids.l2 = newBid;
            } else {
                bids.l3 = newBid;
            }

            bids.count = 3;
            return;
        }

        // Already have L1, L2, L3
        // If new bid is not better than L3, ignore it.
        if (amount >= bids.l3.amount) {
            return;
        }

        // New bid becomes L1
        if (amount < bids.l1.amount) {
            bids.l3 = bids.l2;
            bids.l2 = bids.l1;
            bids.l1 = newBid;
        }
        // New bid becomes L2
        else if (amount < bids.l2.amount) {
            bids.l3 = bids.l2;
            bids.l2 = newBid;
        }
        // New bid becomes L3
        else {
            bids.l3 = newBid;
        }
    }

    function getMinBids(
        string memory tender_id
    )
        external
        view
        returns (
            Commitment memory l1,
            Commitment memory l2,
            Commitment memory l3,
            uint8 count
        )
    {
        TopBids storage bids = bidMap[tender_id];

        return (bids.l1, bids.l2, bids.l3, bids.count);
    }
}
