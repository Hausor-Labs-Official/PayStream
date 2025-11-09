import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPaymentsTable() {
  console.log('Checking payments table...\n');

  // Check if table exists
  const { data: existing, error: checkError } = await supabase
    .from('payments')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('✓ Payments table exists!');

    // Get count
    const { count, error: countError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    console.log(`Current payment records: ${count || 0}`);
    return true;
  }

  console.log('❌ Payments table does NOT exist!');
  console.log('\n📋 Please run this SQL in Supabase SQL Editor:\n');
  console.log('File: scripts/create-payments-table.sql');
  console.log('\nOR copy and paste this:\n');
  console.log('---START SQL---');
  console.log(`
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount DECIMAL(18, 6) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USDC',
  status VARCHAR(20) DEFAULT 'pending',
  tx_hash TEXT,
  block_number BIGINT,
  gas_used BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_employee_id ON payments(employee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON payments FOR ALL USING (true) WITH CHECK (true);
  `);
  console.log('---END SQL---');
  return false;
}

checkPaymentsTable();
