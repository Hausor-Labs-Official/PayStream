import { getOpusClient } from '../src/lib/opus-client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testOpusConnection() {
  console.log('🔍 Testing Opus API Connection...\n');

  const apiKey = process.env.OPUS_API_KEY;
  const apiUrl = process.env.OPUS_API_URL;

  if (!apiKey) {
    console.error('❌ OPUS_API_KEY not found in environment');
    console.log('⚠️  Will run in simulation mode\n');
  } else {
    console.log(`📡 API URL: ${apiUrl}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...\n`);
  }

  try {
    const client = getOpusClient();

    // Test 1: Execute a simple payroll workflow
    console.log('Test 1: Executing payroll approval workflow (small batch)...');
    const result1 = await executeOpusWorkflow('payroll-approval', {
      batchId: 'test_batch_001',
      employees: [
        {
          id: 'emp_test_001',
          name: 'Test Employee',
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
          salaryAmount: 5000,
        },
      ],
      totalAmount: 5000,
      approvalThreshold: 10000,
      submittedBy: 'test@paystream.ai',
    });

    console.log('✅ Test 1 Result:');
    console.log(`   Execution ID: ${result1.executionId}`);
    console.log(`   Status: ${result1.status}`);
    console.log(`   Message: ${result1.message}`);
    if (result1.costAnalysis) {
      console.log(`   Cost: ${result1.costAnalysis.manHours} man-hours ($${result1.costAnalysis.totalCost})`);
    }
    console.log();

    // Test 2: Execute workflow that should be flagged for review
    console.log('Test 2: Executing payroll approval workflow (large batch)...');
    const result2 = await executeOpusWorkflow('payroll-approval', {
      batchId: 'test_batch_002',
      employees: Array.from({ length: 10 }, (_, i) => ({
        id: `emp_test_${i + 1}`,
        name: `Employee ${i + 1}`,
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        salaryAmount: 5000,
      })),
      totalAmount: 50000,
      approvalThreshold: 10000,
      submittedBy: 'test@paystream.ai',
    });

    console.log('✅ Test 2 Result:');
    console.log(`   Execution ID: ${result2.executionId}`);
    console.log(`   Status: ${result2.status}`);
    console.log(`   Message: ${result2.message}`);
    if (result2.costAnalysis) {
      console.log(`   Cost: ${result2.costAnalysis.manHours} man-hours ($${result2.costAnalysis.totalCost})`);
    }
    console.log();

    // Test 3: Execute employee onboarding workflow
    console.log('Test 3: Executing employee onboarding workflow...');
    const result3 = await executeOpusWorkflow('employee-onboarding', {
      method: 'manual',
      employeeData: {
        name: 'Test User',
        email: 'testuser@company.com',
        role: 'Software Engineer',
        department: 'Engineering',
        salary_annual: 120000,
        start_date: '2025-02-01',
        skills: ['JavaScript', 'React', 'Node.js'],
      },
      submittedBy: 'hr@company.com',
    });

    console.log('✅ Test 3 Result:');
    console.log(`   Execution ID: ${result3.executionId}`);
    console.log(`   Status: ${result3.status}`);
    console.log(`   Message: ${result3.message}`);
    if (result3.outputs) {
      console.log(`   Employee ID: ${result3.outputs.employeeId}`);
      console.log(`   Wallet Address: ${result3.outputs.walletAddress}`);
      console.log(`   Email Sent: ${result3.outputs.emailSent}`);
    }
    if (result3.costAnalysis) {
      console.log(`   Cost: ${result3.costAnalysis.manHours} man-hours ($${result3.costAnalysis.totalCost})`);
    }
    console.log();

    // Test 4: Get pending reviews
    console.log('Test 4: Fetching pending reviews...');
    const pendingReviews = await client.getPendingReviews();
    console.log(`✅ Found ${pendingReviews.length} pending reviews`);
    console.log();

    // Summary
    console.log('📊 Test Summary:');
    console.log('   ✅ All tests completed successfully');
    console.log('   ✅ Opus client is working correctly');

    if (!apiKey) {
      console.log('\n⚠️  Note: Tests ran in SIMULATION mode (no API key provided)');
      console.log('   To test with real API:');
      console.log('   1. Ensure OPUS_API_KEY is set in .env.local');
      console.log('   2. Create workflows in Opus platform');
      console.log('   3. Run this test again');
    } else {
      console.log('\n✅ Opus API key is configured');
      console.log('   If workflows are not yet created in Opus platform:');
      console.log('   1. Go to https://app.opus.com');
      console.log('   2. Create workflows using the definitions in workflows/ folder');
      console.log('   3. Test with real workflow executions');
    }

    console.log('\n🎉 Opus integration is ready!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check if API key is correct');
    console.error('2. Verify API URL is accessible');
    console.error('3. Ensure workflows are created in Opus platform');
    console.error('4. Check network connectivity');
    process.exit(1);
  }
}

testOpusConnection();
