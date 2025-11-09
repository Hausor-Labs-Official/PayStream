import { getSupabaseClient } from '../src/lib/supabase';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function clearTestEmployees() {
  const supabase = getSupabaseClient();

  console.log('Clearing test employees...');

  const { error } = await supabase
    .from('employees')
    .delete()
    .in('email', ['alice@test.paystream.ai', 'bob@test.paystream.ai']);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Test employees cleared successfully');
  }
}

clearTestEmployees();
