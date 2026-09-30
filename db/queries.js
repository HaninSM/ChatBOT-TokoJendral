const db = require('./knex');

/**
 * Format number to Indonesian Rupiah representation
 */
function formatRupiah(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Helper to get date boundaries based on period keyword
 */
function getDateRange(period) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week':
      // Start of current week (Monday)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'all_time':
    default:
      return null;
  }

  return {
    startStr: start.toISOString().replace('T', ' ').substring(0, 19),
    startDateOnly: start.toISOString().substring(0, 10),
    endStr: end.toISOString().replace('T', ' ').substring(0, 19),
    endDateOnly: end.toISOString().substring(0, 10),
  };
}

/**
 * 1. Financial Summary Query
 * Menghitung Omzet, COGS (HPP FIFO), Beban Operasional, Laba Kotor, Laba Bersih
 */
async function getFinancialSummary({ period = 'today' }) {
  const range = getDateRange(period);

  let txQuery = db('transactions')
    .where('payment_status', 'paid');

  let expQuery = db('expenses');

  if (range) {
    txQuery = txQuery.whereBetween('transaction_date', [range.startStr, range.endStr]);
    expQuery = expQuery.whereBetween('expense_date', [range.startDateOnly, range.endDateOnly]);
  }

  const txs = await txQuery.select('id', 'total_amount', 'transaction_date');
  const txIds = txs.map(t => t.id);

  let totalRevenue = 0;
  let totalCOGS = 0;
  let itemsSoldSummary = [];

  if (txIds.length > 0) {
    totalRevenue = txs.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

    const items = await db('transaction_items')
      .whereIn('transaction_id', txIds)
      .select('quantity_sold', 'cost_price', 'unit_price', 'subtotal_price', 'product_unit_id');

    totalCOGS = items.reduce((acc, curr) => {
      const qty = Number(curr.quantity_sold || 0);
      const cost = Number(curr.cost_price || 0);
      return acc + (qty * cost);
    }, 0);
  }

  const expenses = await expQuery.select('category', 'amount');
  const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;
  const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
  const netMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  return {
    period,
    transactionCount: txs.length,
    revenue: totalRevenue,
    revenueFormatted: formatRupiah(totalRevenue),
    cogsFIFO: totalCOGS,
    cogsFIFOFormatted: formatRupiah(totalCOGS),
    grossProfit,
    grossProfitFormatted: formatRupiah(grossProfit),
    grossMarginPercentage: `${grossMarginPct}%`,
    operationalExpenses: totalExpenses,
    operationalExpensesFormatted: formatRupiah(totalExpenses),
    netProfit,
    netProfitFormatted: formatRupiah(netProfit),
    netMarginPercentage: `${netMarginPct}%`,
    expenseBreakdown: expenses,
  };
}

/**
 * 2. FIFO Inventory & Dead Stock Audit
 * Mendeteksi batch dengan sisa stok > 0 dan usia barang di rak/gudang
 */
async function getFIFOInventoryAudit({ staleDaysThreshold = 30, limit = 10 } = {}) {
  const batches = await db('inventory_batches')
    .where('remaining_quantity', '>', 0)
    .orderBy('received_date', 'asc')
    .select('id', 'item_id', 'item_name', 'remaining_quantity', 'initial_quantity', 'base_cost_price', 'received_date');

  const now = new Date();
  let totalTiedUpCapital = 0;
  let staleBatches = [];

  for (const b of batches) {
    const received = new Date(b.received_date);
    const ageDays = Math.max(0, Math.floor((now - received) / (1000 * 60 * 60 * 24)));
    const batchValue = Number(b.remaining_quantity) * Number(b.base_cost_price);
    totalTiedUpCapital += batchValue;

    if (ageDays >= staleDaysThreshold) {
      staleBatches.push({
        batchId: b.id,
        itemId: b.item_id,
        itemName: b.item_name,
        remainingQuantity: Number(b.remaining_quantity),
        initialQuantity: Number(b.initial_quantity),
        baseCostPrice: Number(b.base_cost_price),
        baseCostPriceFormatted: formatRupiah(b.base_cost_price),
        tiedUpCapital: batchValue,
        tiedUpCapitalFormatted: formatRupiah(batchValue),
        receivedDate: b.received_date,
        ageInDays: ageDays,
      });
    }
  }

  // Sort stale batches by tiedUpCapital descending (modal tertahan tertinggi lebih dulu)
  staleBatches.sort((a, b) => b.tiedUpCapital - a.tiedUpCapital);

  return {
    staleDaysThreshold,
    totalActiveBatches: batches.length,
    totalTiedUpCapital,
    totalTiedUpCapitalFormatted: formatRupiah(totalTiedUpCapital),
    staleBatchesCount: staleBatches.length,
    staleBatches: staleBatches.slice(0, limit),
  };
}

/**
 * 3. Stock Status & Multi-Unit / Bundle Analysis
 * Memeriksa stok barang, Floating Pool vs Physical Allocation, serta kapasitas bundle
 */
