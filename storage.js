const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

let postgresClient = null;

function getPgClientClass() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const { Client } = require('pg');
    return Client;
  } catch (error) {
    throw new Error('PostgreSQL support requires the pg package to be installed. Run npm install.');
  }
}

function getStorageMode() {
  return process.env.DATABASE_URL ? 'postgres' : 'file';
}

function normalizeDateValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) {
    return raw;
  }

  const [, month, day, year] = match;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeApplicationInput(data = {}) {
  return {
    company: String(data.company || '').trim(),
    role: String(data.role || '').trim(),
    dateApplied: normalizeDateValue(data.dateApplied),
    location: String(data.location || '').trim(),
    stage: String(data.stage || 'Review').trim() || 'Review',
    status: String(data.status || 'Applied').trim() || 'Applied'
  };
}

function createDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function getStorageFilePath() {
  const dataDir = createDataDir();
  return path.join(dataDir, 'applications.json');
}

async function getPostgresClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!postgresClient) {
    const Client = getPgClientClass();
    if (!Client) {
      return null;
    }

    postgresClient = new Client({ connectionString: process.env.DATABASE_URL });
  }

  if (!postgresClient._connected) {
    await postgresClient.connect();
  }

  return postgresClient;
}

async function ensureApplicationsTable() {
  const client = await getPostgresClient();
  if (!client) return;

  await client.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id UUID PRIMARY KEY,
      company TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      date_applied DATE,
      location TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'Review',
      status TEXT NOT NULL DEFAULT 'Applied',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function readApplicationsFromPostgres() {
  const client = await getPostgresClient();
  if (!client) {
    return [];
  }

  await ensureApplicationsTable();

  const result = await client.query(`
    SELECT
      id,
      company,
      role,
      date_applied AS "dateApplied",
      location,
      stage,
      status
    FROM applications
    ORDER BY created_at DESC
  `);

  return result.rows.map((row) => ({
    id: row.id,
    company: row.company || '',
    role: row.role || '',
    dateApplied: row.dateApplied ? String(row.dateApplied) : '',
    location: row.location || '',
    stage: row.stage || 'Review',
    status: row.status || 'Applied'
  }));
}

async function writeApplicationsToPostgres(applications = []) {
  const client = await getPostgresClient();
  if (!client) {
    return [];
  }

  await ensureApplicationsTable();

  const list = Array.isArray(applications) ? applications : [];

  await client.query('BEGIN');

  try {
    await client.query('DELETE FROM applications');

    for (const application of list) {
      const normalized = normalizeApplicationInput(application);
      await client.query(
        `
          INSERT INTO applications (id, company, role, date_applied, location, stage, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          application.id || randomUUID(),
          normalized.company,
          normalized.role,
          normalized.dateApplied || null,
          normalized.location,
          normalized.stage || 'Review',
          normalized.status || 'Applied'
        ]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  return list;
}

function readApplicationsFromFile() {
  const filePath = getStorageFilePath();

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to read applications data file', error);
    return [];
  }
}

function writeApplicationsToFile(applications) {
  const filePath = getStorageFilePath();
  fs.writeFileSync(filePath, JSON.stringify(applications, null, 2));
}

async function readApplications() {
  if (getStorageMode() === 'postgres') {
    return readApplicationsFromPostgres();
  }

  return readApplicationsFromFile();
}

async function writeApplications(applications) {
  if (getStorageMode() === 'postgres') {
    return writeApplicationsToPostgres(applications);
  }

  writeApplicationsToFile(applications);
  return applications;
}

module.exports = {
  normalizeDateValue,
  normalizeApplicationInput,
  createDataDir,
  getStorageFilePath,
  getStorageMode,
  readApplications,
  writeApplications
};
