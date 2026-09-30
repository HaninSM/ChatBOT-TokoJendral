const { Type } = require('@google/genai');
const queries = require('../db/queries');

/**
 * Gemini Tool Declarations for Invo POS Executive Assistant
 */
const functionDeclarations = [
  {
    name: 'getFinancialSummary',
    description: 'Mengambil ringkasan omzet penjualan, HPP FIFO (COGS), beban operasional, dan laba kotor/bersih untuk periode tertentu (today, yesterday, this_week, this_month, all_time).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        period: {
          type: Type.STRING,
          description: "Pilihan periode: 'today', 'yesterday', 'this_week', 'this_month', atau 'all_time'",
        },
      },
      required: ['period'],
    },
  },
  {
    name: 'getFIFOInventoryAudit',
    description: 'Mengaudit batch stok inventori Invo POS berbasis FIFO, mencari barang dead stock (mengendap lama), serta menghitung total modal (HPP) yang tertahan.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        staleDaysThreshold: {
          type: Type.INTEGER,
          description: 'Batas usia barang dalam hari untuk dianggap dead stock (default: 30 hari). Masukkan 0 jika ingin melihat semua batch aktif.',
        },
        limit: {
          type: Type.INTEGER,
          description: 'Jumlah batch teratas yang ingin ditampilkan (default: 10).',
        },
      },
    },
  },
  {
    name: 'getStockStatus',
    description: 'Mengecek ketersediaan stok produk tertentu, termasuk kuota Floating Pool (stok gudang fleksibel) vs Physical Allocation (kuota kemasan siap jual di rak) serta paket bundling/hampers.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        searchKeyword: {
          type: Type.STRING,
          description: 'Nama atau kata kunci barang yang ingin dicek (contoh: kacamata, dus, roll). Biarkan kosong untuk melihat semua barang aktif.',
        },
      },
    },
  },
  {
    name: 'getBusinessRecommendations',
    description: 'Menjalankan engine analisis untuk mendeteksi dead stock, stok menipis, dan bottleneck paket hampers/bundling, lalu menghasilkan rekomendasi aksi bisnis konkret (promo repackage, restock prioritas).',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

/**
 * Dispatcher to execute the matching database query
 */
async function executeTool(name, args) {
  try {
    switch (name) {
      case 'getFinancialSummary':
        return await queries.getFinancialSummary(args || {});
      case 'getFIFOInventoryAudit':
        return await queries.getFIFOInventoryAudit(args || {});
      case 'getStockStatus':
        return await queries.getStockStatus(args || {});
      case 'getBusinessRecommendations':
        return await queries.getBusinessRecommendations();
      default:
        return { error: `Tool '${name}' tidak dikenali.` };
    }
  } catch (err) {
    return { error: `Gagal menjalankan tool ${name}: ${err.message}` };
  }
}

module.exports = {
  functionDeclarations,
  executeTool,
};
