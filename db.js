const initSqlJs = require('sql.js');
const path = require('path');

let db = null;
let SQL = null;

async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();
  
  const dbPath = path.join('/tmp', 'database.sqlite');
  try {
    const fs = require('fs');
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
  } catch {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  return db;
}

function saveDb() {
  try {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    const fs = require('fs');
    const dbPath = path.join('/tmp', 'database.sqlite');
    fs.writeFileSync(dbPath, buffer);
  } catch {
    // ignore - in-memory only is fine
  }
}

const database = {
  run(sql, params, callback) {
    getDb().then(() => {
      try {
        db.run(sql, params);
        const result = db.exec("SELECT last_insert_rowid() as id");
        const lastID = result.length > 0 ? result[0].values[0][0] : 0;
        saveDb();
        callback.call({ lastID }, null);
      } catch (err) {
        callback(err);
      }
    }).catch(callback);
  },

  get(sql, params, callback) {
    getDb().then(() => {
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const columns = stmt.getColumnNames();
          const values = stmt.get();
          const row = {};
          columns.forEach((col, i) => { row[col] = values[i]; });
          stmt.free();
          callback(null, row);
        } else {
          stmt.free();
          callback(null, null);
        }
      } catch (err) {
        callback(err);
      }
    }).catch(callback);
  }
};

module.exports = database;
