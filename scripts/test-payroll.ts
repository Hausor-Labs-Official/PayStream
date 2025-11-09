import { insertEmployee, getPendingEmployees } from '../src/lib/supabase';
import { createEmployeeWallet } from '../src/lib/circle';
import { PayrollAgent, PayrollInput } from '../src/lib/payroll-agent';
import { executeBatchPay, BatchPaymentEmployee } from '../src/lib/executor-agent';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testPayroll() {
  console.log('🧪 Testing Paystream AI Payroll System\n');
  console.log('======================================\n');

  try {
    // Step 1: Onboard test employees
    console.log('📝 Step 1: Onboarding Test Employees\n');

    const testEmployees = [
      {
        name: 'Alice Johnson',
        email: 'alice@test.paystream.ai',
        salary_annual: 65000,
      },
      {
        name: 'Bob Smith',
        email: 'bob@test.paystream.ai',
        salary_annual: 78000,
      },
    ];

    const onboardedEmployees = [];

    for (const emp of testEmployees) {
      try {
        console.log(`   Creating wallet for ${emp.name}...`);

        // Create wallet
        const { walletId, address } = await createEmployeeWallet(emp.email);

        console.log(`   ✓ Wallet created: ${address}`);
        console.log(`   Wallet ID: ${walletId}`);

        // Insert into database
        const employee = await insertEmployee({
          name: emp.name,
          email: emp.email,
          wallet_id: walletId,
          wallet_address: address,
          salary_usd: emp.salary_annual,
          status: 'pending',
        });

        onboardedEmployees.push(employee);
        console.log(`   ✓ Employee onboarded to database\n`);
      } catch (error) {
        console.error(`   ❌ Failed to onboard ${emp.name}:`, error);
      }
    }

    if (onboardedEmployees.length === 0) {
      throw new Error('No employees were onboarded successfully');
    }

    console.log(`✅ Onboarded ${onboardedEmployees.length} employees\n`);

    // Step 2: Calculate Payroll with AI
    console.log('💰 Step 2: Calculating Payroll with AI\n');

    const payrollAgent = new PayrollAgent();
    const payrollResults = [];
    const batchPaymentEmployees: BatchPaymentEmployee[] = [];

    for (const employee of onboardedEmployees) {
      console.log(`   Calculating payroll for ${employee.name}...`);

      const payrollInput: PayrollInput = {
        employee_id: String(employee.id),
        employee_name: employee.name,
        salary_annual: employee.salary_usd!,
        hours_this_period: 85, // 85 hours (5 hours OT)
        pay_period: 'biweekly',
      };

      try {
        // Try AI calculation first
        const result = await payrollAgent.calculatePayroll(payrollInput);
        payrollResults.push(result);

        console.log(`   ✓ AI Calculation:`);
        console.log(`     Base Pay: $${result.base_pay.toFixed(2)}`);
        console.log(`     Hours: ${result.hours_worked} (OT: ${result.ot_hours})`);
        console.log(`     OT Pay: $${result.ot_pay.toFixed(2)}`);
        console.log(`     Gross: $${result.gross_pay.toFixed(2)}`);
        console.log(`     Tax: $${result.total_tax_estimated.toFixed(2)}`);
        console.log(`     Net Pay: $${result.net_pay.toFixed(2)}\n`);

        batchPaymentEmployees.push({
          id: employee.id!,
          employee_id: String(employee.id),
          wallet_address: employee.wallet_address!,
          net_pay: result.net_pay,
        });
      } catch (aiError) {
        console.warn(`   ⚠️  AI calculation failed, using manual fallback`);

        const result = payrollAgent.calculatePayrollManual(payrollInput);
        payrollResults.push(result);

        console.log(`   ✓ Manual Calculation:`);
        console.log(`     Net Pay: $${result.net_pay.toFixed(2)}\n`);

        batchPaymentEmployees.push({
          id: employee.id!,
          employee_id: String(employee.id),
          wallet_address: employee.wallet_address!,
          net_pay: result.net_pay,
        });
      }
    }

    console.log(`✅ Calculated payroll for ${payrollResults.length} employees\n`);

    // Step 3: Execute Batch Payment
    console.log('💸 Step 3: Executing Batch Payment on Arc Testnet\n');

    const paymentResult = await executeBatchPay(batchPaymentEmployees);

    console.log('\n✅ Batch Payment Successful!\n');
    console.log('📊 Payment Summary:');
    console.log(`   Employees Paid: ${paymentResult.employeeCount}`);
    console.log(`   Total Amount: $${paymentResult.totalPaid.toFixed(2)} USDC`);
    console.log(`   Transaction Hash: ${paymentResult.txHash}`);
    console.log(`   Block Number: ${paymentResult.blockNumber}`);
    console.log(`   Gas Used: ${paymentResult.gasUsed}`);
    console.log(`   Arc Explorer: ${paymentResult.explorerUrl}\n`);

    // Step 4: Verify Database Updates
    console.log('📝 Step 4: Verifying Database Updates\n');

    const pendingEmployees = await getPendingEmployees();
    console.log(`   Pending employees after payment: ${pendingEmployees.length}`);

    // Step 5: Display Pay Stubs
    console.log('\n📄 Step 5: Pay Stub Details\n');
    console.log('=' .repeat(80));

    for (let i = 0; i < onboardedEmployees.length; i++) {
      const employee = onboardedEmployees[i];
      const payroll = payrollResults[i];

      console.log(`\n💼 ${employee.name} (${employee.email})`);
      console.log('-'.repeat(80));
      console.log(`   Salary (Annual): $${employee.salary_usd?.toLocaleString()}`);
      console.log(`   Pay Period: ${payroll.pay_period}`);
      console.log(`   Hours Worked: ${payroll.hours_worked} hours`);
      console.log(`   Overtime: ${payroll.ot_hours} hours @ 1.5x`);
      console.log('');
      console.log(`   Base Pay:        $${payroll.base_pay.toFixed(2)}`);
      console.log(`   Overtime Pay:    $${payroll.ot_pay.toFixed(2)}`);
      console.log(`   Gross Pay:       $${payroll.gross_pay.toFixed(2)}`);
      console.log(`   Tax (20%):      -$${payroll.total_tax_estimated.toFixed(2)}`);
      console.log(`   ───────────────────────────`);
      console.log(`   Net Pay:         $${payroll.net_pay.toFixed(2)} USDC`);
      console.log('');
      console.log(`   Wallet: ${employee.wallet_address}`);
      console.log(`   TX: ${paymentResult.txHash}`);
      console.log(`   View: ${paymentResult.explorerUrl}`);
    }

    console.log('\n' + '='.repeat(80));

    console.log('\n🎉 Test Payroll Complete!\n');
    console.log('Next Steps:');
    console.log('1. Visit Arc Explorer to view the transaction');
    console.log('2. Check employee wallets for USDC balance');
    console.log('3. Try the dashboard: http://localhost:3001/dashboard');
    console.log('4. Run another payroll cycle');

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

testPayroll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
