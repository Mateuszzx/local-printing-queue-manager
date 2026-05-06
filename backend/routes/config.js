const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DEFAULT_CONFIG_DIR = path.join(__dirname, '..', 'config');
const OVERRIDE_CONFIG_DIR = path.join(__dirname, '..', 'metadata', 'config');

const ALLOWED_FILES = new Set([
  'config_printers.json',
  'config_materials.json',
  'config_infill.json',
  'config_infill_type.json',
  'config_statuses.json'
]);

function ensureOverrideDir() {
  fs.mkdirSync(OVERRIDE_CONFIG_DIR, { recursive: true });
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function resolveConfigPath(filename) {
  const overridePath = path.join(OVERRIDE_CONFIG_DIR, filename);
  if (fs.existsSync(overridePath)) return overridePath;
  return path.join(DEFAULT_CONFIG_DIR, filename);
}

router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!ALLOWED_FILES.has(filename)) return res.status(404).json({ error: 'Unknown config file' });

  try {
    const filePath = resolveConfigPath(filename);
    const json = readJsonFile(filePath);
    res.json(json);
  } catch (err) {
    console.error('❌ Failed to read config:', err.message);
    res.status(500).json({ error: 'Failed to read config' });
  }
});

// Update config (persisted in backend/metadata/config, which is volume-mounted)
router.put('/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!ALLOWED_FILES.has(filename)) return res.status(404).json({ error: 'Unknown config file' });

  try {
    ensureOverrideDir();

    const body = req.body;
    if (body === null || body === undefined) return res.status(400).json({ error: 'Missing JSON body' });

    const overridePath = path.join(OVERRIDE_CONFIG_DIR, filename);
    fs.writeFileSync(overridePath, JSON.stringify(body, null, 2) + '\n');
    res.json({ message: 'Config updated', filename });
  } catch (err) {
    console.error('❌ Failed to write config:', err.message);
    res.status(500).json({ error: 'Failed to write config' });
  }
});

module.exports = router;

