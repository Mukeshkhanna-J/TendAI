// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BidVerification
/// @notice Stores an immutable commit-hash for each bid so a later "reveal"
///         (the bid document) can be checked against it. Once a bid ID is
///         committed it can never be overwritten, which is what makes the
///         tamper check meaningful: only the document can change after the
///         fact, never the on-chain commitment.
contract BidVerification {
    struct Commitment {
        bytes32 commitHash;
        address submitter;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Commitment) private commitments;

    event BidCommitted(string indexed bidId, bytes32 commitHash, address indexed submitter, uint256 timestamp);

    /// @notice Commit the hash of (bidAmount + salt) for a bid. Can only happen once per bidId.
    function commitBid(string calldata bidId, bytes32 commitHash) external {
        require(!commitments[bidId].exists, "Bid already committed on-chain");
        commitments[bidId] = Commitment({
            commitHash: commitHash,
            submitter: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        emit BidCommitted(bidId, commitHash, msg.sender, block.timestamp);
    }

    /// @notice Read back the immutable commitment for a bid.
    function getCommitment(string calldata bidId)
        external
        view
        returns (bytes32 commitHash, address submitter, uint256 timestamp, bool exists)
    {
        Commitment memory c = commitments[bidId];
        return (c.commitHash, c.submitter, c.timestamp, c.exists);
    }
}
