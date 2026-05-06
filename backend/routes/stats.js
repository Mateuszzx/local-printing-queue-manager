const express = require('express');
const fs = require('fs');
const path = require('path');
const { getJobs } = require('./sql_base');
const router = express.Router();

const metadataDir = path.join(__dirname, '..', 'metadata');

function loadQueue() {
  if (!fs.existsSync(metadataDir)) return [];
  return fs.readdirSync(metadataDir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const raw = fs.readFileSync(path.join(metadataDir, file), 'utf-8');
      return JSON.parse(raw);
    });
}

function formatChart(obj) {
  return {
    labels: Object.keys(obj),
    datasets: [{

      data: Object.values(obj),
      backgroundColor: [
        '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
      ]
    }]
  };
}

// GET /api/stats
router.get('/', (req, res) => {
  getJobs((err, jobs) => {
    if (err) {
      console.error('❌ Failed to fetch jobs:', err.message);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    const groupBy = (key) =>
      jobs.reduce((acc, job) => {
        acc[job[key]] = (acc[job[key]] || 0) + 1;
        return acc;
      }, {});

    const stats = {
      total_jobs: jobs.length,
      average_file_size_mb: +(jobs.reduce((sum, j) => sum + (j.file_size_mb || 0), 0) / jobs.length || 0).toFixed(2),
      latest_job: jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null,

      jobsByPrinter: formatChart(groupBy('printer')),
      jobsByMaterial: formatChart(groupBy('material')),
      jobsByStatus: formatChart(groupBy('status'))
    };

    res.json(stats);
  });
});

module.exports = router;
