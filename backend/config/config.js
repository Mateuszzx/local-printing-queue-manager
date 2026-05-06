const path = require('path');
const fs = require('fs');

const configDir = path.join(__dirname);

function loadConfig(filename) {
  const filePath = path.join(configDir, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

module.exports = {
  getPrinters: () => loadConfig('config_printers.json'),
  getMaterials: () => loadConfig('config_materials.json'),
  getInfill: () => loadConfig('config_infill.json'),
  getInfillTypes: () => loadConfig('config_infill_type.json'),
  getStatuses: () => loadConfig('config_statuses.json'),
};
