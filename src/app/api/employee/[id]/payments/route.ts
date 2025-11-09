import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/employee/[id]/payments
 * Get payment history for a specific employee
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const employeeId = parseInt(resolvedParams.id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch payment history from external_transfers table
    const { data: payments, error } = await supabase
      .from('external_transfers')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: payments || [],
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment history',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
