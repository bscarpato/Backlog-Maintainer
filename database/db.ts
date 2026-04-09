import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";
import path from "path";
import fs from "fs";
import type {
  BacklogItem,
  CreateBacklogItemInput,
  CreateFeatureInput,
  CreateTeamMemberInput,
  FeatureSummary,
  ItemStatus,
  TeamMember,
  UpdateBacklogItemInput,
  UpdateFeatureInput,
  UpdateTeamMemberInput
} from "../shared/types";
import { seedIfEmpty } from "./seed";

let db: SqlJsDatabase | null = null;
let dbFilePath: string | null = null;

function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error("Database has not been initialized.");
  }
  return db;
}

function saveToDisk(): void {
  if (!db || !dbFilePath) return;
  const data = db.export();
  fs.writeFileSync(dbFilePath, Buffer.from(data));
}

/** Executes a SELECT and returns an array of plain objects. */
function queryAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  const stmt = getDb().prepare(sql);
  stmt.bind(params.map(normalizeParam));
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

/** Executes a SELECT and returns the first row or undefined. */
function queryGet<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
  const stmt = getDb().prepare(sql);
  stmt.bind(params.map(normalizeParam));
  let row: T | undefined;
  if (stmt.step()) {
    row = stmt.getAsObject() as T;
  }
  stmt.free();
  return row;
}

/** Normalizes a param value for sql.js (which doesn't accept boolean or undefined). */
function normalizeParam(v: unknown): number | string | Uint8Array | null {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v as number | string | Uint8Array;
}

/** Runs INSERT/UPDATE/DELETE/DDL and returns last_insert_rowid. */
function execute(sql: string, params: unknown[] = []): number {
  getDb().run(sql, params.map(normalizeParam));
  saveToDisk();
  const row = getDb().exec("SELECT last_insert_rowid() AS id");
  return row.length > 0 ? (row[0].values[0][0] as number) : 0;
}

/** Runs DDL or multi-statement SQL (no params, no persistence by default). */
function execRaw(sql: string, persist = false): void {
  getDb().run(sql);
  if (persist) saveToDisk();
}

