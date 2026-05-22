import { Pool } from "pg"
import config from "../config"

export const pool = new Pool({
    connectionString: config.database_url,
})

export const initDB = async () => {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(75) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20)
    CHECK(role IN('contributor','maintainer'))
    DEFAULT 'contributor',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `)

    await pool.query(`
    CREATE TABLE IF NOT EXISTS issues(
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30)
    CHECK(type IN('bug','feature_request'))
    NOT NULL,

    status VARCHAR(30)
    CHECK(status IN('open', 'in_progress', 'resolved'))
    DEFAULT 'open',

    reporter_id INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `)
    // console.log("Database connected");
    await pool.query(`
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
    DROP TRIGGER IF EXISTS issues_updated_at ON issues;

   CREATE TRIGGER issues_updated_at
   BEFORE UPDATE ON issues
   FOR EACH ROW
   EXECUTE FUNCTION update_timestamp();
   `);
}
