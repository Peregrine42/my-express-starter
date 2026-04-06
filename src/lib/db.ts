import pg from "pg";
import { env } from "../env";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return _pool;
}

export async function closePool() {
  await _pool?.end();
  _pool = null;
}
