import { assert } from "chai";
import hre from "hardhat";

describe("FindMinBids", function () {
    let contract;
    let owner;
    let bidder1;
    let bidder2;
    let bidder3;
    let bidder4;
    let bidder5;

    beforeEach(async function () {
        const connection = await hre.network.create();
        const { ethers } = connection;
        const signers = await ethers.getSigners();
        bidder1 = signers[0];
        bidder2 = signers[1];
        bidder3 = signers[2];
        bidder4 = signers[3];
        bidder5 = signers[4];
        const FindMinBids = await ethers.getContractFactory("FindMinBids");
        contract = await FindMinBids.deploy();

        await contract.waitForDeployment();
    });

    it("should store the first bid as L1", async function () {
        await contract.connect(bidder1).addCommitment("TENDER-001", 500000);

        const result = await contract.getMinBids("TENDER-001");

        assert.equal(result.count, 1);
        assert.equal(result.l1.amount, 500000n);
        assert.equal(result.l1.submitter, bidder1.address);
    });

    it("should correctly store two bids", async function () {
        await contract.connect(bidder1).addCommitment("TENDER-001", 500000);

        await contract.connect(bidder2).addCommitment("TENDER-001", 300000);

        const result = await contract.getMinBids("TENDER-001");

        assert.equal(result.count, 2);

        assert.equal(result.l1.amount, 300000n);
        assert.equal(result.l1.submitter, bidder2.address);

        assert.equal(result.l2.amount, 500000n);
        assert.equal(result.l2.submitter, bidder1.address);
    });

    it("should correctly store three bids", async function () {
        await contract.connect(bidder1).addCommitment("TENDER-001", 500000);

        await contract.connect(bidder2).addCommitment("TENDER-001", 300000);

        await contract.connect(bidder3).addCommitment("TENDER-001", 700000);

        const result = await contract.getMinBids("TENDER-001");

        assert.equal(result.count, 3);

        assert.equal(result.l1.amount, 300000n);
        assert.equal(result.l2.amount, 500000n);
        assert.equal(result.l3.amount, 700000n);

        assert.equal(result.l1.submitter, bidder2.address);
        assert.equal(result.l2.submitter, bidder1.address);
        assert.equal(result.l3.submitter, bidder3.address);
    });

    it("should move a new lowest bid to L1", async function () {
        await contract.connect(bidder1).addCommitment("TENDER-001", 500000);

        await contract.connect(bidder2).addCommitment("TENDER-001", 300000);

        await contract.connect(bidder3).addCommitment("TENDER-001", 700000);

        // New lowest bid
        await contract.connect(bidder4).addCommitment("TENDER-001", 200000);

        const result = await contract.getMinBids("TENDER-001");

        assert.equal(result.count, 3);

        assert.equal(result.l1.amount, 200000n);
        assert.equal(result.l2.amount, 300000n);
        assert.equal(result.l3.amount, 500000n);

        assert.equal(result.l1.submitter, bidder4.address);
        assert.equal(result.l2.submitter, bidder2.address);
        assert.equal(result.l3.submitter, bidder1.address);
    });

    it("should correctly insert a bid into L2", async function () {
        await contract.connect(bidder1).addCommitment("TENDER-001", 300000);

        await contract.connect(bidder2).addCommitment("TENDER-001", 500000);

        await contract.connect(bidder3).addCommitment("TENDER-001", 700000);

        // Should become L2
        await contract.connect(bidder4).addCommitment("TENDER-001", 400000);

        const result = await contract.getMinBids("TENDER-001");

        assert.equal(result.l1.amount, 300000n);
        assert.equal(result.l2.amount, 400000n);
        assert.equal(result.l3.amount, 500000n);

        assert.equal(result.l1.submitter, bidder1.address);
        assert.equal(result.l2.submitter, bidder4.address);
        assert.equal(result.l3.submitter, bidder2.address);
    });

    it("should correctly insert a bid into L3", async function () {
        await contract.connect(bidder1).addCommitment("TENDER-001", 300000);

        await contract.connect(bidder2).addCommitment("TENDER-001", 500000);

        await contract.connect(bidder3).addCommitment("TENDER-001", 700000);

        // Should become L3
        await contract.connect(bidder4).addCommitment("TENDER-001", 600000);

        const result = await contract.getMinBids("TENDER-001");

        assert.equal(result.l1.amount, 300000n);
        assert.equal(result.l2.amount, 500000n);
        assert.equal(result.l3.amount, 600000n);

        assert.equal(result.l1.submitter, bidder1.address);
        assert.equal(result.l2.submitter, bidder2.address);
        assert.equal(result.l3.submitter, bidder4.address);
    });

    it("should ignore a bid that is greater than L3", async function () {
        await contract.connect(bidder1).addCommitment("TENDER-001", 300000);

        await contract.connect(bidder2).addCommitment("TENDER-001", 500000);

        await contract.connect(bidder3).addCommitment("TENDER-001", 700000);

        // Worse than L3
        await contract.connect(bidder4).addCommitment("TENDER-001", 900000);

        const result = await contract.getMinBids("TENDER-001");

        assert.equal(result.count, 3);

        assert.equal(result.l1.amount, 300000n);
        assert.equal(result.l2.amount, 500000n);
        assert.equal(result.l3.amount, 700000n);

        assert.equal(result.l3.submitter, bidder3.address);
    });

    it("should keep different tenders separate", async function () {
        await contract.connect(bidder1).addCommitment("TENDER-001", 300000);

        await contract.connect(bidder2).addCommitment("TENDER-001", 500000);

        await contract.connect(bidder3).addCommitment("TENDER-002", 100000);

        await contract.connect(bidder4).addCommitment("TENDER-002", 200000);

        const tender1 = await contract.getMinBids("TENDER-001");
        const tender2 = await contract.getMinBids("TENDER-002");

        // Tender 1
        assert.equal(tender1.count, 2);
        assert.equal(tender1.l1.amount, 300000n);
        assert.equal(tender1.l2.amount, 500000n);

        // Tender 2
        assert.equal(tender2.count, 2);
        assert.equal(tender2.l1.amount, 100000n);
        assert.equal(tender2.l2.amount, 200000n);
    });

    it("should return zero bids for a new tender", async function () {
        const result = await contract.getMinBids("TENDER-999");

        assert.equal(result.count, 0);
    });
});
