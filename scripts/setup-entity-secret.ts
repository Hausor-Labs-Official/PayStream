import { generateEntitySecret, registerEntitySecretCiphertext } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

async function setupEntitySecret() {
  console.log('Generating new entity secret...');

  // Generate a new entity secret
  generateEntitySecret();

  console.log('\n⚠️  IMPORTANT: Copy the entity secret displayed above and save it securely!');
  console.log('You will need to paste it below to register it with Circle.\n');

  // Prompt user to input the entity secret
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Paste the entity secret here: ', async (entitySecret: string) => {
    try {
      console.log('\nRegistering entity secret with Circle...');

      const response = await registerEntitySecretCiphertext({
        apiKey: process.env.CIRCLE_API_KEY!,
        entitySecret: entitySecret.trim(),
      });

      // Save recovery file
      if (response.data?.recoveryFile) {
        fs.writeFileSync('recovery_file.dat', response.data.recoveryFile);
        console.log('✅ Recovery file saved as recovery_file.dat');
      }

      console.log('✅ Entity secret registered successfully!');
      console.log('\nAdd this to your .env.local:');
      console.log(`CIRCLE_ENTITY_ID=${entitySecret.trim()}`);

    } catch (error: any) {
      console.error('Error registering entity secret:', error.response?.data || error.message);
    } finally {
      readline.close();
    }
  });
}

setupEntitySecret();
