const path = require('path');
const fs = require('fs');

// Use the correct path to the metadata folder
const metadataDir = path.resolve(__dirname, '../metadata'); // Adjusted to point to the root-level metadata folder
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir);
  console.log('Created metadata directory:', metadataDir);
}

// Update the database path to the correct metadata folder
const dbPath = path.join(metadataDir, 'queue.db');
console.log('Database path:', dbPath);

// Initialize the SQLite database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database at:', dbPath);
  }
});

// Create the `queue` table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS queue (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT,
      file_size_mb REAL,
      printer TEXT,
      material TEXT,
      infill TEXT,
      infill_type TEXT,
      supports INTEGER,
      perimeters INTEGER,
      description TEXT,
      status TEXT,
      created_at TEXT
    )
  `, (err) => {
    if (err) {
      console.error('❌ Failed to create `queue` table:', err.message);
    } else {
      console.log('✅ `queue` table is ready');
    }
  });
});

// Function to add a job to the queue
function addJob(job, callback) {
  const query = `
    INSERT INTO queue (
      id, filename, original_name, file_size_mb, printer, material, infill,
      infill_type, supports, perimeters, description, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    job.id, job.filename, job.original_name, job.file_size_mb, job.printer,
    job.material, job.infill, job.infill_type, job.supports ? 1 : 0,
    job.perimeters, job.description, job.status, job.created_at
  ];
  db.run(query, params, callback);
}

// Function to get all jobs from the queue
function getJobs(callback) {
  const query = `SELECT * FROM queue`;
  db.all(query, [], callback);
}

// Function to delete a job by ID
function deleteJob(id, callback) {
  const query = `DELETE FROM queue WHERE id = ?`;
  db.run(query, [id], callback);
}

// Function to update the status of a job
function updateJobStatus(id, status, callback) {
  const query = `UPDATE queue SET status = ? WHERE id = ?`;
  db.run(query, [status, id], callback);
}

// Export the database and utility functions
module.exports = {
  db,
  addJob,
  getJobs,
  deleteJob,
  updateJobStatus
};