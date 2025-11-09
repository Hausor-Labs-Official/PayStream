import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function deploySimple() {
  console.log('🚀 Testing Simple Contract Deployment on Arc Testnet\n');

  const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL);
  const signer = new ethers.Wallet(process.env.ETHER_PRIVATE_KEY!, provider);

  console.log('Deployer:', signer.address);

  // Very simple contract bytecode that just stores a value
  // contract SimpleStorage { uint256 public value = 42; }
  const simpleBytecodeBytecode = '0x6080604052602a60005534801561001557600080fd5b5060b3806100246000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633fa4f24514602d575b600080fd5b60336047565b604051603e9190605b565b60405180910390f35b60005481565b6000819050919050565b6055816048565b82525050565b6000602082019050606e6000830184604e565b9291505056fea2646970667358221220a2d45c0c8e9bed614c67f3f564b64b7a6fc6c71e48f7f04a99f8a6d2c5c1e1e64736f6c63430008140033';

  console.log('Deploying simple contract...');

  try {
    const tx = await signer.sendTransaction({
      data: simpleBytecodeBytecode,
      gasLimit: 500000,
    });

    console.log('TX sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Deployed successfully!');
    console.log('Contract address:', receipt?.contractAddress);
    console.log('Gas used:', receipt?.gasUsed.toString());
  } catch (e) {
    console.error('❌ Deployment failed:', (e as Error).message);
    throw e;
  }
}

deploySimple();
