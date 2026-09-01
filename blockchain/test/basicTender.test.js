import { assert } from "chai";
import hre from "hardhat";

describe("TenderContractBasic", function () {
    let contract, tender;

    beforeEach(async function () {
        const connection = await hre.network.create();
        const { ethers } = connection;
        contract = await ethers.getContractFactory("TenderContractBasic");
        tender = await contract.deploy();

        await tender.waitForDeployment();
    });

    it("should store a bid", async function () {
        await tender.submitBid("TENDER-101", 500000, "ABC");

        const bids = await tender.getBids("TENDER-101");

        assert.equal(bids.length, 1);

        assert.equal(bids[0].amount, 500000n);
        assert.equal(bids[0].organisation, "ABC");
    });

    it("should store multiple bids for the same tender", async function () {
        await tender.submitBid("TENDER-101", 500000, "ABC");

        await tender.submitBid("TENDER-101", 400000, "XYZ");

        const bids = await tender.getBids("TENDER-101");

        assert.equal(bids.length, 2);

        assert.equal(bids[0].amount, 500000n);
        assert.equal(bids[0].organisation, "ABC");

        assert.equal(bids[1].amount, 400000n);
        assert.equal(bids[1].organisation, "XYZ");
    });

    it("should keep bids of different tenders separate", async function () {
        await tender.submitBid("TENDER-101", 500000, "ABC");

        await tender.submitBid("TENDER-102", 700000, "XYZ");

        const tender101Bids = await tender.getBids("TENDER-101");
        const tender102Bids = await tender.getBids("TENDER-102");

        assert.equal(tender101Bids.length, 1);
        assert.equal(tender102Bids.length, 1);

        assert.equal(tender101Bids[0].amount, 500000n);
        assert.equal(tender101Bids[0].organisation, "ABC");

        assert.equal(tender102Bids[0].amount, 700000n);
        assert.equal(tender102Bids[0].organisation, "XYZ");
    });

    it("should return empty array for a tender with no bids", async function () {
        const bids = await tender.getBids("TENDER-999");

        assert.equal(bids.length, 0);
    });
});
