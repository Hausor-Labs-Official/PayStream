import { CircleDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const circle = new CircleDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_ID!,
});

async function createWalletSet() {
  try {
    const response = await circle.createWalletSet({
      name: "Paystream AI Payroll Set",
    });
    console.log("Wallet Set Created!");
    console.log("ID:", response.data?.walletSet?.id);
    console.log("Copy this ID to .env.local as WALLET_SET_ID");
  } catch (error: any) {
    console.error("Error:", error.response?.data || error.message);
  }
}

createWalletSet();
