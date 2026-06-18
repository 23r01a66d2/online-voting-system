const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('polls.db');

db.serialize(() => {
  db.run('DELETE FROM polls');
  db.run('DELETE FROM options');

  db.run('INSERT INTO polls (question) VALUES (?)', ['Who should be the next leader?'], function(err) {
    if (err) return console.error(err.message);
    const poll_id = this.lastID;

    const options = [
      { text: 'Alice Johnson', logo: 'alice.png' },
      { text: 'Bob Smith', logo: 'bob.jpg' }
    ];

    const stmt = db.prepare('INSERT INTO options (poll_id, option_text, logo) VALUES (?, ?, ?)');
    options.forEach(option => {
      stmt.run(poll_id, option.text, option.logo);
    });
    stmt.finalize();
  });
});

db.close();