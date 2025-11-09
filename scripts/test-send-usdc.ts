/**
 * Test script to send 1 USDC to an employee wallet
 * Run with: npx tsx scripts/test-send-usdc.ts <wallet_address>
 */

import { ethers } from 'ethers';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const ARC_RPC_URL = process.env.ARC_RPC_URL!;
const PRIVATE_KEY = process.env.ETHER_PRIVATE_KEY!;
const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS!;

// USDC ABI (minimal - just transfer function)
const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

async function sendTestUSDC(recipientAddress: string, amount: number = 1.0) {
  try {
    console.log('\n💸 Sending Test USDC Payment...\n');

    // Validate recipient address
    let normalizedAddress: string;
    try {
      normalizedAddress = ethers.getAddress(recipientAddress);
    } catch (err) {
      throw new Error(`Invalid wallet address: ${recipientAddress}`);
    }

    console.log(`   Recipient: ${normalizedAddress}`);
    console.log(`   Amount: ${amount} USDC\n`);

    // Connect to Arc Testnet
    const provider = new ethers.JsonRpcProvider(ARC_RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`   Sender: ${signer.address}`);

    // Get USDC contract
    const usdcContract = new ethers.Contract(
      USDC_CONTRACT_ADDRESS,
      USDC_ABI,
      signer
    );

    // Check sender balance
    const balance = await usdcContract.balanceOf(signer.address);
    const decimals = await usdcContract.decimals();
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    console.log(`   Sender Balance: ${balanceFormatted} USDC\n`);

    if (parseFloat(balanceFormatted) < amount) {
      throw new Error(`Insufficient USDC balance. Have ${balanceFormatted}, need ${amount}`);
    }

    // Convert amount to USDC units (6 decimals)
    const amountWei = ethers.parseUnits(amount.toFixed(6), decimals);

    console.log('📤 Sending transaction...');

    // Send USDC
    const tx = await usdcContract.transfer(normalizedAddress, amountWei);
    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log(`   Waiting for confirmation...\n`);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    console.log('✅ Transaction Confirmed!\n');
    console.log(`   Block Number: ${receipt.blockNumber}`);
    console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   Status: ${receipt.status === 1 ? 'Success' : 'Failed'}\n`);

    // Check recipient balance
    const recipientBalance = await usdcContract.balanceOf(normalizedAddress);
    const recipientBalanceFormatted = ethers.formatUnits(recipientBalance, decimals);
    console.log(`   Recipient New Balance: ${recipientBalanceFormatted} USDC\n`);

    console.log('🔗 View on Arc Testnet Explorer:');
    console.log(`   Transaction: https://testnet.arcscan.app/tx/${tx.hash}`);
    console.log(`   Recipient: https://testnet.arcscan.app/address/${normalizedAddress}\n`);

    return {
      txHash: tx.hash,
      explorerUrl: `https://testnet.arcscan.app/tx/${tx.hash}`,
      recipientUrl: `https://testnet.arcscan.app/address/${normalizedAddress}`,
    };
  } catch (error) {
    console.error('❌ Failed to send USDC:', error);
    throw error;
  }
}

// Get recipient address from command line
const recipientAddress = process.argv[2];
const amount = parseFloat(process.argv[3] || '1.0');

if (!recipientAddress) {
  console.error('❌ Usage: npx tsx scripts/test-send-usdc.ts <wallet_address> [amount]');
  console.error('   Example: npx tsx scripts/test-send-usdc.ts 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1 1.0');
  process.exit(1);
}

// Run the test
sendTestUSDC(recipientAddress, amount);
