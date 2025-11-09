import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testInsert() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Testing direct SQL insert...\n');

  try {
    // Try using rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        INSERT INTO employees (email, name, wallet_id, wallet_address, salary_usd, status)
        VALUES ('test@example.com', 'Test User', 'wallet123', '0x1234', 50000, 'pending')
        RETURNING *
      `
    });

    if (error) {
      console.log('RPC method failed:', error);
      console.log('\nTrying alternative: direct insert with explicit columns...\n');

      // Try a simpler insert
      const { data: employee, error: insertError } = await supabase
        .from('employees')
        .insert([{
          email: 'test2@example.com',
          name: 'Test User 2',
          wallet_id: 'wallet456',
          wallet_address: '0x5678',
          salary_usd: 60000,
          status: 'pending'
        }])
        .select();

      if (insertError) {
        console.error('Insert failed:', insertError);
      } else {
        console.log('✅ Insert successful:', employee);
      }
    } else {
      console.log('✅ Insert successful:', data);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

testInsert();
