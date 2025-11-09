import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
  const wallet = new ethers.Wallet(process.env.ETHER_PRIVATE_KEY!, provider);

  console.log('Deployer Address:', wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log('Native Balance:', ethers.formatEther(balance), 'tokens');

  const usdcContract = new ethers.Contract(
    process.env.USDC_CONTRACT_ADDRESS!,
    [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ],
    provider
  );

  try {
    const usdcBal = await usdcContract.balanceOf(wallet.address);
    const decimals = await usdcContract.decimals();
    console.log('USDC Balance:', ethers.formatUnits(usdcBal, decimals), 'USDC');
  } catch (e) {
    console.log('USDC check error:', (e as Error).message);
  }
}

checkBalance();
