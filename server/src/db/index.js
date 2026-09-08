import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // RDS requires SSL; rejectUnauthorized: false skips CA verification since we're
  // not bundling AWS's RDS CA cert. Local Postgres has no SSL configured at all.
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});
