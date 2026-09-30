const knex = require('knex');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.POS_DB_PATH 
  ? path.resolve(process.env.POS_DB_PATH) 
  : path.resolve(__dirname, '../../POS/database/pos.db');

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
    // read-only mode to guarantee zero accidental modification to POS transactions
    readonly: true,
  },
  useNullAsDefault: true,
});

module.exports = db;
