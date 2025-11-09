import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

async function test() {
  const prompt = 'In 3 words: What is Paystream AI?';
  const result = await model.generateContent(prompt);
  console.log('Gemini Response:');
  console.log(result.response.text());
}

test().catch(console.error);
