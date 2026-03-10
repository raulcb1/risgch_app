// ris-gran-chimu-backend/lib/db.ts
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
    pool = mysql.createPool(config);
  }
  return pool;
}

export async function getDbConnection() {
  // Deprecated: use query() directly which uses the pool
  // But for compatibility, we return the pool which has same interface for query/execute
  return getDbPool();
}

// para usar directamente en los handlers
export async function query(sql: string, params?: any[]) {
  const p = getDbPool();
  // Using query instead of execute to support bulk inserts
  const [results] = await p.query(sql, params);
  return results;
}