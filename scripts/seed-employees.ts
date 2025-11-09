/**
 * Script to seed the database with employees from CSV
 * Run with: npx tsx scripts/seed-employees.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

interface EmployeeCSVRow {
  name: string;
  email: string;
  wallet_address: string;
  salary_annual: string;
  status: string;
}

async function seedEmployees() {
  try {
    console.log('🌱 Starting employee seeding...\n');

    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'employees-import.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV (simple parsing - assumes no commas in values)
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');

    const employees: EmployeeCSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const employee: any = {};
      headers.forEach((header, index) => {
        employee[header.trim()] = values[index]?.trim() || '';
      });
      employees.push(employee);
    }

    console.log(`📋 Found ${employees.length} employees in CSV\n`);

    // Insert employees into database
    let successCount = 0;
    let errorCount = 0;

    for (const emp of employees) {
      try {
        console.log(`   Adding ${emp.name} (${emp.email})...`);

        // Check if employee already exists
        const { data: existing } = await supabase
          .from('employees')
          .select('id')
          .eq('email', emp.email.toLowerCase())
          .single();

        if (existing) {
          console.log(`   ⚠️  Employee ${emp.email} already exists, skipping`);
          continue;
        }

        // Insert employee
        const { data, error } = await supabase
          .from('employees')
          .insert({
            name: emp.name,
            email: emp.email.toLowerCase(),
            wallet_address: emp.wallet_address,
            salary_annual: parseFloat(emp.salary_annual),
            pay_status: emp.status || 'pending',
          })
          .select()
          .single();

        if (error) {
          console.error(`   ❌ Failed to add ${emp.name}:`, error.message);
          errorCount++;
        } else {
          console.log(`   ✅ Added ${emp.name} (ID: ${data.id})`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error processing ${emp.name}:`, err);
        errorCount++;
      }
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seedEmployees();
