import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "orders.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        customer_email TEXT,
        amount_total INTEGER,
        currency TEXT,
        line_items TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }
  return _db;
}

export function insertOrder(order: {
  session_id: string;
  customer_email: string;
  amount_total: number;
  currency: string;
  line_items: object;
}) {
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO orders
      (session_id, customer_email, amount_total, currency, line_items)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    order.session_id,
    order.customer_email,
    order.amount_total,
    order.currency,
    JSON.stringify(order.line_items)
  );
}
