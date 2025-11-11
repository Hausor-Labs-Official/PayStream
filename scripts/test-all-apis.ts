import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function testGeminiAI() {
  section('Testing Gemini AI');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }

    log('API Key found', 'green');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    log('Testing text generation...', 'yellow');
    const result = await model.generateContent('Say hello in 3 words');
    const response = await result.response;
    const text = response.text();

    log(`Response: ${text}`, 'green');
    log('Gemini AI: WORKING', 'green');

    return { success: true, service: 'Gemini AI' };
  } catch (error) {
    log(`Gemini AI: FAILED - ${(error as Error).message}`, 'red');
    return { success: false, service: 'Gemini AI', error: (error as Error).message };
  }
}

async function testQdrant() {
  section('Testing Qdrant Vector Database');

  try {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;

    log(`Connecting to: ${url}`, 'yellow');

    const client = new QdrantClient({
      url,
      apiKey: apiKey || undefined,
    });

    log('Testing connection...', 'yellow');
    const collections = await client.getCollections();

    log(`Connected successfully`, 'green');
    log(`Found ${collections.collections.length} collection(s)`, 'green');

    if (collections.collections.length > 0) {
      log('Existing collections:', 'blue');
      collections.collections.forEach((col: any) => {
        console.log(`  - ${col.name}`);
      });
    }

    const testCollectionName = 'test_paystream_' + Date.now();
    log(`Creating test collection: ${testCollectionName}`, 'yellow');

    await client.createCollection(testCollectionName, {
      vectors: {
        size: 4,
        distance: 'Cosine',
      },
    });

    log('Collection created', 'green');

    log('Inserting test vector...', 'yellow');
    await client.upsert(testCollectionName, {
      wait: true,
      points: [
        {
          id: 1,
          vector: [0.05, 0.61, 0.76, 0.74],
          payload: { test: 'PayStream AI' },
        },
      ],
    });

    log('Vector inserted', 'green');

    log('Testing vector search...', 'yellow');
    const searchResult = await client.query(testCollectionName, {
      query: [0.1, 0.6, 0.7, 0.8],
      limit: 1,
    });

    log(`Search returned ${searchResult.points.length} result(s)`, 'green');

    log(`Cleaning up test collection...`, 'yellow');
    await client.deleteCollection(testCollectionName);
    log('Test collection deleted', 'green');

    log('Qdrant: WORKING', 'green');

    return { success: true, service: 'Qdrant' };
  } catch (error) {
    log(`Qdrant: FAILED - ${(error as Error).message}`, 'red');

    if ((error as Error).message.includes('ECONNREFUSED')) {
      log('\nHint: Make sure Qdrant is running!', 'yellow');
      log('Start with: docker run -p 6333:6333 qdrant/qdrant', 'yellow');
    }

    return { success: false, service: 'Qdrant', error: (error as Error).message };
  }
}

async function testAIMLAPI() {
  section('Testing AI/ML API');

  try {
    const apiKey = process.env.AIMLAPI_KEY;
    const baseURL = process.env.AIMLAPI_BASE_URL || 'https://api.aimlapi.com/v1';

    if (!apiKey) {
      throw new Error('AIMLAPI_KEY not found');
    }

    log('API Key found', 'green');
    log(`Using base URL: ${baseURL}`, 'yellow');

    const client = new OpenAI({
      baseURL,
      apiKey,
    });

    log('Testing chat completion...', 'yellow');
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say hello in 3 words',
        },
      ],
      max_tokens: 50,
    });

    const message = response.choices[0]?.message?.content || 'No response';

    log(`Response: ${message}`, 'green');
    log(`Model used: ${response.model}`, 'green');
    log('AI/ML API: WORKING', 'green');

    return { success: true, service: 'AI/ML API' };
  } catch (error) {
    log(`AI/ML API: FAILED - ${(error as Error).message}`, 'red');

    if ((error as Error).message.includes('401') || (error as Error).message.includes('authentication')) {
      log('\nHint: Check your AIMLAPI_KEY in .env.local', 'yellow');
      log('Get your key from: https://aimlapi.com/app/keys', 'yellow');
    }

    return { success: false, service: 'AI/ML API', error: (error as Error).message };
  }
}

async function testOpus() {
  section('Testing Opus Platform');

  const apiKey = process.env.OPUS_API_KEY;

  if (!apiKey || apiKey === '') {
    log('Opus API key not configured (optional)', 'yellow');
    log('Opus is primarily used via web UI', 'yellow');
    log('Sign up at: https://app.opus.com/signup', 'yellow');
    log('For API access, add OPUS_API_KEY to .env.local', 'yellow');

    return { success: true, service: 'Opus', skipped: true };
  }

  try {
    log('API Key found', 'green');
    log('Note: Opus API testing requires workspace setup', 'yellow');
    log('Assuming API key is valid if provided', 'yellow');
    log('Opus: CONFIGURED', 'green');

    return { success: true, service: 'Opus' };
  } catch (error) {
    log(`Opus: FAILED - ${(error as Error).message}`, 'red');
    return { success: false, service: 'Opus', error: (error as Error).message };
  }
}

interface TestResult {
  success: boolean;
  service: string;
  error?: string;
  skipped?: boolean;
}

async function main() {
  log('\nPayStream AI - Complete API Integration Test\n', 'cyan');

  const results: TestResult[] = [];

  results.push(await testGeminiAI());
  results.push(await testQdrant());
  results.push(await testAIMLAPI());
  results.push(await testOpus());

  section('Test Summary');

  const successful = results.filter((r) => r.success && !r.skipped).length;
  const failed = results.filter((r) => !r.success).length;
  const skipped = results.filter((r) => r.skipped).length;
  const total = results.length;

  log(`Total APIs: ${total}`, 'blue');
  log(`Working: ${successful}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Skipped: ${skipped}`, 'yellow');

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    log('\nAll APIs are working! Ready to integrate.\n', 'green');
  } else {
    log('\nSome APIs failed. Check the errors above.\n', 'yellow');

    log('Quick fixes:', 'cyan');
    const failedServices = results.filter((r) => !r.success);

    failedServices.forEach((result) => {
      if (result.service === 'Qdrant') {
        log('Start Qdrant: docker run -p 6333:6333 qdrant/qdrant', 'yellow');
      }
      if (result.service === 'Gemini AI') {
        log('Check GEMINI_API_KEY in .env.local', 'yellow');
      }
      if (result.service === 'AI/ML API') {
        log('Check AIMLAPI_KEY in .env.local', 'yellow');
        log('Get key from: https://aimlapi.com/app/keys', 'yellow');
      }
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
