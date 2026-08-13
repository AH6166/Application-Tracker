const test = require('node:test');
const assert = require('node:assert/strict');
const { parseApplicationsCsv } = require('../tracker');

test('parses rows with missing columns gracefully', () => {
  const csv = ['company,role,dateApplied', 'Acme,Engineer', 'Beta,Designer,2026-07-01'].join('\n');
  const apps = parseApplicationsCsv(csv);
  assert.equal(apps.length, 2);
  // first row should have empty dateApplied
  assert.equal(apps[0].company, 'Acme');
  assert.equal(apps[0].dateApplied, '');
  // second row should parse dateApplied
  assert.equal(apps[1].company, 'Beta');
  assert.equal(apps[1].dateApplied, '2026-07-01');
});

test('handles header variants (employer/job/title)', () => {
  const csv = [
    'Date,Employer,Job,Status,Location,Link',
    '2026-08-01,Acme,Software Engineer,Rejected,Seattle,https://acme.example'
  ].join('\n');

  const apps = parseApplicationsCsv(csv);
  assert.equal(apps.length, 1);
  assert.equal(apps[0].company, 'Acme');
  assert.equal(apps[0].role, 'Software Engineer');
});
