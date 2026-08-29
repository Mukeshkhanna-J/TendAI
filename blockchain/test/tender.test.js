import { assert } from "chai";
import hre from "hardhat";

describe("TenderContract", function () {
    let contract, tender;
    beforeEach(async function () {
        const connection = await hre.network.create();
        const { ethers } = connection;
        contract = await ethers.getContractFactory("TenderContract");
        tender = await contract.deploy();
        await tender.waitForDeployment();
    });
    it("should store the submitted bid", async function () {
        await tender.submitBid(1, 500000, "ABC");

        const minBid = await tender.getMinBid(1);

        assert.equal(minBid[0], 500000n);
        assert.equal(minBid[1], "ABC");
    });

    it("should update minimum bid when a lower bid is submitted", async function () {
        await tender.submitBid(1, 500000, "ABC");
        await tender.submitBid(1, 400000, "XYZ");

        const minBid = await tender.getMinBid(1);

        assert.equal(minBid[0], 400000n);
        assert.equal(minBid[1], "XYZ");
    });

    it("should not update minimum bid when a higher bid is submitted", async function () {
        await tender.submitBid(1, 500000, "ABC");
        await tender.submitBid(1, 600000, "XYZ");

        const minBid = await tender.getMinBid(1);

        assert.equal(minBid[0], 500000n);
        assert.equal(minBid[1], "ABC");
    });

    it("should keep different tenders isolated", async function () {
        await tender.submitBid(1, 50000, "ABC");
        await tender.submitBid(2, 30000, "GHI");
        await tender.submitBid(1, 40000, "DEF");

        const minbid = await tender.getMinBid(1);
        const minbid2 = await tender.getMinBid(2);

        assert.equal(minbid[0], 40000n);
        assert.equal(minbid[1], "DEF");
        assert.equal(minbid2[0], 30000n);
        assert.equal(minbid2[1], "GHI");
    });
});
