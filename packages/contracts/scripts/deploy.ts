import hre from 'hardhat';

async function main() {
  console.log('Deploying ReputationBadge contract...');

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying from account: ${deployer.address}`);

  const ReputationBadge = await hre.ethers.getContractFactory('ReputationBadge');
  const badge = await ReputationBadge.deploy(deployer.address);

  await badge.waitForDeployment();

  const contractAddress = await badge.getAddress();
  console.log(`ReputationBadge deployed to: ${contractAddress}`);

  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (chainId: ${network.chainId})`);

  console.log('\nNext steps:');
  console.log('1. Grant MINTER_ROLE to your relayer wallet(s):');
  console.log('   badge.grantMinter(relayerAddress) from the deployer account');
  console.log('2. Mint badges via the backend relayer wallet(s)');
  console.log(`\nContract address to save: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
