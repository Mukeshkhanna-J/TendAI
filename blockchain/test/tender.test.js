import { assert } from "chai";
import hre from "hardhat";

describe("TenderContract", function () {
    let contract, bidVerification, ethers, bidder1, bidder2;
    const tenderId = "TENDER-2026-001";
    const dummyHash1 =
        "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2";
    const dummyHash2 =
        "0xf0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9";

    beforeEach(async function () {
        const connection = await hre.network.create();
        const { ethers } = connection;

        const signers = await ethers.getSigners();
        bidder1 = signers[1];
        bidder2 = signers[2];

        contract = await ethers.getContractFactory("TenderContract");
        bidVerification = await contract.deploy();
        await bidVerification.waitForDeployment();
    });

    it("should allow a bidder to submit a bid commitment", async function () {
        await bidVerification.connect(bidder1).submitBid(tenderId, dummyHash1);

        const result = await bidVerification.getBidderCommitment(
            tenderId,
            bidder1.address,
        );

        assert.equal(result[0], dummyHash1);
        assert.equal(result[1], bidder1.address);
        assert.equal(result[3], true);
    });

    it("should block the same bidder from submitting twice on the same tender", async function () {
        await bidVerification.connect(bidder1).submitBid(tenderId, dummyHash1);

        try {
            await bidVerification
                .connect(bidder1)
                .submitBid(tenderId, dummyHash2);
            assert.fail("Transaction should have reverted");
        } catch (error) {
            assert.include(
                error.message,
                "Bidder has already submitted a bid for this tender",
            );
        }
    });

    it("should track multiple distinct bidders for the same tender", async function () {
        await bidVerification.connect(bidder1).submitBid(tenderId, dummyHash1);
        await bidVerification.connect(bidder2).submitBid(tenderId, dummyHash2);

        const bidders = await bidVerification.getTenderBidders(tenderId);

        assert.equal(bidders.length, 2);
        assert.equal(bidders[0], bidder1.address);
        assert.equal(bidders[1], bidder2.address);
    });

    it("should keep different tenders isolated", async function () {
        const tender1 = "TENDER-01";
        const tender2 = "TENDER-02";

        await bidVerification.connect(bidder1).submitBid(tender1, dummyHash1);
        await bidVerification.connect(bidder1).submitBid(tender2, dummyHash2);

        const bid1 = await bidVerification.getBidderCommitment(
            tender1,
            bidder1.address,
        );
        const bid2 = await bidVerification.getBidderCommitment(
            tender2,
            bidder1.address,
        );

        assert.equal(bid1[0], dummyHash1);
        assert.equal(bid2[0], dummyHash2);
    });
});
