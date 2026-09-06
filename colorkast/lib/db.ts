import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Role } from "@/lib/permissions";

export interface Paint {
  id: number;
  paint_name: string;
  old_number: string;
  new_number: string;
  collection: string;
  r: number;
  g: number;
  b: number;
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: Role;
}

export interface PaletteEntry {
  id: number;
  paint_id: number;
  added_at: string;
  paint_name: string;
  old_number: string;
  new_number: string;
  collection: string;
  r: number;
  g: number;
  b: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "colorkast.db");

function openDatabase(): Database.Database {
  let db: Database.Database | undefined;

  // Singleton per process to survive HMR in dev and shared workloads.
  const g = globalThis as unknown as { __colorkastDb?: Database.Database };
  if (g.__colorkastDb) {
    db = g.__colorkastDb;
  } else {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    g.__colorkastDb = db;
    migrate(db);
  }

  return db as Database.Database;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS paints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paint_name TEXT NOT NULL,
      old_number TEXT NOT NULL UNIQUE,
      new_number TEXT NOT NULL,
      collection TEXT NOT NULL,
      r INTEGER NOT NULL CHECK (r >= 0 AND r <= 255),
      g INTEGER NOT NULL CHECK (g >= 0 AND g <= 255),
      b INTEGER NOT NULL CHECK (b >= 0 AND b <= 255)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('USER','ADMIN_L1','ADMIN_L2','ADMIN_L3'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS palette (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      palette_id TEXT NOT NULL,
      paint_id INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paint_id) REFERENCES paints(id)
    );
  `);
}

export function getDb(): Database.Database {
  return openDatabase();
}

export function purgeStalePaletteEntries(): void {
  // SRS: palette data is private and removed from the server after 30 days.
  openDatabase()
    .prepare("DELETE FROM palette WHERE added_at < datetime('now', '-30 days')")
    .run();
}