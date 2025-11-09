import { CircleDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const circle = new CircleDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_ID!,
});

async function createWallet() {
  try {
    const response = await circle.createWallets({
      accountType: "SCA",
      blockchains: ["ARC-TESTNET"],  // ← This is Arc Testnet
      count: 1,
      walletSetId: process.env.WALLET_SET_ID!,
    });

    const wallet = response.data?.wallets?.[0];
    if (!wallet) {
      throw new Error("No wallet returned from API");
    }
    console.log("Wallet Created on Arc Testnet!");
    console.log("Address:", wallet.address);
    console.log("ID:", wallet.id);
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

createWallet();
