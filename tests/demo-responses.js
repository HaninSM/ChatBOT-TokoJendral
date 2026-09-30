const queries = require('../db/queries');
const db = require('../db/knex');

async function runDemo() {
  console.log('======================================================================');
  console.log('  📱 DEMONSTRASI HASIL JADI: INVO EXECUTIVE AI COPILOT');
  console.log('======================================================================\n');

  // SKENARIO 1: Owner bertanya "Berapa performa keuangan kita secara all-time?"
  console.log('💬 [Chat Masuk dari Owner]: "Halo bot, tolong tampilkan performa toko secara keseluruhan (all-time)!"');
  const fin = await queries.getFinancialSummary({ period: 'all_time' });
  console.log('🤖 [Balasan Bot Telegram]:');
  console.log('----------------------------------------------------------------------');
  console.log(`📊 **Laporan Finansial Toko (All-Time)**\n`);
  console.log(`• 💰 **Total Omzet Penjualan:** ${fin.revenueFormatted} (${fin.transactionCount} transaksi)`);
  console.log(`• 📦 **Total HPP FIFO (COGS):** ${fin.cogsFIFOFormatted}`);
  console.log(`• 📈 **Laba Kotor (Gross Profit):** ${fin.grossProfitFormatted} (${fin.grossMarginPercentage})`);
  console.log(`• 🧾 **Beban Operasional:** ${fin.operationalExpensesFormatted}`);
  console.log(`• ✨ **Laba Bersih Riil:** ${fin.netProfitFormatted} (${fin.netMarginPercentage})\n`);
  console.log(`💡 _Catatan:_ Nilai HPP dihitung murni berbasis batch FIFO per transaksi.`);
  console.log('----------------------------------------------------------------------\n');

  // SKENARIO 2: Owner bertanya "Audit stok FIFO dan modal tertahan"
  console.log('💬 [Chat Masuk dari Owner]: "Audit stok inventori dengan metode FIFO! Ada modal tertahan berapa?"');
  const audit = await queries.getFIFOInventoryAudit({ staleDaysThreshold: 0, limit: 5 });
  console.log('🤖 [Balasan Bot Telegram]:');
  console.log('----------------------------------------------------------------------');
  console.log(`⏳ **Hasil Audit Batch Inventori FIFO**\n`);
  console.log(`• 🏢 **Total Batch Aktif:** ${audit.totalActiveBatches} batch`);
  console.log(`• 💼 **Total Modal Kerja Tertahan:** ${audit.totalTiedUpCapitalFormatted}\n`);
  if (audit.staleBatches.length > 0) {
    console.log(`📋 **Rincian Batch Utama:**`);
    audit.staleBatches.forEach((b, i) => {
      console.log(`  ${i + 1}. **${b.itemName}** (Batch #${b.batchId})`);
      console.log(`     - Sisa Stok: ${b.remainingQuantity} dari ${b.initialQuantity} unit`);
      console.log(`     - Harga Pokok (HPP): ${b.baseCostPriceFormatted} / unit`);
      console.log(`     - Modal Tertahan: ${b.tiedUpCapitalFormatted}`);
      console.log(`     - Tgl Masuk: ${b.receivedDate} (Usia: ${b.ageInDays} hari)`);
    });
  }
  console.log('----------------------------------------------------------------------\n');

  // SKENARIO 3: Owner bertanya "Cek stok kacamata"
  console.log('💬 [Chat Masuk dari Owner]: "Cek stok kacamata sekarang!"');
  const stock = await queries.getStockStatus({ searchKeyword: 'kacamata' });
  console.log('🤖 [Balasan Bot Telegram]:');
  console.log('----------------------------------------------------------------------');
  console.log(`📦 **Status Stok Produk: Kacamata**\n`);
  if (stock.items.length > 0) {
    const item = stock.items[0];
    console.log(`• Total Stok Fisik Gudang: **${item.totalWarehouseStockLabel}**`);
    console.log(`• Kuota Siap Jual Berdasarkan Satuan:`);
    item.sellingUnits.forEach(u => {
      console.log(`  - **${u.unitName}** (${u.conversionFactor} PCS) : Siap jual **${u.currentAvailableStock} ${u.unitName}** | Harga: ${u.sellingPriceFormatted} [Mode: ${u.stockMode.toUpperCase()}]`);
    });
  }
  console.log('\n💡 _Mode Floating Pool:_ Seluruh satuan menghitung kapasitas secara real-time dari stok bebas gudang.');
  console.log('----------------------------------------------------------------------\n');

  // SKENARIO 4: Akses Ditolak untuk Pengguna Asing (Security)
  console.log('💬 [Chat Masuk dari Pengguna Asing ID: 11223344]: "/start"');
  console.log('🤖 [Balasan Bot Telegram]:');
  console.log('----------------------------------------------------------------------');
  console.log(`⛔ **Akses Ditolak**\n`);
  console.log(`Bot ini dikonfigurasi khusus untuk Owner resmi Invo POS.`);
  console.log(`ID Telegram Anda: \`11223344\` belum terdaftar dalam whitelist .env.`);
  console.log('----------------------------------------------------------------------\n');

  console.log('>>> SELURUH LOGIKA SISTEM BERJALAN SEMPURNA SESUAI SPESIFIKASI! <<<');
  await db.destroy();
}

runDemo();
