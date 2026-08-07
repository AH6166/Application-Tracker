const test = require('node:test');
const assert = require('node:assert/strict');
const { parseApplicationsCsv, createApplication, updateApplication, deleteApplication, filterApplications } = require('../tracker');

test('parses a simple CSV export into applications', () => {
  const csv = [
    'company,role,dateApplied,status,location,source',
    'Acme,Software Engineer,2026-08-01,Applied,Seattle,LinkedIn',
    'Globex,Product Manager,2026-07-15,Interviewing,Remote,Referral'
  ].join('\n');

  const applications = parseApplicationsCsv(csv);
  assert.equal(applications.length, 2);
  assert.equal(applications[0].company, 'Acme');
  assert.equal(applications[0].status, 'Applied');
  assert.equal(applications[1].location, 'Remote');
});

test('creates, updates, deletes, and filters applications', () => {
  let applications = [];

  const created = createApplication(applications, {
    company: 'Contour',
    role: 'Designer',
    dateApplied: '2026-08-06',
    status: 'Applied',
    location: 'Austin',
    source: 'Indeed'
  });

  applications = [created];
  assert.equal(applications.length, 1);

  applications = updateApplication(applications, created.id, { status: 'Interviewing' });
  assert.equal(applications[0].status, 'Interviewing');

  applications = deleteApplication(applications, created.id);
  assert.equal(applications.length, 0);

  applications = [
    createApplication([], { company: 'A', role: 'r1', dateApplied: '2026-01-01', status: 'Applied' }),
    createApplication([], { company: 'B', role: 'r2', dateApplied: '2026-01-02', status: 'Rejected' })
  ];

  const filtered = filterApplications(applications, 'Rejected');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].company, 'B');

  const filteredByStatusAndQuery = filterApplications(
    [
      createApplication([], { company: 'Acme', role: 'Engineer', dateApplied: '2026-01-01', status: 'Rejected' }),
      createApplication([], { company: 'Beta', role: 'Designer', dateApplied: '2026-01-02', status: 'Rejected' }),
      createApplication([], { company: 'Gamma', role: 'Engineer', dateApplied: '2026-01-03', status: 'Applied' })
    ],
    'Rejected',
    'beta'
  );

  assert.equal(filteredByStatusAndQuery.length, 1);
  assert.equal(filteredByStatusAndQuery[0].company, 'Beta');
});
