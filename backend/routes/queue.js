const express = require('express');
const { getJobs, deleteJob, updateJobStatus } = require('./sql_base');

const router = express.Router();

router.get('/', (req, res) => {
  getJobs((err, rows) => {
    if (err) {
      console.error('❌ Failed to fetch jobs:', err.message);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }
    res.json(rows);
  });
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  deleteJob(id, (err) => {
    if (err) {
      console.error('❌ Failed to delete job:', err.message);
      return res.status(500).json({ error: 'Failed to delete job' });
    }
    res.json({ message: 'Deleted' });
  });
});

router.post('/:id/status', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  updateJobStatus(id, status, (err) => {
    if (err) {
      console.error('❌ Failed to update job status:', err.message);
      return res.status(500).json({ error: 'Failed to update job status' });
    }
    res.json({ message: 'Status updated successfully' });
  });
});

module.exports = router;
