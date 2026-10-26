import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'intern_automation.db');
const db = new DatabaseSync(DB_PATH);

// Initialize schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS interns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      current_task_id INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT NOT NULL, -- JSON array string
      expected_output TEXT NOT NULL,
      tech_stack TEXT NOT NULL,
      reference_url TEXT,
      review_duration_mins INTEGER DEFAULT 30,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intern_email TEXT NOT NULL,
      task_id INTEGER NOT NULL,
      allocation_date TEXT NOT NULL,
      review_date TEXT NOT NULL,
      review_time TEXT NOT NULL,
      meet_link TEXT NOT NULL,
      internship_end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ALLOCATED',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (intern_email) REFERENCES interns(email),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      allocation_id INTEGER NOT NULL,
      intern_email TEXT NOT NULL,
      task_id INTEGER NOT NULL,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      review_date TEXT NOT NULL,
      review_time TEXT NOT NULL,
      meet_link TEXT NOT NULL,
      submission_type TEXT DEFAULT 'TEXT',
      submission_content TEXT,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      ai_analysis_json TEXT,
      human_decision TEXT DEFAULT 'PENDING',
      human_feedback TEXT,
      next_review_date TEXT,
      next_review_time TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (allocation_id) REFERENCES allocations(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS task_explanations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      intern_email TEXT NOT NULL,
      mentor_content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      event_type TEXT NOT NULL,
      event_fingerprint TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      body_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SENT_MOCK',
      error_message TEXT,
      sent_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  console.log(`[Database] SQLite initialized at ${DB_PATH}`);
}

export default db;
