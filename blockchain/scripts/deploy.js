const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const ConsentRegistry = await hre.ethers.getContractFactory("ConsentRegistry");
    const consentRegistry = await ConsentRegistry.deploy();

    await consentRegistry.waitForDeployment();
    const address = consentRegistry.target;

    console.log("ConsentRegistry deployed to:", address);

    // Save address for frontend
    const configPath = path.join(__dirname, "../../client/src/config.json");
    fs.writeFileSync(configPath, JSON.stringify({
        contractAddress: address
    }, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
