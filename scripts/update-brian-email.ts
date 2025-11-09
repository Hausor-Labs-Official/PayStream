/**
 * Script to update Brian Mwai's email address
 * Run with: npx tsx scripts/update-brian-email.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function updateBrianEmail() {
  try {
    console.log('🔄 Updating Brian Mwai\'s email address...\n');

    // Find Brian by old email
    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', 'brnmwai@gmail.com')
      .single();

    if (!existingEmployee) {
      console.log('⚠️  Employee with email brnmwai@gmail.com not found');
      console.log('   Checking for info.brnmwai@gmail.com...');

      const { data: newEmployee } = await supabase
        .from('employees')
        .select('*')
        .eq('email', 'info.brnmwai@gmail.com')
        .single();

      if (newEmployee) {
        console.log('✅ Email already updated to info.brnmwai@gmail.com');
        return;
      }

      console.log('❌ Brian Mwai not found in database');
      return;
    }

    console.log(`   Found employee: ${existingEmployee.name} (ID: ${existingEmployee.id})`);

    // Update email
    const { data, error } = await supabase
      .from('employees')
      .update({ email: 'info.brnmwai@gmail.com' })
      .eq('id', existingEmployee.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update email:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully updated email to info.brnmwai@gmail.com`);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

// Run the update
updateBrianEmail();
