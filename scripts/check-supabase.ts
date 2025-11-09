import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkSupabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Checking Supabase connection...\n');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  try {
    // Try to select from employees table
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying employees table:', error);
      console.log('\nThe table might not exist or the schema needs to be refreshed.');
      console.log('Please go to Supabase Dashboard > SQL Editor and run the CREATE TABLE script.');
    } else {
      console.log('✅ Successfully connected to employees table');
      console.log('Current records:', data);
    }
  } catch (e) {
    console.error('Connection error:', e);
  }
}

checkSupabase();
