const { weth, getBigNumber } = require("@sushiswap/hardhat-framework")

module.exports = async function (hre) {
    const signers = await hre.ethers.getSigners()
    const deployer = signers[0]
    const funder = signers[1]
    const chainId = await hre.getChainId()
    if (chainId == "31337" || hre.network.config.forking) {
        return
    }
    if (!weth(chainId)) {
        console.log("No WETH address for chain", chainId)
        return
    }
    console.log(chainId)

    const gasPrice = await funder.provider.getGasPrice()
    let multiplier = hre.network.tags && hre.network.tags.staging ? 2 : 1
    let finalGasPrice = gasPrice.mul(multiplier)
    const gasLimit = 5400000
    if (chainId == "88" || chainId == "89") {
        finalGasPrice = getBigNumber("10000", 9)
    }
    console.log("Gasprice:", gasPrice.toString(), " with multiplier ", multiplier, "final", finalGasPrice.toString())

    console.log("Sending native token to fund deployment:", finalGasPrice.mul(gasLimit + 190000).toString())
    let tx = await funder.sendTransaction({
        to: deployer.address,
        value: finalGasPrice.mul(gasLimit + 190000),
        gasPrice: gasPrice.mul(multiplier),
    })
    await tx.wait()

    console.log("Deploying contract")
    tx = await hre.deployments.deploy("KashiPairMediumRiskV1", {
        from: deployer.address,
        args: [weth(chainId)],
        log: true,
        deterministicDeployment: false,
        gasLimit: gasLimit,
        gasPrice: finalGasPrice,
    })
}
