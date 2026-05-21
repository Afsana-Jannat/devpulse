import { neon } from "@neondatabase/serverless"
import config from "../config"

export const sql = neon(config.database_url)

export const initDB = async () => {
    await sql`
    CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20)
    CHECK(role IN('contributor','maintainer'))
    DEFAULT 'contributor',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    `

    await sql`
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
    `
    console.log("Database connected");
}