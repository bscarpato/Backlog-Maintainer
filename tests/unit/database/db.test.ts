/**
 * Database CRUD tests.
 * Each test runs against a fresh in-memory SQLite database so there are no
 * side-effects between tests and no temp files are left on disk.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import {
  closeDatabase,
  createBacklogItem,
  createFeature,
  createTeamMember,
  deleteBacklogItem,
  deleteFeature,
  deleteTeamMember,
  getFeatureItems,
  initDatabase,
  listFeatures,
  listTeamMembers,
  migrateSchema,
  updateBacklogItem,
  updateBacklogItemStatus,
  updateFeature,
  updateTeamMember
} from "../../../database/db";

beforeEach(() => {
  // seed: false ensures no demo data pollutes test assertions
  initDatabase(":memory:", { seed: false });
});

afterEach(() => {
  closeDatabase();
});

// ── Features ──────────────────────────────────────────────────────────────────

describe("createFeature", () => {
  it("returns a positive integer id", () => {
    const { id } = createFeature({ title: "F1", description: "" });
    expect(id).toBeGreaterThan(0);
  });

  it("defaults status to 'a_iniciar'", () => {
    createFeature({ title: "F1", description: "" });
    const [f] = listFeatures();
    expect(f.status).toBe("a_iniciar");
  });

  it("persists the provided status", () => {
    createFeature({ title: "F1", description: "", status: "in_progress" });
    const [f] = listFeatures();
    expect(f.status).toBe("in_progress");
  });

  it("persists title and description", () => {
    createFeature({ title: "My Feature", description: "Some description" });
    const [f] = listFeatures();
    expect(f.title).toBe("My Feature");
    expect(f.description).toBe("Some description");
  });
});

describe("listFeatures", () => {
  it("returns an empty array when there are no features", () => {
    expect(listFeatures()).toHaveLength(0);
  });

  it("returns all created features", () => {
    createFeature({ title: "A", description: "" });
    createFeature({ title: "B", description: "" });
    expect(listFeatures()).toHaveLength(2);
  });

  it("includes item_count = 0 and progress_percent = 0 when no items exist", () => {
    createFeature({ title: "F", description: "" });
    const [f] = listFeatures();
    expect(f.item_count).toBe(0);
    expect(f.done_count).toBe(0);
    expect(f.progress_percent).toBe(0);
  });

  it("computes item_count, done_count, and progress_percent from items", () => {
    const { id: fid } = createFeature({ title: "F", description: "" });
    createBacklogItem({ title: "I1", description: "", feature_id: fid, status: "done" });
    createBacklogItem({ title: "I2", description: "", feature_id: fid, status: "done" });
    createBacklogItem({ title: "I3", description: "", feature_id: fid, status: "todo" });

    const [f] = listFeatures();
    expect(f.item_count).toBe(3);
    expect(f.done_count).toBe(2);
    expect(f.progress_percent).toBe(67); // round(2/3 * 100)
  });

  it("orders features by created_at DESC (most recent first)", () => {
    createFeature({ title: "First", description: "" });
    createFeature({ title: "Second", description: "" });
    const features = listFeatures();
    expect(features[0].title).toBe("Second");
    expect(features[1].title).toBe("First");
  });
});

describe("updateFeature", () => {
  it("updates title, description, and status", () => {
    const { id } = createFeature({ title: "Old", description: "old desc", status: "a_iniciar" });
    updateFeature({ id, title: "New", description: "new desc", status: "completed" });

    const [f] = listFeatures();
    expect(f.title).toBe("New");
    expect(f.description).toBe("new desc");
    expect(f.status).toBe("completed");
  });

  it("populates updated_at on features and items", () => {
    const { id } = createFeature({ title: "F", description: "" });
    const [f] = listFeatures();
    expect(f.updated_at).toBeTruthy();
    expect(f.updated_at).toBe(f.created_at);

    updateFeature({ id, title: "F2", description: "", status: "in_progress" });
    const [f2] = listFeatures();
    expect(f2.updated_at).toBeTruthy();
  });
});

describe("feature status CHECK constraint", () => {
  it("rejects invalid feature status values", () => {
    expect(() => {
      createFeature({ title: "Bad", description: "", status: "invalid" as never });
    }).toThrow();
  });
});

describe("deleteFeature", () => {
  it("removes the feature from the list", () => {
    const { id } = createFeature({ title: "Gone", description: "" });
    deleteFeature(id);
    expect(listFeatures()).toHaveLength(0);
  });

  it("cascades deletion to backlog items (ON DELETE CASCADE)", () => {
    const { id: fid } = createFeature({ title: "Parent", description: "" });
    createBacklogItem({ title: "Child", description: "", feature_id: fid });

    deleteFeature(fid);
    expect(getFeatureItems(fid)).toHaveLength(0);
  });
});

// ── Backlog items ─────────────────────────────────────────────────────────────

describe("createBacklogItem", () => {
  let featureId: number;
  beforeEach(() => {
    featureId = createFeature({ title: "F", description: "" }).id;
  });

  it("returns a positive integer id", () => {
    const { id } = createBacklogItem({ title: "Item", description: "", feature_id: featureId });
    expect(id).toBeGreaterThan(0);
  });

  it("defaults status to 'todo' and priority to 'medium'", () => {
    createBacklogItem({ title: "Item", description: "", feature_id: featureId });
    const [item] = getFeatureItems(featureId);
    expect(item.status).toBe("todo");
    expect(item.priority).toBe("medium");
  });

  it("persists a provided assignee_id and resolves assignee_name via JOIN", () => {
    const { id: memberId } = createTeamMember({ name: "Alice" });
    createBacklogItem({ title: "Item", description: "", feature_id: featureId, assignee_id: memberId });

    const [item] = getFeatureItems(featureId);
    expect(item.assignee_id).toBe(memberId);
    expect(item.assignee_name).toBe("Alice");
  });

  it("stores null assignee when no assignee is given", () => {
    createBacklogItem({ title: "Item", description: "", feature_id: featureId });
    const [item] = getFeatureItems(featureId);
    expect(item.assignee_id).toBeNull();
    expect(item.assignee_name).toBeNull();
  });
});

describe("getFeatureItems", () => {
  let featureId: number;
  beforeEach(() => {
    featureId = createFeature({ title: "F", description: "" }).id;
  });

  it("returns an empty array for a feature with no items", () => {
    expect(getFeatureItems(featureId)).toHaveLength(0);
  });

  it("returns only items that belong to the requested feature", () => {
    const { id: otherId } = createFeature({ title: "Other", description: "" });
    createBacklogItem({ title: "Mine", description: "", feature_id: featureId });
    createBacklogItem({ title: "Other", description: "", feature_id: otherId });

    const items = getFeatureItems(featureId);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Mine");
  });

  it("resolves assignee_name to null for unassigned items", () => {
    createBacklogItem({ title: "Item", description: "", feature_id: featureId });
    const [item] = getFeatureItems(featureId);
    expect(item.assignee_name).toBeNull();
  });
});

describe("updateBacklogItem", () => {
  let featureId: number;
  beforeEach(() => {
    featureId = createFeature({ title: "F", description: "" }).id;
  });

  it("updates all mutable fields", () => {
    const { id } = createBacklogItem({ title: "Old", description: "", feature_id: featureId });
    const { id: memberId } = createTeamMember({ name: "Ana" });

    updateBacklogItem({
      id,
      title: "New",
      description: "updated",
      status: "doing",
      priority: "high",
      feature_id: featureId,
      assignee_id: memberId
    });

    const [item] = getFeatureItems(featureId);
    expect(item.title).toBe("New");
    expect(item.description).toBe("updated");
    expect(item.status).toBe("doing");
    expect(item.priority).toBe("high");
    expect(item.assignee_id).toBe(memberId);
  });

  it("can clear the assignee by setting assignee_id to null", () => {
    const { id: memberId } = createTeamMember({ name: "Ana" });
    const { id } = createBacklogItem({
      title: "Item",
      description: "",
      feature_id: featureId,
      assignee_id: memberId
    });

    updateBacklogItem({ id, title: "Item", description: "", feature_id: featureId, assignee_id: null });
    const [item] = getFeatureItems(featureId);
    expect(item.assignee_id).toBeNull();
  });
});

describe("updateBacklogItemStatus", () => {
  it("updates only the status field, leaving other fields unchanged", () => {
    const fid = createFeature({ title: "F", description: "" }).id;
    const { id } = createBacklogItem({ title: "Task", description: "desc", feature_id: fid });

    updateBacklogItemStatus(id, "done");

    const [item] = getFeatureItems(fid);
    expect(item.status).toBe("done");
    expect(item.title).toBe("Task");
    expect(item.description).toBe("desc");
  });

  it("sets updated_at when status changes", () => {
    const fid = createFeature({ title: "F", description: "" }).id;
    const { id } = createBacklogItem({ title: "Task", description: "", feature_id: fid });

    const [before] = getFeatureItems(fid);
    expect(before.updated_at).toBeTruthy();

    updateBacklogItemStatus(id, "doing");

    const [after] = getFeatureItems(fid);
    expect(after.updated_at).toBeTruthy();
  });
});

describe("deleteBacklogItem", () => {
  it("removes the item from the feature's item list", () => {
    const fid = createFeature({ title: "F", description: "" }).id;
    const { id } = createBacklogItem({ title: "Item", description: "", feature_id: fid });

    expect(getFeatureItems(fid)).toHaveLength(1);
    deleteBacklogItem(id);
    expect(getFeatureItems(fid)).toHaveLength(0);
  });
});

// ── Team members ──────────────────────────────────────────────────────────────

describe("createTeamMember", () => {
  it("returns a positive integer id", () => {
    const { id } = createTeamMember({ name: "Alice" });
    expect(id).toBeGreaterThan(0);
  });

  it("persists the member name", () => {
    createTeamMember({ name: "Alice" });
    const [m] = listTeamMembers();
    expect(m.name).toBe("Alice");
  });
});

describe("listTeamMembers", () => {
  it("returns an empty array when there are no members", () => {
    expect(listTeamMembers()).toHaveLength(0);
  });

  it("returns members sorted alphabetically by name (case-insensitive)", () => {
    createTeamMember({ name: "Zara" });
    createTeamMember({ name: "alice" });
    createTeamMember({ name: "Bob" });

    const names = listTeamMembers().map((m) => m.name);
    expect(names).toEqual(["alice", "Bob", "Zara"]);
  });
});

describe("updateTeamMember", () => {
  it("updates the member's name", () => {
    const { id } = createTeamMember({ name: "Old Name" });
    updateTeamMember({ id, name: "New Name" });

    const [m] = listTeamMembers();
    expect(m.name).toBe("New Name");
  });
});

describe("deleteTeamMember", () => {
  it("removes the member from the list", () => {
    const { id } = createTeamMember({ name: "Alice" });
    deleteTeamMember(id);
    expect(listTeamMembers()).toHaveLength(0);
  });

  it("sets assignee_id to null on associated items (ON DELETE SET NULL)", () => {
    const fid = createFeature({ title: "F", description: "" }).id;
    const { id: memberId } = createTeamMember({ name: "Alice" });
    createBacklogItem({ title: "Item", description: "", feature_id: fid, assignee_id: memberId });

    deleteTeamMember(memberId);

    const [item] = getFeatureItems(fid);
    expect(item.assignee_id).toBeNull();
    expect(item.assignee_name).toBeNull();
  });
});

// ── Schema migration ──────────────────────────────────────────────────────────

describe("migrateSchema", () => {
  it("converts 'active' feature status to 'in_progress'", () => {
    // Build an old-style in-memory DB with the pre-migration schema
    const oldDb = new Database(":memory:");
    oldDb.pragma("foreign_keys = ON");
    oldDb.exec(`
      CREATE TABLE features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE backlog_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        feature_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(feature_id) REFERENCES features(id) ON DELETE CASCADE
      );
    `);
    oldDb.prepare("INSERT INTO features (title, status) VALUES (?, ?)").run("Active Feature", "active");
    oldDb.prepare("INSERT INTO features (title, status) VALUES (?, ?)").run("Done Feature", "completed");

    migrateSchema(oldDb);

    const rows = oldDb.prepare("SELECT status FROM features ORDER BY id").all() as { status: string }[];
    expect(rows[0].status).toBe("in_progress");
    expect(rows[1].status).toBe("completed"); // unchanged

    oldDb.close();
  });

  it("creates the team_members table when it is missing", () => {
    const freshDb = new Database(":memory:");
    freshDb.exec(`
      CREATE TABLE features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'a_iniciar',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE backlog_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        feature_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(feature_id) REFERENCES features(id) ON DELETE CASCADE
      );
    `);

    migrateSchema(freshDb);

    const table = freshDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='team_members'")
      .get();
    expect(table).toBeDefined();

    freshDb.close();
  });

  it("adds assignee_id column to backlog_items when it is missing", () => {
    const freshDb = new Database(":memory:");
    freshDb.exec(`
      CREATE TABLE features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'a_iniciar',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE backlog_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        feature_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(feature_id) REFERENCES features(id) ON DELETE CASCADE
      );
    `);

    migrateSchema(freshDb);

    const cols = freshDb.prepare("PRAGMA table_info(backlog_items)").all() as { name: string }[];
    expect(cols.some((c) => c.name === "assignee_id")).toBe(true);

    freshDb.close();
  });
});
