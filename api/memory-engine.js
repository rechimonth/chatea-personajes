const CATEGORY_PATTERNS = [
  {
    category: "name",
    patterns: [
      /\bmi nombre es\b|\bme llamo\b|\bsoy (?:el|la)\b/i,
      /\bmy name is\b|\bi am\b/i,
    ],
  },
  {
    category: "preference",
    patterns: [
      /\b(prefer|prefiero|me gusta|me encanta|odio|detesto|no me gusta)\b/i,
      /\b(like|love|hate|enjoy|dislike)\b/i,
    ],
  },
  {
    category: "fact",
    patterns: [
      /\b(tengo|soy|vivo|trabajo|estudio|naci)\b/i,
      /\b(i am|i have|i live|i work|i study|i was born)\b/i,
    ],
  },
  {
    category: "goal",
    patterns: [
      /\b(quiero|necesito|espero|mi objetivo|mi meta)\b/i,
      /\b(i want|i need|i hope|my goal)\b/i,
    ],
  },
  {
    category: "emotion",
    patterns: [
      /\b(estoy|me siento|feliz|triste|enojado|ansioso|solo)\b/i,
      /\b(i feel|i am feeling|happy|sad|angry|anxious|lonely)\b/i,
    ],
  },
];

const IMPORTANCE_KEYWORDS = [
  "nombre",
  "name",
  "importante",
  "important",
  "odio",
  "hate",
  "me encanta",
  "love",
  "objetivo",
  "goal",
  "meta",
  "trabajo",
  "work",
  "familia",
  "family",
];

function promisifyGet(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function promisifyAll(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function promisifyRun(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

export function detectCategory(message = "") {
  for (const { category, patterns } of CATEGORY_PATTERNS) {
    if (patterns.some((re) => re.test(message))) {
      return category;
    }
  }
  return "general";
}

export function computeImportance(message = "") {
  let score = 1;
  const lower = message.toLowerCase();

  if (lower.length >= 40) score += 1;

  if (IMPORTANCE_KEYWORDS.some((kw) => lower.includes(kw))) {
    score += 1;
  }

  if (/\b(nombre|name|objetivo|goal|meta|importante|important)\b/i.test(message)) {
    score += 1;
  }

  return Math.min(score, 5);
}

export function isExtractable(message = "") {
  if (typeof message !== "string") return false;
  const trimmed = message.trim();
  if (trimmed.length < 8) return false;
  if (trimmed.split(/\s+/).length < 3) return false;

  return CATEGORY_PATTERNS.some(({ patterns }) =>
    patterns.some((re) => re.test(trimmed))
  );
}

export function extractImportantInformation(message = "") {
  if (!isExtractable(message)) return [];

  const category = detectCategory(message);
  const importance = computeImportance(message);
  const memory = message.trim().replace(/\s+/g, " ").slice(0, 500);

  return [{ memory, category, importance }];
}

export async function saveMemory(db, userId, characterId, memory, category = "general", importance = 1) {
  if (!db || !userId || !characterId || !memory) {
    throw new Error("[memory-engine] userId, characterId and memory are required");
  }

  const existing = await promisifyGet(
    db,
    "SELECT * FROM memories WHERE user_id = ? AND character_id = ? AND memory = ? LIMIT 1",
    [userId, characterId, memory]
  );

  if (existing) {
    await promisifyRun(
      db,
      "UPDATE memories SET times_used = times_used + 1, updated_at = datetime('now') WHERE id = ?",
      [existing.id]
    );
    return existing.id;
  }

  const result = await promisifyRun(
    db,
    "INSERT INTO memories (user_id, character_id, memory, category, importance) VALUES (?, ?, ?, ?, ?)",
    [userId, characterId, memory, category, importance]
  );

  return result.lastID;
}

export async function getRelevantMemories(db, userId, characterId, limit = 8) {
  if (!db || !userId || !characterId) {
    throw new Error("[memory-engine] userId and characterId are required");
  }

  const rows = await promisifyAll(
    db,
    `SELECT * FROM memories
     WHERE user_id = ? AND character_id = ?
     ORDER BY importance DESC, times_used DESC, last_used DESC, created_at DESC
     LIMIT ?`,
    [userId, characterId, limit]
  );

  return rows;
}

export async function updateMemory(db, id, updates = {}) {
  if (!db || !id) {
    throw new Error("[memory-engine] id is required");
  }

  const fields = [];
  const params = [];

  if (typeof updates.memory === "string") {
    fields.push("memory = ?");
    params.push(updates.memory);
  }
  if (typeof updates.category === "string") {
    fields.push("category = ?");
    params.push(updates.category);
  }
  if (typeof updates.importance === "number") {
    fields.push("importance = ?");
    params.push(updates.importance);
  }

  if (fields.length === 0) return false;

  fields.push("updated_at = datetime('now')");
  params.push(id);

  await promisifyRun(
    db,
    `UPDATE memories SET ${fields.join(", ")} WHERE id = ?`,
    params
  );

  return true;
}

export async function deleteMemory(db, id) {
  if (!db || !id) {
    throw new Error("[memory-engine] id is required");
  }

  await promisifyRun(db, "DELETE FROM memories WHERE id = ?", [id]);
  return true;
}

export async function listMemories(db, userId, characterId) {
  if (!db || !userId || !characterId) {
    throw new Error("[memory-engine] userId and characterId are required");
  }

  return promisifyAll(
    db,
    `SELECT * FROM memories
     WHERE user_id = ? AND character_id = ?
     ORDER BY importance DESC, times_used DESC, created_at DESC`,
    [userId, characterId]
  );
}

export async function touchMemories(db, ids = []) {
  if (!db || !Array.isArray(ids) || ids.length === 0) return;

  for (const id of ids) {
    if (typeof id !== "number") continue;
    await promisifyRun(
      db,
      "UPDATE memories SET times_used = times_used + 1, last_used = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  }
}

export async function mergeSimilarMemories(db, userId, characterId) {
  if (!db || !userId || !characterId) {
    throw new Error("[memory-engine] userId and characterId are required");
  }

  const rows = await promisifyAll(
    db,
    "SELECT * FROM memories WHERE user_id = ? AND character_id = ?",
    [userId, characterId]
  );

  let merged = 0;
  const seen = [];

  for (const row of rows) {
    const duplicate = seen.find((other) => other.id !== row.id && isSimilar(row.memory, other.memory));
    if (duplicate) {
      const newImportance = Math.max(row.importance, duplicate.importance);
      await promisifyRun(
        db,
        "UPDATE memories SET importance = ?, times_used = times_used + ? WHERE id = ?",
        [newImportance, row.times_used, duplicate.id]
      );
      await promisifyRun(db, "DELETE FROM memories WHERE id = ?", [row.id]);
      duplicate.memory = duplicate.memory;
      duplicate.importance = newImportance;
      duplicate.times_used += row.times_used;
      merged += 1;
    } else {
      seen.push(row);
    }
  }

  return merged;
}

function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSimilar(a = "", b = "") {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;

  const tokensA = new Set(na.split(" "));
  const tokensB = new Set(nb.split(" "));
  if (tokensA.size === 0 || tokensB.size === 0) return false;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection += 1;
  }

  const jaccard = intersection / (tokensA.size + tokensB.size - intersection);
  return jaccard >= 0.7;
}