export function migrateSchema(database: SqlJsDatabase): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const cols = database.exec("PRAGMA table_info(backlog_items)");
  const colNames = cols.length > 0 ? cols[0].values.map((r) => r[1] as string) : [];
  if (!colNames.includes("assignee_id")) {
    database.run(`
      ALTER TABLE backlog_items ADD COLUMN assignee_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL;
    `);
  }

  // Adiciona updated_at às tabelas existentes se ausente
  const featureCols = database.exec("PRAGMA table_info(features)");
  const featureColNames = featureCols.length > 0 ? featureCols[0].values.map((r) => r[1] as string) : [];
  if (!featureColNames.includes("updated_at")) {
    database.run(`ALTER TABLE features ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';`);
    database.run(`UPDATE features SET updated_at = created_at;`);
  }
  const itemCols2 = database.exec("PRAGMA table_info(backlog_items)");
  const itemColNames2 = itemCols2.length > 0 ? itemCols2[0].values.map((r) => r[1] as string) : [];
  if (!itemColNames2.includes("updated_at")) {
    database.run(`ALTER TABLE backlog_items ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';`);
    database.run(`UPDATE backlog_items SET updated_at = created_at;`);
  }

  // Migra status das features: 'active' → 'in_progress' e adiciona 'a_iniciar'
  const featureMeta = database.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='features'");
  const featureMetaSql = featureMeta.length > 0 && featureMeta[0].values.length > 0
    ? (featureMeta[0].values[0][0] as string)
    : "";

  if (featureMetaSql.includes("'active'")) {
    database.run("PRAGMA foreign_keys = OFF");
    try {
      database.run("BEGIN TRANSACTION");
      database.run(`
        CREATE TABLE features_migrated (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL CHECK (status IN ('a_iniciar', 'in_progress', 'completed', 'archived')) DEFAULT 'a_iniciar',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      database.run(`
        INSERT INTO features_migrated (id, title, description, status, created_at, updated_at)
        SELECT id, title, description,
          CASE status WHEN 'active' THEN 'in_progress' ELSE status END,
          created_at, COALESCE(updated_at, created_at)
        FROM features
      `);
      database.run("DROP TABLE features");
      database.run("ALTER TABLE features_migrated RENAME TO features");
      database.run("COMMIT");
    } catch (err) {
      database.run("ROLLBACK");
      throw err;
    }
    database.run("PRAGMA foreign_keys = ON");
  }
}

export function closeDatabase(): void {
  if (db) {
    saveToDisk();
    db.close();
    db = null;
    dbFilePath = null;
  }
}

export async function initDatabase(userDataPath: string, { seed = true }: { seed?: boolean } = {}): Promise<string> {
  const isMemory = userDataPath === ":memory:";
  const dbPath = isMemory ? ":memory:" : path.join(userDataPath, "backlog-maintainer.sqlite");

  const SQL = await initSqlJs();

  if (!isMemory && fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  dbFilePath = isMemory ? null : dbPath;

  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('a_iniciar', 'in_progress', 'completed', 'archived')) DEFAULT 'a_iniciar',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS backlog_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('todo', 'doing', 'done')) DEFAULT 'todo',
      priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
      feature_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(feature_id) REFERENCES features(id) ON DELETE CASCADE
    );
  `);

  migrateSchema(db);

  if (seed) seedIfEmpty(db);

  saveToDisk();

  return dbPath;
}

export function listTeamMembers(): TeamMember[] {
  return queryAll<TeamMember>(`SELECT id, name, created_at FROM team_members ORDER BY name COLLATE NOCASE ASC`);
}

export function createTeamMember(input: CreateTeamMemberInput): { id: number } {
  const id = execute(`INSERT INTO team_members (name) VALUES (?)`, [input.name.trim()]);
  return { id };
}

export function updateTeamMember(input: UpdateTeamMemberInput): void {
  execute(`UPDATE team_members SET name = ? WHERE id = ?`, [input.name.trim(), input.id]);
}

export function deleteTeamMember(id: number): void {
  execute(`DELETE FROM team_members WHERE id = ?`, [id]);
}

export function listFeatures(): FeatureSummary[] {
  return queryAll<FeatureSummary>(
    `
    SELECT
      f.id,
      f.title,
      f.description,
      f.status,
      f.created_at,
      f.updated_at,
      COUNT(b.id) AS item_count,
      COALESCE(SUM(CASE WHEN b.status = 'done' THEN 1 ELSE 0 END), 0) AS done_count,
      CASE
        WHEN COUNT(b.id) = 0 THEN 0
        ELSE ROUND((COALESCE(SUM(CASE WHEN b.status = 'done' THEN 1 ELSE 0 END), 0) * 100.0) / COUNT(b.id))
      END AS progress_percent
    FROM features f
    LEFT JOIN backlog_items b ON b.feature_id = f.id
    GROUP BY f.id
    ORDER BY f.created_at DESC, f.id DESC
  `
  );
}

export function getFeatureItems(featureId: number): BacklogItem[] {
  return queryAll<BacklogItem>(
    `
    SELECT
      b.id,
      b.title,
      b.description,
      b.status,
      b.priority,
      b.feature_id,
      b.assignee_id,
      m.name AS assignee_name,
      b.created_at,
      b.updated_at
    FROM backlog_items b
    LEFT JOIN team_members m ON m.id = b.assignee_id
    WHERE b.feature_id = ?
    ORDER BY b.created_at DESC
  `,
    [featureId]
  );
}

export function createFeature(input: CreateFeatureInput): { id: number } {
  const id = execute(
    `INSERT INTO features (title, description, status) VALUES (?, ?, ?)`,
    [input.title, input.description ?? "", input.status ?? "a_iniciar"]
  );
  return { id };
}

export function updateFeature(input: UpdateFeatureInput): void {
  execute(
    `UPDATE features SET title = ?, description = ?, status = ?, updated_at = datetime('now') WHERE id = ?`,
    [input.title, input.description ?? "", input.status ?? "a_iniciar", input.id]
  );
}

export function deleteFeature(id: number): void {
  execute("DELETE FROM features WHERE id = ?", [id]);
}

export function createBacklogItem(input: CreateBacklogItemInput): { id: number } {
  const assigneeId =
    input.assignee_id === undefined || input.assignee_id === null ? null : Number(input.assignee_id);

  const id = execute(
    `INSERT INTO backlog_items (title, description, status, priority, feature_id, assignee_id) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.description ?? "",
      input.status ?? "todo",
      input.priority ?? "medium",
      input.feature_id,
      assigneeId
    ]
  );

  return { id };
}

export function updateBacklogItem(input: UpdateBacklogItemInput): void {
  const assigneeId =
    input.assignee_id === undefined || input.assignee_id === null ? null : Number(input.assignee_id);

  execute(
    `UPDATE backlog_items SET title = ?, description = ?, status = ?, priority = ?, feature_id = ?, assignee_id = ?, updated_at = datetime('now') WHERE id = ?`,
    [
      input.title,
      input.description ?? "",
      input.status ?? "todo",
      input.priority ?? "medium",
      input.feature_id,
      assigneeId,
      input.id
    ]
  );
}

export function updateBacklogItemStatus(id: number, status: ItemStatus): void {
  execute("UPDATE backlog_items SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id]);
}

export function deleteBacklogItem(id: number): void {
  execute("DELETE FROM backlog_items WHERE id = ?", [id]);
}