async function getStockStatus({ searchKeyword = '' } = {}) {
  let query = db('items').where('is_active', true);
  if (searchKeyword && searchKeyword.trim().length > 0) {
    query = query.whereILike('name', `%${searchKeyword.trim()}%`);
  }

  const items = await query.select('id', 'name', 'base_unit', 'category').limit(10);

  const results = [];

  for (const item of items) {
    // 1. Total remaining stock from FIFO batches
    const batchRes = await db('inventory_batches')
      .where('item_id', item.id)
      .andWhere('remaining_quantity', '>', 0)
      .sum('remaining_quantity as totalStock')
      .first();

    const totalStock = Number(batchRes?.totalStock || 0);

    // 2. Fetch product units
    const units = await db('product_units')
      .where('item_id', item.id)
      .andWhere('is_active', true)
      .select('id', 'unit_name', 'conversion_factor', 'selling_price', 'stock_mode', 'allocated_stock', 'is_bundle');

    // 3. Format unit details (floating capacity vs physical allocation)
    const formattedUnits = units.map(u => {
      const conv = Number(u.conversion_factor) || 1;
      const isAllocated = u.stock_mode === 'allocated';
      const maxFloatingCapacity = Math.floor(totalStock / conv);

      return {
        unitId: u.id,
        unitName: u.unit_name,
        conversionFactor: conv,
        sellingPrice: Number(u.selling_price),
        sellingPriceFormatted: formatRupiah(u.selling_price),
        stockMode: u.stock_mode || 'floating',
        currentAvailableStock: isAllocated ? Number(u.allocated_stock || 0) : maxFloatingCapacity,
        isBundle: Boolean(u.is_bundle),
      };
    });

    results.push({
      itemId: item.id,
      itemName: item.name,
      baseUnit: item.base_unit,
      category: item.category,
      totalWarehouseStock: totalStock,
      totalWarehouseStockLabel: `${totalStock} ${item.base_unit}`,
      sellingUnits: formattedUnits,
    });
  }

  return {
    searchedKeyword: searchKeyword,
    count: results.length,
    items: results,
  };
}

/**
 * 4. Proactive Business Recommendations
 * Menganalisis dead stock, stok menipis, dan peluang bundling/repackage
 */
async function getBusinessRecommendations() {
  const audit = await getFIFOInventoryAudit({ staleDaysThreshold: 21, limit: 5 });
  const recommendations = [];

  // Analisis 1: Dead Stock / Stale Inventory
  if (audit.staleBatches && audit.staleBatches.length > 0) {
    for (const b of audit.staleBatches) {
      recommendations.push({
        type: 'STALE_STOCK_ACTION',
        priority: b.ageInDays > 45 ? 'HIGH' : 'MEDIUM',
        itemName: b.itemName,
        reason: `Batch barang tersimpan selama ${b.ageInDays} hari dengan modal tertahan ${b.tiedUpCapitalFormatted} (Sisa ${b.remainingQuantity} unit).`,
        actionSuggestion: `Alihkan sebagian stok ke mode 'Physical Allocation' di rak promo, atau jadikan komponen diskon bundling / flash-sale eceran untuk memutar kembali modal kerja.`,
      });
    }
  }

  // Analisis 2: Peringatan Stok Menipis (< 10 base units)
  const lowStockBatches = await db('items')
    .leftJoin('inventory_batches', 'items.id', 'inventory_batches.item_id')
    .where('items.is_active', true)
    .groupBy('items.id', 'items.name', 'items.base_unit')
    .select(
      'items.id',
      'items.name',
      'items.base_unit',
      db.raw('COALESCE(SUM(inventory_batches.remaining_quantity), 0) as total_stock')
    )
    .havingRaw('total_stock <= 15');

  for (const ls of lowStockBatches) {
    const stockVal = Number(ls.total_stock);
    recommendations.push({
      type: 'LOW_STOCK_ALERT',
      priority: stockVal <= 5 ? 'HIGH' : 'MEDIUM',
      itemName: ls.name,
      reason: `Sisa stok di gudang hanya tersisa ${stockVal} ${ls.base_unit}.`,
      actionSuggestion: `Lakukan purchase order (PO) ulang ke supplier sebelum kehabisan stok penjualan.`,
    });
  }

  // Analisis 3: Kapasitas Hampers / Bundling Bottleneck
  const bundles = await db('product_units')
    .where('is_bundle', true)
    .andWhere('is_active', true)
    .select('id', 'item_name', 'unit_name', 'selling_price');

  for (const bundle of bundles) {
    const components = await db('bundle_items')
      .where('bundle_unit_id', bundle.id)
      .select('component_item_id', 'component_item_name', 'quantity_needed');

    if (components.length > 0) {
      let minPossiblePacks = Infinity;
      let bottleneckItem = null;

      for (const comp of components) {
        const stockRes = await db('inventory_batches')
          .where('item_id', comp.component_item_id)
          .sum('remaining_quantity as total')
          .first();
        const available = Number(stockRes?.total || 0);
        const possible = Math.floor(available / Number(comp.quantity_needed));

        if (possible < minPossiblePacks) {
          minPossiblePacks = possible;
          bottleneckItem = {
            name: comp.component_item_name,
            available,
            neededPerPack: comp.quantity_needed,
          };
        }
      }

      if (minPossiblePacks <= 5) {
        recommendations.push({
          type: 'BUNDLE_BOTTLENECK',
          priority: minPossiblePacks === 0 ? 'HIGH' : 'MEDIUM',
          itemName: bundle.unit_name,
          reason: `Kapasitas paket hampers/bundling '${bundle.unit_name}' hanya bisa dirakit ${minPossiblePacks} paket. Pembatas stok (bottleneck): '${bottleneckItem?.name}' (sisa ${bottleneckItem?.available}).`,
          actionSuggestion: `Prioritaskan restock komponen pembatas '${bottleneckItem?.name}' agar paket bundling tetap dapat dijual.`,
        });
      }
    }
  }

  return {
    totalRecommendations: recommendations.length,
    recommendations,
  };
}

module.exports = {
  getFinancialSummary,
  getFIFOInventoryAudit,
  getStockStatus,
  getBusinessRecommendations,
};
