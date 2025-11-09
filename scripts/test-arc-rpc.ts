import { getProvider, getNetworkInfo } from '../src/lib/arc';

async function testArcRPC() {
  console.log('Testing Arc Testnet RPC...\n');

  try {
    // Test 1: Basic connectivity
    console.log('1. Testing provider connection...');
    const provider = getProvider();
    console.log('✓ Provider initialized');

    // Test 2: Get network info
    console.log('\n2. Getting network info...');
    const networkInfo = await getNetworkInfo();
    console.log('✓ Network info retrieved:');
    console.log(`   Chain ID: ${networkInfo.chainId}`);
    console.log(`   Block Number: ${networkInfo.blockNumber}`);
    console.log(`   Gas Price: ${networkInfo.gasPrice} gwei`);

    // Test 3: Check if it's Arc Testnet
    console.log('\n3. Verifying Arc Testnet...');
    if (networkInfo.chainId === 1628) {
      console.log('✓ Connected to Arc Testnet (Chain ID: 1628)');
    } else {
      console.log(`✗ Wrong network! Expected 1628, got ${networkInfo.chainId}`);
    }

    console.log('\n✅ All Arc RPC tests passed!');
  } catch (error) {
    console.error('\n❌ Arc RPC test failed:');
    console.error(error);
    process.exit(1);
  }
}

testArcRPC();
