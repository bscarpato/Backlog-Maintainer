import Database from "better-sqlite3";
import path from "path";
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

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    throw new Error("Database has not been initialized.");
  }
  return db;
}

export function migrateSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const cols = database.prepare("PRAGMA table_info(backlog_items)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "assignee_id")) {
    database.exec(`
      ALTER TABLE backlog_items ADD COLUMN assignee_id INTEGER REFERENCES team_members(id) ON DELETE SET NULL;
    `);
  }

  // Adiciona updated_at às tabelas existentes se ausente
  const featureCols = database.prepare("PRAGMA table_info(features)").all() as { name: string }[];
  if (!featureCols.some((c) => c.name === "updated_at")) {
    database.exec(`ALTER TABLE features ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';`);
    database.exec(`UPDATE features SET updated_at = created_at;`);
  }
  const itemCols2 = database.prepare("PRAGMA table_info(backlog_items)").all() as { name: string }[];
  if (!itemCols2.some((c) => c.name === "updated_at")) {
    database.exec(`ALTER TABLE backlog_items ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';`);
    database.exec(`UPDATE backlog_items SET updated_at = created_at;`);
  }

  // Migra status das features: 'active' → 'in_progress' e adiciona 'a_iniciar'
  const featureMeta = database
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='features'")
    .get() as { sql: string } | undefined;

  if (featureMeta?.sql.includes("'active'")) {
    database.pragma("foreign_keys = OFF");
    const migrate = database.transaction(() => {
      database.exec(`
        CREATE TABLE features_migrated (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL CHECK (status IN ('a_iniciar', 'in_progress', 'completed', 'archived')) DEFAULT 'a_iniciar',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
      database
        .prepare(
          `INSERT INTO features_migrated (id, title, description, status, created_at, updated_at)
           SELECT id, title, description,
             CASE status WHEN 'active' THEN 'in_progress' ELSE status END,
             created_at, COALESCE(updated_at, created_at)
           FROM features`
        )
        .run();
      database.exec("DROP TABLE features");
      database.exec("ALTER TABLE features_migrated RENAME TO features");
    });
    migrate();
    database.pragma("foreign_keys = ON");
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function initDatabase(userDataPath: string, { seed = true }: { seed?: boolean } = {}): string {
  const isMemory = userDataPath === ":memory:";
  const dbPath = isMemory ? ":memory:" : path.join(userDataPath, "backlog-maintainer.sqlite");
  db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('a_iniciar', 'in_progress', 'completed', 'archived')) DEFAULT 'a_iniciar',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

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

  return dbPath;
}

export function listTeamMembers(): TeamMember[] {
  return getDb()
    .prepare(`SELECT id, name, created_at FROM team_members ORDER BY name COLLATE NOCASE ASC`)
    .all() as TeamMember[];
}

export function createTeamMember(input: CreateTeamMemberInput): { id: number } {
  const result = getDb().prepare(`INSERT INTO team_members (name) VALUES (?)`).run(input.name.trim());
  return { id: Number(result.lastInsertRowid) };
}

export function updateTeamMember(input: UpdateTeamMemberInput): void {
  getDb().prepare(`UPDATE team_members SET name = ? WHERE id = ?`).run(input.name.trim(), input.id);
}

export function deleteTeamMember(id: number): void {
  getDb().prepare(`DELETE FROM team_members WHERE id = ?`).run(id);
}

export function listFeatures(): FeatureSummary[] {
  return getDb()
    .prepare(
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
    )
    .all() as FeatureSummary[];
}

export function getFeatureItems(featureId: number): BacklogItem[] {
  return getDb()
    .prepare(
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
    `
    )
    .all(featureId) as BacklogItem[];
}

export function createFeature(input: CreateFeatureInput): { id: number } {
  const result = getDb()
    .prepare(
      `
      INSERT INTO features (title, description, status)
      VALUES (?, ?, ?)
    `
    )
    .run(input.title, input.description ?? "", input.status ?? "a_iniciar");

  return { id: Number(result.lastInsertRowid) };
}

export function updateFeature(input: UpdateFeatureInput): void {
  getDb()
    .prepare(
      `
      UPDATE features
      SET title = ?, description = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `
    )
    .run(input.title, input.description ?? "", input.status ?? "a_iniciar", input.id);
}

export function deleteFeature(id: number): void {
  getDb().prepare("DELETE FROM features WHERE id = ?").run(id);
}

export function createBacklogItem(input: CreateBacklogItemInput): { id: number } {
  const assigneeId =
    input.assignee_id === undefined || input.assignee_id === null ? null : Number(input.assignee_id);

  const result = getDb()
    .prepare(
      `
      INSERT INTO backlog_items (title, description, status, priority, feature_id, assignee_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      input.title,
      input.description ?? "",
      input.status ?? "todo",
      input.priority ?? "medium",
      input.feature_id,
      assigneeId
    );

  return { id: Number(result.lastInsertRowid) };
}

export function updateBacklogItem(input: UpdateBacklogItemInput): void {
  const assigneeId =
    input.assignee_id === undefined || input.assignee_id === null ? null : Number(input.assignee_id);

  getDb()
    .prepare(
      `
      UPDATE backlog_items
      SET title = ?, description = ?, status = ?, priority = ?, feature_id = ?, assignee_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `
    )
    .run(
      input.title,
      input.description ?? "",
      input.status ?? "todo",
      input.priority ?? "medium",
      input.feature_id,
      assigneeId,
      input.id
    );
}

export function updateBacklogItemStatus(id: number, status: ItemStatus): void {
  getDb().prepare("UPDATE backlog_items SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

export function deleteBacklogItem(id: number): void {
  getDb().prepare("DELETE FROM backlog_items WHERE id = ?").run(id);
}
