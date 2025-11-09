/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CIRCLE_API_KEY: process.env.CIRCLE_API_KEY,
    CIRCLE_ENTITY_ID: process.env.CIRCLE_ENTITY_ID,
    WALLET_SET_ID: process.env.WALLET_SET_ID,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AIMLAPI_KEY: process.env.AIMLAPI_KEY,
    AIMLAPI_BASE_URL: process.env.AIMLAPI_BASE_URL,
    ARC_RPC_URL: process.env.ARC_RPC_URL,
    ARC_CHAIN_ID: process.env.ARC_CHAIN_ID,
    USDC_CONTRACT_ADDRESS: process.env.USDC_CONTRACT_ADDRESS,
    ETHER_PRIVATE_KEY: process.env.ETHER_PRIVATE_KEY,
  },
};

module.exports = nextConfig;
