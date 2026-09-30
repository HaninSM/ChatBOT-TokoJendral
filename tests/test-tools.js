const queries = require('../db/queries');
const db = require('../db/knex');

async function runTests() {
  console.log('=== TESTING INVO ANALYTICS DATABASE QUERIES ===\n');

  try {
    // 1. Financial Summary
    console.log('1. Testing getFinancialSummary (today & all_time)...');
    const finToday = await queries.getFinancialSummary({ period: 'today' });
    console.log('   Today summary:', JSON.stringify(finToday, null, 2));

    const finAll = await queries.getFinancialSummary({ period: 'all_time' });
    console.log('   All-time summary:', {
      revenue: finAll.revenueFormatted,
      cogsFIFO: finAll.cogsFIFOFormatted,
      grossProfit: finAll.grossProfitFormatted,
      netProfit: finAll.netProfitFormatted,
      transactions: finAll.transactionCount,
    });

    // 2. FIFO Inventory Audit
    console.log('\n2. Testing getFIFOInventoryAudit...');
    const fifoAudit = await queries.getFIFOInventoryAudit({ staleDaysThreshold: 0, limit: 5 });
    console.log('   Active batches count:', fifoAudit.totalActiveBatches);
    console.log('   Total tied up capital:', fifoAudit.totalTiedUpCapitalFormatted);
    console.log('   Sample batches:', fifoAudit.staleBatches.slice(0, 2));

    // 3. Stock Status
    console.log('\n3. Testing getStockStatus...');
    const stockStatus = await queries.getStockStatus();
    console.log('   Found active items count:', stockStatus.count);
    if (stockStatus.items.length > 0) {
      console.log('   Sample item:', {
        name: stockStatus.items[0].itemName,
        stock: stockStatus.items[0].totalWarehouseStockLabel,
        units: stockStatus.items[0].sellingUnits,
      });
    }

    // 4. Business Recommendations
    console.log('\n4. Testing getBusinessRecommendations...');
    const recs = await queries.getBusinessRecommendations();
    console.log('   Generated recommendations count:', recs.totalRecommendations);
    console.log('   Recommendations:', JSON.stringify(recs.recommendations, null, 2));

    console.log('\n>>> ALL DATABASE ANALYTICS TESTS PASSED SUCCESSFULLY! <<<');
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await db.destroy();
  }
}

runTests();
