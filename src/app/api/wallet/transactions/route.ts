import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/wallet/transactions
 * Get wallet transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const transactions: any[] = [];

    // Fetch on-ramp transactions
    const { data: onrampData, error: onrampError } = await supabase
      .from('onramp_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!onrampError && onrampData) {
      onrampData.forEach((tx: any) => {
        transactions.push({
          id: tx.id || tx.session_id,
          type: 'onramp',
          amount: tx.amount_usd || 0,
          status: tx.status || 'pending',
          timestamp: tx.created_at || tx.completed_at || new Date().toISOString(),
          hash: tx.transaction_hash,
          description: `USDC purchase via Circle - $${tx.amount_usd?.toFixed(2) || 0}`,
        });
      });
    }

    // Fetch payroll transactions by looking at employee status changes
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('pay_status', 'paid')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (!empError && employees) {
      // Group by update time to simulate payroll runs
      const payrollRuns: any = {};
      employees.forEach((emp: any) => {
        const dateKey = new Date(emp.updated_at).toISOString().split('T')[0];
        if (!payrollRuns[dateKey]) {
          payrollRuns[dateKey] = {
            employees: [],
            totalAmount: 0,
            timestamp: emp.updated_at,
          };
        }
        payrollRuns[dateKey].employees.push(emp);
        payrollRuns[dateKey].totalAmount += emp.salary_annual / 12; // Monthly salary
      });

      Object.keys(payrollRuns).forEach((dateKey, index) => {
        const run = payrollRuns[dateKey];
        transactions.push({
          id: `payroll-${dateKey}`,
          type: 'payroll',
          amount: -run.totalAmount, // Negative because it's outgoing
          status: 'completed',
          timestamp: run.timestamp,
          hash: undefined,
          description: `Payroll run - ${run.employees.length} employee${run.employees.length > 1 ? 's' : ''}`,
        });
      });
    }

    // Sort all transactions by timestamp
    transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      transactions: transactions.slice(0, 20), // Return max 20 transactions
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
        details: (error as Error).message,
        transactions: [], // Return empty array on error
      },
      { status: 500 }
    );
  }
}
