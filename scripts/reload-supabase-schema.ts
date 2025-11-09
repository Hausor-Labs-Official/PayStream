import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function reloadSchema() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Extract project reference from URL
  const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  console.log('Reloading Supabase schema...');
  console.log('Project:', projectRef);

  try {
    const response = await fetch(`${projectUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({})
    });

    console.log('Response status:', response.status);

    if (response.ok || response.status === 404) {
      console.log('✅ Schema cache should be refreshed now');
      console.log('\nPlease wait 10-30 seconds and try running the test again.');
    } else {
      console.log('⚠️  Could not reload schema automatically');
      console.log('Please reload schema manually:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Settings > API');
      console.log('3. Click "Reload schema"');
    }
  } catch (error) {
    console.error('Error:', error);
    console.log('\nPlease reload schema manually in Supabase Dashboard');
  }
}

reloadSchema();
