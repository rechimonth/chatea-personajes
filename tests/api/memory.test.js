import sqlite3 from "sqlite3";
import {
  extractImportantInformation,
  saveMemory,
  getRelevantMemories,
  listMemories,
  updateMemory,
  deleteMemory,
  mergeSimilarMemories,
  isSimilar,
  computeImportance,
  detectCategory,
  isExtractable,
} from "../../lib/memory-engine.js";

function createMemoryDb() {
  const db = new sqlite3.Database(":memory:");

  db.serialize(() => {
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
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_memories_user_character ON memories(user_id, character_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC, times_used DESC, last_used DESC)`);
  });

  return db;
}

const USER_ID = 1;
const CHARACTER_ID = "sherlock-holmes";

describe("api/memory-engine.js", () => {
  let db;

  beforeEach(() => {
    db = createMemoryDb();
  });

  afterEach(() => {
    db.close();
  });

  test("extractImportantInformation detects name and importance", () => {
    const result = extractImportantInformation("Mi nombre es Juan y vivo en Madrid");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].category).toBe("name");
    expect(result[0].importance).toBeGreaterThanOrEqual(1);
  });

  test("extractImportantInformation returns empty for non-extractable text", () => {
    expect(extractImportantInformation("hola")).toEqual([]);
    expect(extractImportantInformation("ok")).toEqual([]);
  });

  test("saveMemory stores a memory and returns its id", async () => {
    const id = await saveMemory(db, USER_ID, CHARACTER_ID, "Le gusta el té", "preference", 3);
    expect(typeof id).toBe("number");
    expect(id).toBeGreaterThan(0);

    const memories = await getRelevantMemories(db, USER_ID, CHARACTER_ID, 8);
    expect(memories.length).toBe(1);
    expect(memories[0].memory).toBe("Le gusta el té");
    expect(memories[0].importance).toBe(3);
  });

  test("saveMemory avoids duplicates and bumps times_used", async () => {
    const id1 = await saveMemory(db, USER_ID, CHARACTER_ID, "Odio las multitudes", "preference", 4);
    const id2 = await saveMemory(db, USER_ID, CHARACTER_ID, "Odio las multitudes", "preference", 4);

    expect(id1).toBe(id2);

    const memories = await listMemories(db, USER_ID, CHARACTER_ID);
    expect(memories.length).toBe(1);
    expect(memories[0].times_used).toBe(1);
  });

  test("getRelevantMemories orders by importance and limits", async () => {
    await saveMemory(db, USER_ID, CHARACTER_ID, "dato bajo", "general", 1);
    await saveMemory(db, USER_ID, CHARACTER_ID, "dato alto", "general", 5);
    await saveMemory(db, USER_ID, CHARACTER_ID, "dato medio", "general", 3);
    await saveMemory(db, USER_ID, CHARACTER_ID, "extra a", "general", 1);
    await saveMemory(db, USER_ID, CHARACTER_ID, "extra b", "general", 1);
    await saveMemory(db, USER_ID, CHARACTER_ID, "extra c", "general", 1);
    await saveMemory(db, USER_ID, CHARACTER_ID, "extra d", "general", 1);
    await saveMemory(db, USER_ID, CHARACTER_ID, "extra e", "general", 1);
    await saveMemory(db, USER_ID, CHARACTER_ID, "extra f", "general", 1);
    await saveMemory(db, USER_ID, CHARACTER_ID, "extra g", "general", 1);

    const memories = await getRelevantMemories(db, USER_ID, CHARACTER_ID, 8);
    expect(memories.length).toBe(8);
    expect(memories[0].importance).toBe(5);
    expect(memories[1].importance).toBe(3);
    expect(memories[7].importance).toBe(1);
  });

  test("updateMemory modifies fields", async () => {
    const id = await saveMemory(db, USER_ID, CHARACTER_ID, "memoria vieja", "general", 1);
    await updateMemory(db, id, { memory: "memoria nueva", importance: 4 });

    const memories = await listMemories(db, USER_ID, CHARACTER_ID);
    expect(memories[0].memory).toBe("memoria nueva");
    expect(memories[0].importance).toBe(4);
  });

  test("deleteMemory removes a memory", async () => {
    const id = await saveMemory(db, USER_ID, CHARACTER_ID, "borrar esto", "general", 1);
    await deleteMemory(db, id);

    const memories = await listMemories(db, USER_ID, CHARACTER_ID);
    expect(memories.length).toBe(0);
  });

  test("mergeSimilarMemories merges near-duplicates", async () => {
    await saveMemory(db, USER_ID, CHARACTER_ID, "Mi nombre es Juan Perez", "name", 3);
    await saveMemory(db, USER_ID, CHARACTER_ID, "Mi nombre es Juan Pérez", "name", 2);

    const merged = await mergeSimilarMemories(db, USER_ID, CHARACTER_ID);
    expect(merged).toBe(1);

    const memories = await listMemories(db, USER_ID, CHARACTER_ID);
    expect(memories.length).toBe(1);
    expect(memories[0].importance).toBe(3);
  });

  test("isSimilar detects equivalent sentences", () => {
    expect(isSimilar("Mi nombre es Juan", "Mi nombre es Juan")).toBe(true);
    expect(isSimilar("completamente distinto", "otra frase total")).toBe(false);
  });

  test("helpers compute category and importance", () => {
    expect(detectCategory("Mi nombre es Ana")).toBe("name");
    expect(computeImportance("Mi nombre es Ana")).toBeGreaterThan(1);
    expect(isExtractable("quiero aprender a tocar piano")).toBe(true);
    expect(isExtractable("si")).toBe(false);
  });

  test("memories are scoped per user and character", async () => {
    await saveMemory(db, USER_ID, CHARACTER_ID, "secreto A", "general", 2);
    await saveMemory(db, 2, CHARACTER_ID, "secreto B", "general", 2);
    await saveMemory(db, USER_ID, "dracula", "secreto C", "general", 2);

    const memories = await getRelevantMemories(db, USER_ID, CHARACTER_ID, 8);
    expect(memories.length).toBe(1);
    expect(memories[0].memory).toBe("secreto A");
  });
});
