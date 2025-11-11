/**
 * Test script for Opus Workflow Automation
 * Tests: Payroll approval, Employee onboarding, Compliance audit
 */

// Load environment variables
import './load-env';

import {
  getOpusClient,
  executePayrollWorkflow,
  executeOnboardingWorkflow,
} from '../src/lib/opus-client';
import type { PayrollApprovalInput, EmployeeOnboardingInput } from '../src/types/opus-workflow';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70) + '\n');
}

async function testPayrollApprovalAutoApprove() {
  section('1. Testing Payroll Approval - Auto Approve');

  try {
    const input: PayrollApprovalInput = {
      employees: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          amount: 3000,
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          status: 'active',
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          amount: 2500,
          walletAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
          status: 'active',
        },
      ],
      totalAmount: 5500,
      payPeriod: {
        start: '2025-01-01',
        end: '2025-01-15',
      },
      approvalThreshold: 10000,
    };

    log('Executing payroll workflow (under threshold)...', 'yellow');
    const execution = await executePayrollWorkflow(input);

    log(`✓ Workflow completed: ${execution.id}`, 'green');
    log(`  Status: ${execution.status}`, execution.status === 'completed' ? 'green' : 'yellow');
    log(`  Decision: ${execution.decision?.decision}`, execution.decision?.decision === 'auto_approve' ? 'green' : 'yellow');
    log(`  Reason: ${execution.decision?.reason}`, 'cyan');
    log(`  Duration: ${execution.duration?.toFixed(2)}s`, 'cyan');
    log(`  Steps completed: ${execution.steps.filter(s => s.status === 'completed').length}/${execution.steps.length}`, 'cyan');

    return execution.decision?.decision === 'auto_approve';
  } catch (error) {
    log(`✗ Test failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testPayrollApprovalFlagForReview() {
  section('2. Testing Payroll Approval - Flag for Review');

  try {
    const input: PayrollApprovalInput = {
      employees: [
        {
          id: '3',
          name: 'Bob Wilson',
          email: 'bob@example.com',
          amount: 8000,
          walletAddress: '0x5409ED021D9299bf6814279A6A1411A7e866A631',
          status: 'active',
        },
        {
          id: '4',
          name: 'Alice Brown',
          email: 'alice@example.com',
          amount: 7000,
          walletAddress: '0x9876543210ABCDEF9876543210ABCDEF98765432',
          status: 'active',
        },
      ],
      totalAmount: 15000,
      payPeriod: {
        start: '2025-01-01',
        end: '2025-01-15',
      },
      approvalThreshold: 10000,
    };

    log('Executing payroll workflow (exceeds threshold)...', 'yellow');
    const execution = await executePayrollWorkflow(input);

    log(`✓ Workflow completed: ${execution.id}`, 'green');
    log(`  Status: ${execution.status}`, 'yellow');
    log(`  Decision: ${execution.decision?.decision}`, execution.decision?.decision === 'flag_for_review' ? 'yellow' : 'red');
    log(`  Reason: ${execution.decision?.reason}`, 'cyan');
    log(`  Flags: ${execution.decision?.flags.join(', ') || 'none'}`, 'yellow');
    log(`  Review Required: ${execution.reviewRequest ? 'Yes' : 'No'}`, 'yellow');

    return execution.decision?.decision === 'flag_for_review';
  } catch (error) {
    log(`✗ Test failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testPayrollApprovalReject() {
  section('3. Testing Payroll Approval - Reject');

  try {
    const input: PayrollApprovalInput = {
      employees: [
        {
          id: '5',
          name: 'Charlie Davis',
          email: 'charlie@example.com',
          amount: 3000,
          walletAddress: 'invalid-wallet',
          status: 'active',
        },
      ],
      totalAmount: 3000,
      payPeriod: {
        start: '2025-01-01',
        end: '2025-01-15',
      },
    };

    log('Executing payroll workflow (invalid wallet)...', 'yellow');
    const execution = await executePayrollWorkflow(input);

    log(`✓ Workflow completed: ${execution.id}`, 'green');
    log(`  Status: ${execution.status}`, execution.status === 'rejected' ? 'green' : 'red');
    log(`  Decision: ${execution.decision?.decision}`, execution.decision?.decision === 'reject' ? 'green' : 'red');
    log(`  Reason: ${execution.decision?.reason}`, 'cyan');

    return execution.decision?.decision === 'reject';
  } catch (error) {
    log(`✗ Test failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testEmployeeOnboarding() {
  section('4. Testing Employee Onboarding Workflow');

  try {
    const input: EmployeeOnboardingInput = {
      employeeData: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        department: 'Engineering',
        role: 'Software Engineer',
        salaryAnnual: 85000,
      },
      createWallet: true,
    };

    log('Executing onboarding workflow...', 'yellow');
    const execution = await executeOnboardingWorkflow(input);

    log(`✓ Workflow completed: ${execution.id}`, 'green');
    log(`  Status: ${execution.status}`, 'green');
    log(`  Decision: ${execution.decision?.decision}`, 'cyan');
    log(`  Employee Created: ${execution.outputs?.employeeCreated}`, 'green');
    log(`  Wallet Address: ${execution.outputs?.walletAddress}`, 'cyan');
    log(`  Duration: ${execution.duration?.toFixed(2)}s`, 'cyan');

    return execution.status === 'completed';
  } catch (error) {
    log(`✗ Test failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testWorkflowProvenance() {
  section('5. Testing Workflow Provenance/Audit Trail');

  try {
    const input: PayrollApprovalInput = {
      employees: [
        {
          id: '6',
          name: 'Test User',
          email: 'test@example.com',
          amount: 1000,
          walletAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678',
          status: 'active',
        },
      ],
      totalAmount: 1000,
      payPeriod: {
        start: '2025-01-01',
        end: '2025-01-15',
      },
    };

    const execution = await executePayrollWorkflow(input);

    log('✓ Provenance data generated', 'green');
    log(`  Execution ID: ${execution.provenance.executionId}`, 'cyan');
    log(`  Data Sources: ${execution.provenance.dataSource.join(', ')}`, 'cyan');
    log(`  AI Models: ${execution.provenance.aiModels.join(', ')}`, 'cyan');
    log(`  Compliance Checks: ${execution.provenance.complianceChecks.length}`, 'cyan');
    log(`  Artifacts: ${execution.provenance.artifacts.length}`, 'cyan');

    return execution.provenance.complianceChecks.length > 0;
  } catch (error) {
    log(`✗ Test failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function testDecisionLogic() {
  section('6. Testing Decision Logic Rules');

  try {
    const testCases = [
      {
        name: 'Under threshold',
        amount: 5000,
        expected: 'auto_approve',
      },
      {
        name: 'Over threshold',
        amount: 15000,
        expected: 'flag_for_review',
      },
      {
        name: 'Way over threshold',
        amount: 50000,
        expected: 'flag_for_review',
      },
    ];

    let passed = 0;

    for (const testCase of testCases) {
      const input: PayrollApprovalInput = {
        employees: [
          {
            id: 'test',
            name: 'Test',
            email: 'test@example.com',
            amount: testCase.amount,
            walletAddress: '0x1234567890ABCDEF1234567890ABCDEF12345678',
            status: 'active',
          },
        ],
        totalAmount: testCase.amount,
        payPeriod: {
          start: '2025-01-01',
          end: '2025-01-15',
        },
        approvalThreshold: 10000,
      };

      const execution = await executePayrollWorkflow(input);
      const match = execution.decision?.decision === testCase.expected;

      log(`  ${match ? '✓' : '✗'} ${testCase.name}: $${testCase.amount} → ${execution.decision?.decision}`, match ? 'green' : 'red');

      if (match) passed++;
    }

    log(`\n✓ Decision logic tests: ${passed}/${testCases.length} passed`, passed === testCases.length ? 'green' : 'yellow');
    return passed === testCases.length;
  } catch (error) {
    log(`✗ Test failed: ${(error as Error).message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n⚙️ Opus Workflow Automation Test Suite\n', 'magenta');
  log('Testing: Payroll Approval + Employee Onboarding + Decision Logic\n', 'cyan');

  const results = {
    payrollAutoApprove: await testPayrollApprovalAutoApprove(),
    payrollFlagReview: await testPayrollApprovalFlagForReview(),
    payrollReject: await testPayrollApprovalReject(),
    employeeOnboarding: await testEmployeeOnboarding(),
    provenance: await testWorkflowProvenance(),
    decisionLogic: await testDecisionLogic(),
  };

  section('Test Summary');

  const tests = [
    { name: 'Payroll Auto-Approve', passed: results.payrollAutoApprove },
    { name: 'Payroll Flag for Review', passed: results.payrollFlagReview },
    { name: 'Payroll Reject', passed: results.payrollReject },
    { name: 'Employee Onboarding', passed: results.employeeOnboarding },
    { name: 'Provenance/Audit Trail', passed: results.provenance },
    { name: 'Decision Logic Rules', passed: results.decisionLogic },
  ];

  tests.forEach((test) => {
    const icon = test.passed ? '✓' : '✗';
    const color = test.passed ? 'green' : 'red';
    log(`${icon} ${test.name}`, color);
  });

  const total = tests.length;
  const passed = tests.filter((t) => t.passed).length;
  const failed = total - passed;

  console.log('\n' + '='.repeat(70));
  log(`\nTotal: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed === 0) {
    log('\n🎉 All tests passed! Opus workflows are working perfectly.\n', 'green');
    log('Workflow Features:', 'cyan');
    log('  ✓ Multi-level approval logic', 'green');
    log('  ✓ Auto-approve under threshold', 'green');
    log('  ✓ Flag for review when needed', 'green');
    log('  ✓ Reject invalid requests', 'green');
    log('  ✓ Complete audit trails', 'green');
    log('  ✓ Decision provenance tracking', 'green');
  } else {
    log('\n⚠ Some tests failed. Check the errors above.\n', 'yellow');
  }

  console.log('\n' + '='.repeat(70) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
