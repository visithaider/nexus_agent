import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      version INT DEFAULT 1,
      nodes JSONB DEFAULT '[]',
      edges JSONB DEFAULT '[]',
      mcp_servers JSONB DEFAULT '{}',
      skills JSONB DEFAULT '{}',
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      input TEXT,
      output TEXT,
      status TEXT DEFAULT 'success',
      latency INT,
      tokens INT DEFAULT 0,
      logs JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      UNIQUE(agent_id, key)
    );

    CREATE TABLE IF NOT EXISTS versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
      version INT NOT NULL,
      snapshot JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log("Database ready");
}
