const hre = require("hardhat");

async function main() {
    const Fakenft = await hre.ethers.getContractFactory("Fake_NFTMarketplace");
    const fakenft = await Fakenft.deploy();

    await fakenft.deployed();

    console.log("fakenft deployed to:", fakenft.address);

    const DAO = await hre.ethers.getContractFactory("DAO");
    const dao = await DAO.deploy(
        "0x5Bfd87426e30151166283da689DB87a2fB32927F",
        fakenft.address
    );

    await dao.deployed();

    console.log("DAO deployed to:", dao.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
