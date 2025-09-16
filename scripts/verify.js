const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "../data/wordnet.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to SQLite3 DB!");
});

// Wrap query in a promise for async/await
function lookupWord(word) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT word, pos, definition, usage FROM words WHERE word = ?",
      [word],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// Example usage with async/await
(async () => {
  try {
    const results1 = await lookupWord("oblivious");
    results1.forEach((r) => {
      console.log(`${r.word} (${r.pos}) - ${r.definition} }`);
    });

    const results2 = await lookupWord("whine");
results2.forEach((r) => {
      console.log(`${r.word} (${r.pos}) - ${r.definition} }`);
    });
    const results3 = await lookupWord("necromancer");
results3.forEach((r) => {
      console.log(`${r.word} (${r.pos}) - ${r.definition} }`);
    });  } catch (err) {
    console.error(err);
  }
})();
