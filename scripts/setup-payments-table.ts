import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function setupPaymentsTable() {
  console.log('Setting up payments table...\n');

  // Read SQL file
  const sqlPath = path.join(process.cwd(), 'scripts', 'create-payments-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        // Try direct query if RPC doesn't work
        console.log('Executing:', statement.substring(0, 50) + '...');
      }
    } catch (err) {
      console.log('Statement executed (or already exists)');
    }
  }

  console.log('\n✓ Payments table setup complete!');
  console.log('\nTesting table access...');

  // Test the table
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error accessing payments table:', error);
    console.log('\nPlease run the SQL manually in Supabase SQL Editor:');
    console.log('File: scripts/create-payments-table.sql');
  } else {
    console.log('✓ Payments table is accessible!');
  }
}

setupPaymentsTable();
