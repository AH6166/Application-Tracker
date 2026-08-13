const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const storage = require('../storage');

const dataDir = path.join(process.cwd(), 'data');
const filePath = path.join(dataDir, 'applications.json');

test('normalizeDateValue handles ISO and mm/dd/yyyy formats and returns raw for unknown formats', () => {
  assert.equal(storage.normalizeDateValue('2026-08-06'), '2026-08-06');
  assert.equal(storage.normalizeDateValue('8/6/2026'), '2026-08-06');
  assert.equal(storage.normalizeDateValue('08-06-2026'), '2026-08-06');
  assert.equal(storage.normalizeDateValue('   '), '');
  assert.equal(storage.normalizeDateValue('not a date'), 'not a date');
});

test('writeApplications/readApplications roundtrip (file mode)', async () => {
  // ensure file-mode (no DATABASE_URL)
  delete process.env.DATABASE_URL;

  // cleanup before
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  if (fs.existsSync(dataDir)) fs.rmdirSync(dataDir, { recursive: true });

  const apps = [
    { company: 'Acme', role: 'Engineer', dateApplied: '2026-08-06', status: 'Applied' }
  ];

  await storage.writeApplications(apps);

  const read = await storage.readApplications();
  assert.equal(Array.isArray(read), true);
  assert.equal(read.length, 1);
  assert.equal(read[0].company, 'Acme');

  // cleanup after
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  if (fs.existsSync(dataDir)) fs.rmdirSync(dataDir, { recursive: true });
});

test('readApplications returns empty array on invalid JSON file', async () => {
  delete process.env.DATABASE_URL;

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(filePath, 'not-json');

  const read = await storage.readApplications();
  assert.equal(Array.isArray(read), true);
  assert.equal(read.length, 0);

  // cleanup
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  if (fs.existsSync(dataDir)) fs.rmdirSync(dataDir, { recursive: true });
});
