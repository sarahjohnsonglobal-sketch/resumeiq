let nextId = 1;
const users = [];

const database = {
  run(sql, params, callback) {
    try {
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const existing = users.find(u => u.email === params[1] || u.username === params[0]);
        if (existing) {
          const err = new Error('UNIQUE constraint failed');
          return callback(err);
        }
        const user = {
          id: nextId++,
          username: params[0],
          email: params[1],
          password_hash: params[2],
          created_at: new Date().toISOString()
        };
        users.push(user);
        callback.call({ lastID: user.id }, null);
      }
    } catch (err) {
      callback(err);
    }
  },

  get(sql, params, callback) {
    try {
      const email = params[0];
      const user = users.find(u => u.email === email);
      callback(null, user || null);
    } catch (err) {
      callback(err);
    }
  }
};

module.exports = database;
