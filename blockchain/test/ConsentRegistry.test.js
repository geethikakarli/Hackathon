const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConsentRegistry", function () {
    let consentRegistry;
    let owner, student, org;

    beforeEach(async function () {
        [owner, student, org] = await ethers.getSigners();
        const ConsentRegistry = await ethers.getContractFactory("ConsentRegistry");
        consentRegistry = await ConsentRegistry.deploy();
        await consentRegistry.deployed();
    });

    it("Should allow org to request access", async function () {
        await consentRegistry.connect(org).requestAccess(student.address, "cid123", "Transcript", 3600);
        const requests = await consentRegistry.getStudentRequests(student.address);
        expect(requests.length).to.equal(1);
        expect(requests[0].requester).to.equal(org.address);
        expect(requests[0].isGranted).to.equal(false);
    });

    it("Should allow student to grant consent", async function () {
        await consentRegistry.connect(org).requestAccess(student.address, "cid123", "Transcript", 3600);
        const reqId = 1; // First request

        await consentRegistry.connect(student).grantConsent(reqId);
        const isValid = await consentRegistry.isAccessValid(reqId);
        expect(isValid).to.equal(true);
    });

    it("Should allow student to revoke consent", async function () {
        await consentRegistry.connect(org).requestAccess(student.address, "cid123", "Transcript", 3600);
        const reqId = 1;

        await consentRegistry.connect(student).grantConsent(reqId);
        await consentRegistry.connect(student).revokeConsent(reqId);

        const isValid = await consentRegistry.isAccessValid(reqId);
        expect(isValid).to.equal(false);
    });
});
