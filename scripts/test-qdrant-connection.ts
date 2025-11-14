import { QdrantClient } from '@qdrant/js-client-rest';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testQdrantConnection() {
  console.log('🔍 Testing Qdrant Connection...\n');

  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.error('❌ QDRANT_URL or QDRANT_API_KEY not found in environment');
    process.exit(1);
  }

  console.log(`📡 URL: ${url}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...\n`);

  try {
    const client = new QdrantClient({
      url,
      apiKey,
    });

    // Test 1: Get collections
    console.log('Test 1: Listing collections...');
    const result = await client.getCollections();
    console.log('✅ Success! Collections:', result.collections.map(c => c.name).join(', ') || '(none)');
    console.log(`   Total: ${result.collections.length} collection(s)\n`);

    // Test 2: Check if our collections exist
    const expectedCollections = ['employees_vector', 'conversations_memory'];
    console.log('Test 2: Checking for PayStream collections...');

    for (const collectionName of expectedCollections) {
      try {
        const collectionInfo = await client.getCollection(collectionName);
        console.log(`✅ Collection "${collectionName}" exists`);
        console.log(`   Vectors: ${collectionInfo.points_count}`);
        console.log(`   Vector size: ${collectionInfo.config.params.vectors?.size || 'N/A'}`);
      } catch (err) {
        console.log(`⚠️  Collection "${collectionName}" not found - needs to be created`);
      }
    }

    console.log('\n✅ Qdrant connection successful!');
    console.log('🎉 You can now use semantic search and conversation memory!\n');

  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check if the URL is correct');
    console.error('2. Verify the API key is valid');
    console.error('3. Ensure your Qdrant instance is running');
    process.exit(1);
  }
}

testQdrantConnection();
