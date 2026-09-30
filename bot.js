const { Bot, Keyboard } = require('grammy');
const aiAgent = require('./ai/agent');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN belum diset di file .env.');
}

const bot = new Bot(token || 'dummy_token');

// 1. Security Whitelist Middleware
bot.use(async (ctx, next) => {
  const allowedOwnerId = process.env.TELEGRAM_OWNER_ID?.trim();
  const senderId = ctx.from?.id?.toString();

  // If owner ID is configured in .env, enforce strict access
  if (allowedOwnerId && senderId !== allowedOwnerId) {
    console.warn(`[Security Alert] Akses ditolak untuk Telegram User ID: ${senderId} (@${ctx.from?.username || 'unknown'})`);
    return ctx.reply(
      `⛔ **Akses Ditolak**\n\n` +
      `Bot ini dikonfigurasi khusus untuk Owner resmi Invo POS.\n` +
      `ID Telegram Anda: \`${senderId}\`\n\n` +
      `Silakan hubungi administrator untuk menambahkan ID ini ke file \`.env\`.`,
      { parse_mode: 'Markdown' }
    );
  }

  await next();
});

// Helper Quick Keyboard
function getMainKeyboard() {
  return new Keyboard()
    .text('📊 Omzet & Laba Hari Ini').text('📈 Performa All-Time').row()
    .text('📦 Cek Stok Barang').text('💡 Saran Bisnis & Promo').row()
    .text('⏳ Audit Dead Stock FIFO').text('🔄 Reset Chat')
    .resized();
}

// 2. Command Handlers
bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name || 'Owner';
  await ctx.reply(
    `👋 **Selamat datang, Pak/Bu ${name}!**\n\n` +
    `Saya adalah **Invo Executive AI Copilot**, asisten pribadi Anda untuk memantau performa toko, inventori FIFO, dan profitabilitas secara real-time.\n\n` +
    `Anda dapat bertanya bebas menggunakan bahasa sehari-hari, misalnya:\n` +
    `• _"Berapa laba bersih kita minggu ini?"_\n` +
    `• _"Ada barang yang mau expired atau mengendap lama?"_\n` +
    `• _"Sisa stok kacamata berapa dan posisinya di rak mana?"_\n` +
    `• _"Berikan rekomendasi promo untuk perputaran modal!"_\n\n` +
    `Gunakan menu cepat di bawah atau langsung ketikkan pertanyaan Anda:`,
    {
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    }
  );
});

bot.command('reset', async (ctx) => {
  aiAgent.clearHistory(ctx.chat.id);
  await ctx.reply('🔄 Memori percakapan telah direset. Silakan mulai topik baru!', {
    reply_markup: getMainKeyboard(),
  });
});

// 3. Quick Action Button Listeners
bot.hears('📊 Omzet & Laba Hari Ini', async (ctx) => {
  await handleUserMessage(ctx, 'Berapa ringkasan omzet, HPP FIFO, beban, dan laba bersih toko kita untuk hari ini?');
});

bot.hears('📈 Performa All-Time', async (ctx) => {
  await handleUserMessage(ctx, 'Berapa ringkasan total omzet, HPP FIFO, dan akumulasi laba bersih toko kita secara keseluruhan (all-time)?');
});

bot.hears('📦 Cek Stok Barang', async (ctx) => {
  await handleUserMessage(ctx, 'Tolong tampilkan ringkasan status stok barang di gudang beserta status floating pool dan alokasi fisiknya.');
});

bot.hears('💡 Saran Bisnis & Promo', async (ctx) => {
  await handleUserMessage(ctx, 'Analisis stok toko kita saat ini dan berikan rekomendasi bisnis atau strategi promo terbaik untuk memutar modal.');
});

bot.hears('⏳ Audit Dead Stock FIFO', async (ctx) => {
  await handleUserMessage(ctx, 'Audit batch inventori kita dengan metode FIFO. Apakah ada dead stock atau batch barang yang mengendap lama beserta modal yang tertahan?');
});

bot.hears('🔄 Reset Chat', async (ctx) => {
  aiAgent.clearHistory(ctx.chat.id);
  await ctx.reply('🔄 Memori percakapan telah dibersihkan.');
});

// 4. General Message Handler
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  await handleUserMessage(ctx, text);
});

/**
 * Handle incoming question with typing status and message splitting
 */
async function handleUserMessage(ctx, text) {
  try {
    // Send typing action indicator
    await ctx.replyWithChatAction('typing');

    const reply = await aiAgent.ask(ctx.chat.id, text);

    // Split response if exceeds Telegram max message length (4096 characters)
    if (reply.length <= 4000) {
      await ctx.reply(reply, { parse_mode: 'Markdown' }).catch(async () => {
        // Fallback without parse_mode if markdown has formatting errors
        await ctx.reply(reply);
      });
    } else {
      const chunks = splitText(reply, 4000);
      for (const chunk of chunks) {
        await ctx.reply(chunk, { parse_mode: 'Markdown' }).catch(async () => {
          await ctx.reply(chunk);
        });
      }
    }
  } catch (err) {
    console.error('[Bot Handler Error]', err);
    await ctx.reply(`⚠️ Terjadi kendala saat merespon: ${err.message}`);
  }
}

function splitText(str, maxLength) {
  const chunks = [];
  let remaining = str;
  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }
    let sliceIndex = remaining.lastIndexOf('\n', maxLength);
    if (sliceIndex === -1) sliceIndex = maxLength;
    chunks.push(remaining.substring(0, sliceIndex));
    remaining = remaining.substring(sliceIndex).trim();
  }
  return chunks;
}

module.exports = bot;
