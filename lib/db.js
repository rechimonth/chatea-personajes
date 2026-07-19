import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const DB_PATH = process.env.NODE_ENV === "production" ? "/tmp/sqlite.db" : "./sqlite.db";

export function createDatabase() {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error("[db] Failed to open database:", err);
    }
  });

  return db;
}

export function runMigrations(db) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        provider TEXT NOT NULL DEFAULT 'local',
        provider_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        provider TEXT NOT NULL DEFAULT 'stripe',
        provider_subscription_id TEXT,
        current_period_end TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        character_id TEXT NOT NULL,
        date TEXT NOT NULL,
        message_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        tier TEXT NOT NULL,
        avatar TEXT NOT NULL,
        primary_color TEXT NOT NULL,
        secondary_color TEXT NOT NULL,
        description TEXT NOT NULL,
        greeting TEXT NOT NULL,
        tags TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        price_tier TEXT NOT NULL DEFAULT 'free',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON usage_logs(user_id, date)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        character_id TEXT NOT NULL,
        memory TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        importance INTEGER NOT NULL DEFAULT 1,
        times_used INTEGER NOT NULL DEFAULT 0,
        last_used TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_user_character ON memories(user_id, character_id)
    `);
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC, times_used DESC, last_used DESC)
    `);
  });
}

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = createDatabase();
    runMigrations(dbInstance);
  }

  return dbInstance;
}

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user) {
  const payload = { id: user.id, email: user.email };
  const secret = process.env.JWT_SECRET || "chatea-personajes-secret";
  const expiresIn = "7d";

  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "chatea-personajes-secret";

  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}
