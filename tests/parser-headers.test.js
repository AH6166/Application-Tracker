const test = require('node:test');
const assert = require('node:assert/strict');
const { parseApplicationsCsv } = require('../tracker');

test('parses Excel-like headers including Job and Link', () => {
  const csv = [
    'Date,Company,Job,Status,Location,Link',
    '2026-08-01,Acme,Software Engineer,Rejected,Seattle,https://acme.example'
  ].join('\n');

  const applications = parseApplicationsCsv(csv);
  assert.equal(applications.length, 1);
  assert.equal(applications[0].company, 'Acme');
  assert.equal(applications[0].role, 'Software Engineer');
  assert.equal(applications[0].status, 'Rejected');
  assert.equal(applications[0].location, 'Seattle');
  assert.equal(applications[0].source, 'https://acme.example');
});
