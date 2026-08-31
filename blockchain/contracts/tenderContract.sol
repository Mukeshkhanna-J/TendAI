// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BidVerification (Nested Mapping Pattern)
/// @notice Maps tenderId => bidderAddress => Commitment to enforce 1 bid per wallet per tender.
contract TenderContract {
    struct Commitment {
        bytes32 commitHash;
        address submitter;
        uint256 timestamp;
        bool exists;
    }

    // Main Storage: tenderId -> (bidderAddress -> Commitment struct)
    mapping(string => mapping(address => Commitment)) private tenderCommitments;

    // Helper Array: tenderId -> array of bidder addresses (used to iterate off-chain)
    mapping(string => address[]) private tenderBidders;

    event BidCommitted(
        string indexed tenderId,
        bytes32 commitHash,
        address indexed submitter,
        uint256 timestamp
    );

    /// @notice Submit a commit-hash for a specific tender.
    /// @dev Blocks the same wallet from submitting twice for the same tender.
    function submitBid(string calldata tenderId, bytes32 commitHash) external {
        // O(1) Check: Rejects if sender already submitted a bid for this tenderId
        require(
            !tenderCommitments[tenderId][msg.sender].exists,
            "Bidder has already submitted a bid for this tender"
        );

        // Store commitment data
        tenderCommitments[tenderId][msg.sender] = Commitment({
            commitHash: commitHash,
            submitter: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        // Store bidder address to enable array fetching on the frontend
        tenderBidders[tenderId].push(msg.sender);

        emit BidCommitted(tenderId, commitHash, msg.sender, block.timestamp);
    }

    /// @notice Fetch a specific bidder's commitment for a given tender.
    function getBidderCommitment(
        string calldata tenderId,
        address bidder
    )
        external
        view
        returns (
            bytes32 commitHash,
            address submitter,
            uint256 timestamp,
            bool exists
        )
    {
        Commitment memory c = tenderCommitments[tenderId][bidder];
        return (c.commitHash, c.submitter, c.timestamp, c.exists);
    }

    /// @notice Returns the list of all bidder addresses that participated in a tender.
    function getTenderBidders(
        string calldata tenderId
    ) external view returns (address[] memory) {
        return tenderBidders[tenderId];
    }
}
