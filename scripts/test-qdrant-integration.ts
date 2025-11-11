/**
 * Test script for Qdrant integration
 * Tests: Collections, Embeddings, Semantic Search
 */

// Load environment variables first
import './load-env';

import { initializeCollections, checkQdrantHealth, getCollectionInfo } from '../src/lib/qdrant';
import { generateEmbedding } from '../src/lib/embeddings';
import {
  upsertEmployee,
  searchEmployees,
  storeConversation,
  retrieveConversationContext,
  getCollectionStats,
  EmployeePayload,
} from '../src/services/vector-search';

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

async function testQdrantConnection() {
  section('Testing Qdrant Connection');

  const isHealthy = await checkQdrantHealth();

  if (isHealthy) {
    log('Qdrant is connected and healthy', 'green');
    return true;
  } else {
    log('Qdrant connection failed', 'red');
    return false;
  }
}

async function testCollectionInitialization() {
  section('Testing Collection Initialization');

  try {
    await initializeCollections();
    log('Collections initialized successfully', 'green');

    // Get stats for each collection
    const collections = [
      'employees_knowledge',
      'conversations_memory',
      'payroll_documents',
      'transaction_patterns',
    ];

    for (const collectionName of collections) {
      const stats = await getCollectionStats(collectionName);
      log(`${collectionName}: ${stats.pointsCount} points`, 'blue');
    }

    return true;
  } catch (error) {
    log(`Collection initialization failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testEmbeddingGeneration() {
  section('Testing Embedding Generation');

  try {
    const testText = 'blockchain developer with Web3 experience';
    log(`Generating embedding for: "${testText}"`, 'yellow');

    const embedding = await generateEmbedding(testText);

    log(`Embedding generated: ${embedding.length} dimensions`, 'green');
    log(`First 5 values: [${embedding.slice(0, 5).join(', ')}...]`, 'blue');

    if (embedding.length === 768) {
      log('Correct dimension (768)', 'green');
      return true;
    } else {
      log(`Wrong dimension: expected 768, got ${embedding.length}`, 'red');
      return false;
    }
  } catch (error) {
    log(`Embedding generation failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testEmployeeUpsert() {
  section('Testing Employee Upsert');

  try {
    const testEmployees: EmployeePayload[] = [
      {
        employeeId: 'a1b2c3d4-1111-1111-1111-111111111111',
        name: 'Alice Johnson',
        email: 'alice@paystream.ai',
        role: 'Blockchain Developer',
        skills: ['Solidity', 'Web3', 'Ethereum', 'Smart Contracts'],
        department: 'Engineering',
        text: 'Alice Johnson blockchain developer with expertise in Solidity, Web3, Ethereum, and Smart Contracts',
      },
      {
        employeeId: 'a1b2c3d4-2222-2222-2222-222222222222',
        name: 'Bob Smith',
        email: 'bob@paystream.ai',
        role: 'Frontend Engineer',
        skills: ['React', 'TypeScript', 'Next.js', 'UI/UX'],
        department: 'Engineering',
        text: 'Bob Smith frontend engineer skilled in React, TypeScript, Next.js, and UI/UX design',
      },
      {
        employeeId: 'a1b2c3d4-3333-3333-3333-333333333333',
        name: 'Carol Davis',
        email: 'carol@paystream.ai',
        role: 'Crypto Analyst',
        skills: ['DeFi', 'Crypto Trading', 'Market Analysis', 'Web3'],
        department: 'Finance',
        text: 'Carol Davis crypto analyst specializing in DeFi, crypto trading, market analysis, and Web3',
      },
    ];

    for (const employee of testEmployees) {
      await upsertEmployee(employee);
      log(`Upserted: ${employee.name}`, 'green');
    }

    return true;
  } catch (error) {
    log(`Employee upsert failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testSemanticSearch() {
  section('Testing Semantic Employee Search');

  try {
    const queries = [
      'blockchain expert',
      'Web3 developer',
      'frontend specialist',
      'crypto analyst',
      'smart contract engineer',
    ];

    for (const query of queries) {
      log(`\nSearching: "${query}"`, 'yellow');

      const results = await searchEmployees(query, { limit: 3, scoreThreshold: 0.5 });

      if (results.length > 0) {
        results.forEach((result, index) => {
          log(
            `  ${index + 1}. ${result.payload.name} (${result.payload.role}) - Score: ${result.score.toFixed(3)}`,
            'blue'
          );
        });
      } else {
        log('  No results found', 'yellow');
      }
    }

    return true;
  } catch (error) {
    log(`Semantic search failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testConversationMemory() {
  section('Testing Conversation Memory');

  try {
    const userId = 'test-user-1';

    // Store conversations
    const conversations = [
      {
        message: 'When was I last paid?',
        response: 'You were last paid on January 15, 2024 for $5,000',
      },
      {
        message: 'What is my wallet address?',
        response: 'Your wallet address is 0x1234...5678',
      },
      {
        message: 'How much do I earn?',
        response: 'Your annual salary is $60,000',
      },
    ];

    for (const conv of conversations) {
      await storeConversation(userId, conv.message, conv.response);
      log(`Stored: "${conv.message}"`, 'green');
    }

    // Retrieve context
    log('\nRetrieving conversation context...', 'yellow');
    const query = 'payment history';
    const context = await retrieveConversationContext(userId, query, { limit: 2 });

    if (context.length > 0) {
      log(`Found ${context.length} relevant conversations:`, 'green');
      context.forEach((item, index) => {
        log(`  ${index + 1}. "${item.payload.message}" - Score: ${item.score.toFixed(3)}`, 'blue');
      });
    }

    return true;
  } catch (error) {
    log(`Conversation memory test failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function main() {
  log('\nQdrant Integration Test Suite\n', 'cyan');

  const results = {
    connection: await testQdrantConnection(),
    collections: await testCollectionInitialization(),
    embeddings: await testEmbeddingGeneration(),
    upsert: await testEmployeeUpsert(),
    search: await testSemanticSearch(),
    memory: await testConversationMemory(),
  };

  section('Test Summary');

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter((r) => r).length;
  const failed = total - passed;

  log(`Total: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  console.log('\n' + '='.repeat(60));

  if (failed === 0) {
    log('\nAll tests passed! Qdrant integration is working.\n', 'green');
  } else {
    log('\nSome tests failed. Check the errors above.\n', 'yellow');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
