const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static folders
// Config files are served via API to allow runtime overrides.
app.use('/config', require('./routes/config'));
app.use('/storage', express.static(path.join(__dirname, 'storage')));
app.use('/metadata', express.static(path.join(__dirname, 'metadata')));

// ✅ Routes (do NOT double-prefix)
app.use('/api/upload', require('./routes/upload'));
app.use('/api/queue', require('./routes/queue'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/config', require('./routes/config'));

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`🚀 Backend running: http://localhost:${PORT}`);
  console.log(`🌐 Frontend (via docker-compose): http://localhost:4000`);
  console.log(`⚙️  Settings: http://localhost:4000/settings`);
});
