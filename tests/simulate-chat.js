const readline = require('readline');
const aiAgent = require('../ai/agent');
const db = require('../db/knex');

async function startInteractiveSimulation() {
  console.log('========================================================');
  console.log('  🧪 INVO COPILOT - CLI CHAT SIMULATION');
  console.log('========================================================');

  if (!aiAgent.isConfigured()) {
    console.log('\n⚠️  PERHATIAN: GEMINI_API_KEY belum diset di file .env.');
    console.log('   Tambahkan GEMINI_API_KEY ke d:\\ChatBOT\\.env untuk mencoba simulasi AI.\n');
  } else {
    console.log(`\n🧠 Model AI : ${aiAgent.modelName}`);
    console.log('💬 Anda dapat mengetik pertanyaan simulasi Owner (misal: "Berapa omzet hari ini?", "Cek stok barang", atau "exit" untuk keluar).\n');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = () => {
    rl.question('👤 Owner > ', async (input) => {
      const q = input.trim();
      if (q.toLowerCase() === 'exit' || q.toLowerCase() === 'quit') {
        rl.close();
        await db.destroy();
        console.log('\nSampai jumpa!');
        process.exit(0);
      }

      if (!q) {
        promptUser();
        return;
      }

      console.log('🤖 AI Copilot sedang menganalisis data...');
      try {
        const reply = await aiAgent.ask('simulated_owner', q);
        console.log(`\n🤖 AI Copilot:\n${reply}\n`);
      } catch (e) {
        console.error('Error:', e.message);
      }
      promptUser();
    });
  };

  promptUser();
}

startInteractiveSimulation();
