const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "../data/wordnet.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to SQLite3 DB!");
});

// Create table with UNIQUE constraint to prevent duplicate insertions
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT,
      pos TEXT,
      definition TEXT,
      usage TEXT,
      level INTEGER,
      UNIQUE(word, pos, definition, usage)
    )
  `);
});

function parseIndexFile(indexFile, dataFile, pos) {
  const indexPath = path.join(__dirname, "../word_net", indexFile);
  const dataPath = path.join(__dirname, "../word_net", dataFile);

  const indexLines = fs.readFileSync(indexPath, "utf-8").split("\n");
  const dataLines = fs.readFileSync(dataPath, "utf-8").split("\n");

  const dataMap = new Map();
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const offset = line.substring(0, 8).trim();
    dataMap.set(offset, line);
  }

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO words (word, pos, definition, usage, level)
    VALUES (?, ?, ?, ?, ?)
  `);

  let insertedCount = 0;

  for (const line of indexLines) {
    if (!line || line.startsWith(" ")) continue;

    const parts = line.trim().split(/\s+/);
    const word = parts[0].replace(/_/g, " ");
    const synsetOffsets = parts.slice(4);

    for (const offset of synsetOffsets) {
      const dataLine = dataMap.get(offset);
      if (!dataLine) continue;

      let defPart = dataLine.split("|")[1]?.trim() || "";
      const examples = defPart.match(/\".*?\"/g) || [];
      const usage = examples.map(e => e.replace(/\"/g, "")).join(" | ") || null;
      const definition = defPart.replace(/\".*?\"/g, "").trim();
      const level = 3;

      insertStmt.run(word, pos, definition, usage, level);
      insertedCount++;
    }
  }

  insertStmt.finalize();
  console.log(`${pos} words inserted (duplicates ignored): ${insertedCount}`);
}

// Parse all POS files
parseIndexFile("index.noun", "data.noun", "noun");
parseIndexFile("index.verb", "data.verb", "verb");
parseIndexFile("index.adj", "data.adj", "adj");
parseIndexFile("index.adv", "data.adv", "adv");

console.log("SQLite DB created successfully!");
