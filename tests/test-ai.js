require('dotenv').config();
const aiAgent = require('../ai/agent');
const db = require('../db/knex');

async function testAI() {
  console.log('Testing Gemini AI Agent with live API Key...\n');
  try {
    const question = 'Halo, berapa total omzet dan laba bersih toko kita secara all-time?';
    console.log(`Prompt: "${question}"`);
    console.log('Menghubungi Gemini 2.5 Flash...');
    const reply = await aiAgent.ask('test_owner', question);
    console.log('\n--- Jawaban AI Gemini ---');
    console.log(reply);
    console.log('-------------------------\n');
    console.log('✅ Gemini API & Function Calling BERHASIL!');
  } catch (err) {
    console.error('Error saat test AI:', err);
  } finally {
    await db.destroy();
  }
}

testAI();
