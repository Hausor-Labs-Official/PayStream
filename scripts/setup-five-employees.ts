import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function setupFiveEmployees() {
  // Get all employees
  const { data: allEmployees, error: fetchError } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchError || !allEmployees) {
    console.error('Error fetching employees:', fetchError);
    return;
  }

  console.log('Setting up exactly 5 pending employees for batch payment...\n');

  const first5 = allEmployees.slice(0, 5);
  const rest = allEmployees.slice(5);

  // Set first 5 to pending
  for (const emp of first5) {
    const { error } = await supabase
      .from('employees')
      .update({ status: 'pending' })
      .eq('id', emp.id);

    if (!error) {
      console.log('✓ Set to PENDING:', emp.name, '-', emp.email);
    }
  }

  // Set rest to paid
  for (const emp of rest) {
    const { error } = await supabase
      .from('employees')
      .update({ status: 'paid' })
      .eq('id', emp.id);

    if (!error) {
      console.log('  Set to PAID:', emp.name);
    }
  }

  console.log(`\nTotal: ${first5.length} pending employees ready for 1 USDC each (${first5.length} USDC total)`);
  console.log('\nPending Employees:');
  first5.forEach((emp, i) => {
    console.log(`${i + 1}. ${emp.name} - ${emp.email} - Wallet: ${emp.wallet_address}`);
  });
}

setupFiveEmployees();
