import { assert } from "chai";
import hre from "hardhat";

describe("Tender", function () {
    let contract, tender;
    beforeEach(async function () {
        const connection = await hre.network.create();
        const { ethers } = connection;
        contract = await ethers.getContractFactory("Tender");
        tender = await contract.deploy();
        await tender.waitForDeployment();
    });
    it("should store the submitted bid", async function () {
        await tender.submitBid(500000, "ABC");

        const minBid = await tender.getMinBid();

        assert.equal(minBid[0], 500000n);
        assert.equal(minBid[1], "ABC");
    });

    it("should update minimum bid when a lower bid is submitted", async function () {
        await tender.submitBid(500000, "ABC");
        await tender.submitBid(400000, "XYZ");

        const minBid = await tender.getMinBid();

        assert.equal(minBid[0], 400000n);
        assert.equal(minBid[1], "XYZ");
    });

    it("should not update minimum bid when a higher bid is submitted", async function () {
        await tender.submitBid(500000, "ABC");
        await tender.submitBid(600000, "XYZ");

        const minBid = await tender.getMinBid();

        assert.equal(minBid[0], 500000n);
        assert.equal(minBid[1], "ABC");
    });
});
