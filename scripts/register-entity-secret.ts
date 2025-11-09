import { registerEntitySecretCiphertext } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

// This is the entity secret that was generated
const ENTITY_SECRET = 'c0ac43b5c1a8c6b58ab684b2670559756d618c615a87236b15d31ff82278959f';

async function registerSecret() {
  try {
    console.log('Registering entity secret with Circle...');

    const response = await registerEntitySecretCiphertext({
      apiKey: process.env.CIRCLE_API_KEY!,
      entitySecret: ENTITY_SECRET,
    });

    // Save recovery file
    if (response.data?.recoveryFile) {
      fs.writeFileSync('recovery_file.dat', response.data.recoveryFile);
      console.log('✅ Recovery file saved as recovery_file.dat');
    }

    console.log('✅ Entity secret registered successfully!');
    console.log('\n📝 Your entity secret is:');
    console.log(ENTITY_SECRET);
    console.log('\n⚠️  SAVE THIS ENTITY SECRET SECURELY!');
    console.log('\nNow updating .env.local...');

    // Update .env.local file
    const envContent = fs.readFileSync('.env.local', 'utf-8');
    const updatedContent = envContent.replace(
      /CIRCLE_ENTITY_ID=.*/,
      `CIRCLE_ENTITY_ID=${ENTITY_SECRET}`
    );
    fs.writeFileSync('.env.local', updatedContent);

    console.log('✅ .env.local updated with entity secret');
    console.log('\nYou can now run: npx tsx scripts/create-wallet-set.ts');

  } catch (error: any) {
    console.error('Error:', error.response?.data || error.message);
  }
}

registerSecret();
