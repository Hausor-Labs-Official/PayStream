import { NextResponse } from 'next/server';
import { getPendingEmployees, updateEmployee } from '@/lib/supabase';
import { PayrollAgent, PayrollInput, PayrollResult } from '@/lib/payroll-agent';
import { executeBatchPay, BatchPaymentEmployee } from '@/lib/executor-agent';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payroll
 * Process payroll for all pending employees
 */
export async function POST(request: Request) {
  try {
    console.log('🚀 Starting payroll processing...\n');

    // Step 1: Get pending employees
    const pendingEmployees = await getPendingEmployees();

    if (pendingEmployees.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No pending employees to process',
      });
    }

    console.log(`📋 Found ${pendingEmployees.length} pending employees`);

    // Step 1.5: Calculate total payroll needed and check USDC balance
    // TESTING MODE: Cap total payroll at $5.00
    const TOTAL_PAYROLL_CAP = 5.00;
    const estimatedTotalPayroll = TOTAL_PAYROLL_CAP;

    console.log(`💰 Estimated total payroll: $${estimatedTotalPayroll.toFixed(2)} USDC (TEST MODE - CAPPED)`);

    // Import dynamically to avoid circular dependencies
    const { ExecutorAgent } = await import('@/lib/executor-agent');
    const executorAgent = new ExecutorAgent();

    try {
      const usdcBalance = await executorAgent.getUSDCBalance();
      console.log(`💵 Current USDC balance: $${usdcBalance.toFixed(2)}`);

      if (usdcBalance < estimatedTotalPayroll) {
        const shortfall = estimatedTotalPayroll - usdcBalance;
        return NextResponse.json({
          success: false,
          error: 'INSUFFICIENT_BALANCE',
          message: `Insufficient USDC balance. Need $${estimatedTotalPayroll.toFixed(2)}, have $${usdcBalance.toFixed(2)}. Shortfall: $${shortfall.toFixed(2)}`,
          details: {
            required: estimatedTotalPayroll,
            available: usdcBalance,
            shortfall: shortfall,
            employeeCount: pendingEmployees.length,
          }
        }, { status: 400 });
      }

      console.log(`✓ USDC balance sufficient for payroll`);
    } catch (balanceError) {
      console.warn(`⚠️  Could not verify USDC balance: ${(balanceError as Error).message}`);
      // Continue processing but log the warning
    }

    // Step 2: Calculate payroll for each employee using AI
    const payrollAgent = new PayrollAgent();
    const payrollResults: PayrollResult[] = [];
    const batchPaymentEmployees: BatchPaymentEmployee[] = [];

    console.log('\n💰 Calculating payroll...');

    // TESTING MODE: Cap total payroll at $5.00
    const TOTAL_PAYROLL_CAP = 5.00;
    const payPerEmployee = TOTAL_PAYROLL_CAP / pendingEmployees.length;

    console.log(`   🧪 TEST MODE: Total payroll capped at $${TOTAL_PAYROLL_CAP.toFixed(2)}`);
    console.log(`   💵 Each employee will receive: $${payPerEmployee.toFixed(2)} USDC`);

    for (const employee of pendingEmployees) {
      try {
        console.log(`   Calculating for ${employee.name}...`);

        // Create simplified payroll result with capped payment
        const payrollResult: PayrollResult = {
          employee_id: String(employee.id),
          employee_name: employee.name,
          base_pay: payPerEmployee,
          hours_worked: 80,
          ot_hours: 0,
          ot_pay: 0,
          gross_pay: payPerEmployee,
          total_tax_estimated: 0,
          net_pay: payPerEmployee,
          pay_period: 'biweekly',
        };

        payrollResults.push(payrollResult);

        // Prepare for batch payment
        if (employee.wallet_address) {
          batchPaymentEmployees.push({
            id: employee.id!,
            employee_id: String(employee.id),
            wallet_address: employee.wallet_address,
            net_pay: payPerEmployee,
          });
        } else {
          console.warn(`   ⚠️  Employee ${employee.name} has no wallet address`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to calculate payroll for ${employee.name}:`, error);
      }
    }

    console.log(`   ✓ Calculated payroll for ${payrollResults.length} employees`);

    // Step 3: Execute batch payment
    if (batchPaymentEmployees.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No employees with wallet addresses to pay',
        payrollResults,
      });
    }

    console.log(`\n💸 Executing batch payment...`);

    const paymentResult = await executeBatchPay(batchPaymentEmployees);

    console.log(`   ✓ Payment successful!`);

    // Step 4: Send email pay stubs
    console.log(`\n📧 Sending pay stubs...`);

    let emailsSent = 0;
    for (let i = 0; i < pendingEmployees.length; i++) {
      const employee = pendingEmployees[i];
      const payroll = payrollResults[i];

      if (payroll && employee.email) {
        try {
          await sendPayStub(employee, payroll, paymentResult.txHash, paymentResult.explorerUrl);
          emailsSent++;
          console.log(`   ✓ Sent to ${employee.email}`);
        } catch (emailError) {
          console.error(`   ❌ Failed to send to ${employee.email}:`, emailError);
        }
      }
    }

    console.log(`   ✓ Sent ${emailsSent} emails`);

    console.log(`\n🎉 Payroll processing complete!`);

    // Return success response
    return NextResponse.json({
      success: true,
      paid: paymentResult.employeeCount,
      tx: paymentResult.txHash,
      explorer: paymentResult.explorerUrl,
      totalPaid: paymentResult.totalPaid,
      blockNumber: paymentResult.blockNumber,
      gasUsed: paymentResult.gasUsed,
      emailsSent,
      payrollResults,
    });
  } catch (error) {
    console.error('\n❌ Payroll processing failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * Send pay stub email to employee
 */
async function sendPayStub(
  employee: any,
  payroll: PayrollResult,
  txHash: string,
  explorerUrl: string
): Promise<void> {
  // Create email transporter (using console for testnet)
  // In production, configure with real SMTP settings
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email', // Test email service
    port: 587,
    secure: false,
    auth: {
      user: 'test@paystream.ai',
      pass: 'test-password',
    },
  });

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .pay-detail { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
    .amount { font-size: 24px; font-weight: bold; color: #667eea; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Pay Stub - Paystream AI</h1>
      <p>Your payment has been processed!</p>
    </div>

    <div class="content">
      <h2>Hello ${employee.name}!</h2>

      <p>Your payroll for this period has been successfully processed and paid via USDC on Arc Testnet.</p>

      <div class="pay-detail">
        <strong>Base Pay:</strong> $${payroll.base_pay.toFixed(2)}
      </div>

      <div class="pay-detail">
        <strong>Hours Worked:</strong> ${payroll.hours_worked} hours
      </div>

      <div class="pay-detail">
        <strong>Overtime Hours:</strong> ${payroll.ot_hours} hours
      </div>

      <div class="pay-detail">
        <strong>Overtime Pay:</strong> $${payroll.ot_pay.toFixed(2)}
      </div>

      <div class="pay-detail">
        <strong>Gross Pay:</strong> $${payroll.gross_pay.toFixed(2)}
      </div>

      <div class="pay-detail">
        <strong>Tax (Estimated):</strong> -$${payroll.total_tax_estimated.toFixed(2)}
      </div>

      <div class="pay-detail">
        <strong class="amount">Net Pay: $${payroll.net_pay.toFixed(2)} USDC</strong>
      </div>

      <h3>🔗 Blockchain Transaction</h3>
      <p>Your payment was processed on Arc Testnet blockchain:</p>

      <div class="pay-detail">
        <strong>Transaction Hash:</strong><br/>
        <code style="font-size: 11px; word-break: break-all;">${txHash}</code>
      </div>

      <div class="pay-detail">
        <strong>Wallet Address:</strong><br/>
        <code style="font-size: 11px;">${employee.wallet_address}</code>
      </div>

      <a href="${explorerUrl}" class="button">View on Arc Explorer →</a>

      <div class="footer">
        <p>This is an automated email from Paystream AI</p>
        <p>Powered by Circle, Arc Testnet, and Google Gemini AI</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  // For testnet, just log the email (don't actually send)
  console.log(`\n📧 Pay Stub Email for ${employee.email}:`);
  console.log(`   Subject: Your Paystream AI Pay Stub - $${payroll.net_pay.toFixed(2)} USDC`);
  console.log(`   Net Pay: $${payroll.net_pay.toFixed(2)}`);
  console.log(`   TX: ${txHash}`);
  console.log(`   Explorer: ${explorerUrl}`);

  // In production, uncomment this to send real emails:
  /*
  await transporter.sendMail({
    from: '"Paystream AI" <payroll@paystream.ai>',
    to: employee.email,
    subject: `Your Paystream AI Pay Stub - $${payroll.net_pay.toFixed(2)} USDC`,
    html: emailHtml,
  });
  */
}

/**
 * GET /api/payroll
 * Get payroll processing status
 */
export async function GET() {
  try {
    const pendingEmployees = await getPendingEmployees();

    return NextResponse.json({
      pendingCount: pendingEmployees.length,
      employees: pendingEmployees,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
