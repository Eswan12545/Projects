const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function ensureFile(name, defaultValue) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify(defaultValue, null, 2));
  }
  return fp;
}

/**
 * Read JSON file, returns defaultValue if not exists / invalid.
 */
function read(name, defaultValue = {}) {
  const fp = ensureFile(name, defaultValue);
  try {
    const raw = fs.readFileSync(fp, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[jsonDB] Error reading ${name}:`, err.message);
    return defaultValue;
  }
}

/**
 * Write JSON file (atomic-ish: write to tmp then rename).
 */
function write(name, data) {
  const fp = filePath(name);
  const tmp = `${fp}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, fp);
  return data;
}

/**
 * Update via a mutator function, then persist. Returns updated data.
 */
function update(name, defaultValue, mutatorFn) {
  const current = read(name, defaultValue);
  const updated = mutatorFn(current) || current;
  write(name, updated);
  return updated;
}

module.exports = { read, write, update, DATA_DIR };
