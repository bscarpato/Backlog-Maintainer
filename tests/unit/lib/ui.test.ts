import { describe, expect, it } from "vitest";
import {
  FEATURE_STATUS_BADGE,
  FEATURE_STATUS_BORDER_COLOR,
  KANBAN_COL,
  PRIORITY_BADGE,
  PRIORITY_BORDER_COLOR,
  avatarBg,
  nameInitials
} from "../../../renderer/src/lib/ui";
import type { FeatureStatus, ItemPriority, ItemStatus } from "../../../shared/types";

// ── nameInitials ──────────────────────────────────────────────────────────────

describe("nameInitials", () => {
  it("returns the first letter for a single-word name", () => {
    expect(nameInitials("Alice")).toBe("A");
  });

  it("returns two initials for a first-and-last name", () => {
    expect(nameInitials("Alice Smith")).toBe("AS");
  });

  it("caps at two initials even with many words", () => {
    expect(nameInitials("John Michael Doe")).toBe("JM");
  });

  it("uppercases the result", () => {
    expect(nameInitials("alice smith")).toBe("AS");
  });

  it("handles leading/trailing whitespace", () => {
    expect(nameInitials("  Alice  Smith  ")).toBe("AS");
  });

  it("returns an empty string for an empty input", () => {
    expect(nameInitials("")).toBe("");
  });

  it("handles a single character name", () => {
    expect(nameInitials("X")).toBe("X");
  });
});

// ── avatarBg ──────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-600",
  "bg-cyan-600",
  "bg-teal-500",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-pink-500"
];

describe("avatarBg", () => {
  it("returns a class that belongs to the colour palette", () => {
    expect(AVATAR_PALETTE).toContain(avatarBg("Alice"));
  });

  it("is deterministic: the same name always returns the same class", () => {
    expect(avatarBg("Alice")).toBe(avatarBg("Alice"));
    expect(avatarBg("Bruno Costa")).toBe(avatarBg("Bruno Costa"));
  });

  it("produces different colours for different names", () => {
    const names = ["Alice", "Bruno", "Carla", "Diego", "Elena", "Fábio", "Gabi", "Hugo", "Iris", "João"];
    const unique = new Set(names.map(avatarBg));
    expect(unique.size).toBeGreaterThan(1);
  });

  it("handles an empty string without throwing", () => {
    expect(() => avatarBg("")).not.toThrow();
    expect(AVATAR_PALETTE).toContain(avatarBg(""));
  });
});

// ── Constant completeness ─────────────────────────────────────────────────────

describe("FEATURE_STATUS_BADGE", () => {
  const allStatuses: FeatureStatus[] = ["a_iniciar", "in_progress", "completed", "archived"];

  it("has an entry for every FeatureStatus value", () => {
    for (const s of allStatuses) {
      expect(FEATURE_STATUS_BADGE[s], `missing entry for "${s}"`).toBeDefined();
    }
  });

  it("every entry has a non-empty label and className", () => {
    for (const s of allStatuses) {
      expect(FEATURE_STATUS_BADGE[s].label).toBeTruthy();
      expect(FEATURE_STATUS_BADGE[s].className).toBeTruthy();
    }
  });
});

describe("FEATURE_STATUS_BORDER_COLOR", () => {
  const allStatuses: FeatureStatus[] = ["a_iniciar", "in_progress", "completed", "archived"];

  it("has a hex colour for every FeatureStatus value", () => {
    for (const s of allStatuses) {
      expect(FEATURE_STATUS_BORDER_COLOR[s]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("PRIORITY_BADGE", () => {
  const allPriorities: ItemPriority[] = ["low", "medium", "high"];

  it("has an entry for every ItemPriority value", () => {
    for (const p of allPriorities) {
      expect(PRIORITY_BADGE[p], `missing entry for "${p}"`).toBeDefined();
    }
  });

  it("every entry has a non-empty label and className", () => {
    for (const p of allPriorities) {
      expect(PRIORITY_BADGE[p].label).toBeTruthy();
      expect(PRIORITY_BADGE[p].className).toBeTruthy();
    }
  });
});

describe("PRIORITY_BORDER_COLOR", () => {
  const allPriorities: ItemPriority[] = ["low", "medium", "high"];

  it("has a hex colour for every ItemPriority value", () => {
    for (const p of allPriorities) {
      expect(PRIORITY_BORDER_COLOR[p]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("KANBAN_COL", () => {
  const allStatuses: ItemStatus[] = ["todo", "doing", "done"];

  it("has an entry for every ItemStatus value", () => {
    for (const s of allStatuses) {
      expect(KANBAN_COL[s], `missing entry for "${s}"`).toBeDefined();
    }
  });

  it("every entry has required display properties", () => {
    for (const s of allStatuses) {
      const col = KANBAN_COL[s];
      expect(col.label).toBeTruthy();
      expect(col.bg).toBeTruthy();
      expect(col.overBg).toBeTruthy();
      expect(col.headText).toBeTruthy();
      expect(col.dot).toBeTruthy();
      expect(col.countBg).toBeTruthy();
    }
  });
});
