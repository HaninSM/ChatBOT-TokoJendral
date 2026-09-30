require('dotenv').config();
const bot = require('./bot');
const db = require('./db/knex');

async function bootstrap() {
  console.log('====================================================');
  console.log('  🚀 INVO EXECUTIVE AI COPILOT (TELEGRAM ASSISTANT)');
  console.log('====================================================\n');

  // Diagnostic checks
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const ownerId = process.env.TELEGRAM_OWNER_ID;
  const geminiKey = process.env.GEMINI_API_KEY;
  const dbPath = process.env.POS_DB_PATH || 'd:/POS/database/pos.db';

  console.log(`📁 Database Path    : ${dbPath}`);
  console.log(`🤖 Telegram Bot     : ${botToken ? 'Configured ✅' : 'Missing ❌ (Set TELEGRAM_BOT_TOKEN in .env)'}`);
  console.log(`👤 Owner Whitelist  : ${ownerId ? `ID: ${ownerId} ✅` : 'Open / Unset ⚠️ (Set TELEGRAM_OWNER_ID in .env)'}`);
  console.log(`🧠 Gemini AI API    : ${geminiKey ? 'Configured ✅' : 'Missing ❌ (Set GEMINI_API_KEY in .env)'}`);
  console.log('----------------------------------------------------');

  // Verify database connectivity
  try {
    const itemCount = await db('items').count('id as count').first();
    console.log(`📦 Database Status  : Connected! (${itemCount.count} master items found) ✅\n`);
  } catch (err) {
    console.error(`❌ Gagal terhubung ke database POS di ${dbPath}:`, err.message);
    process.exit(1);
  }

  if (!botToken || botToken === 'your_telegram_bot_token_here') {
    console.log('ℹ️  Bot belum dijalankan karena TELEGRAM_BOT_TOKEN belum diisi.');
    console.log('👉 Silakan isi TELEGRAM_BOT_TOKEN di d:\\ChatBOT\\.env untuk menjalankan bot Telegram.\n');
    await db.destroy();
    return;
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Menghentikan Invo Executive Copilot...');
    try {
      await bot.stop();
      await db.destroy();
      console.log('✅ Bot dan koneksi database berhasil ditutup.');
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  console.log('⚡ Menghubungkan bot ke Telegram network...');
  bot.start({
    onStart: (botInfo) => {
      console.log(`✨ Bot berhasil online sebagai @${botInfo.username}!`);
      console.log('💬 Siap menerima pesan dari Owner.');
    },
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
