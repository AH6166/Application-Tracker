const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeApplicationInput, getStorageMode } = require('../storage');

test('detects postgres mode when DATABASE_URL is configured', () => {
  process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/app_tracker';

  assert.equal(getStorageMode(), 'postgres');

  delete process.env.DATABASE_URL;
});

test('falls back to file-based storage when no database is configured', () => {
  delete process.env.DATABASE_URL;

  assert.equal(getStorageMode(), 'file');
});

test('normalizes a valid application payload for Postgres storage', () => {
  const normalized = normalizeApplicationInput({
    company: '  Acme  ',
    role: 'Senior Engineer',
    dateApplied: '08/06/2026',
    location: ' Seattle ',
    stage: 'Review',
    status: 'Applied'
  });

  assert.equal(normalized.company, 'Acme');
  assert.equal(normalized.role, 'Senior Engineer');
  assert.equal(normalized.dateApplied, '2026-08-06');
  assert.equal(normalized.location, 'Seattle');
  assert.equal(normalized.stage, 'Review');
  assert.equal(normalized.status, 'Applied');
});

test('fills in defaults for missing fields', () => {
  const normalized = normalizeApplicationInput({});

  assert.equal(normalized.company, '');
  assert.equal(normalized.role, '');
  assert.equal(normalized.dateApplied, '');
  assert.equal(normalized.location, '');
  assert.equal(normalized.stage, 'Review');
  assert.equal(normalized.status, 'Applied');
});
