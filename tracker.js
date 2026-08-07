function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createApplication(applications, data) {
  const application = {
    id: createId(),
    company: data.company || '',
    role: data.role || '',
    dateApplied: data.dateApplied || '',
    location: data.location || '',
    source: data.source || '',
    status: data.status || 'Applied'
  };

  return application;
}

function updateApplication(applications, id, updates) {
  return applications.map((application) => {
    if (application.id === id) {
      return { ...application, ...updates };
    }
    return application;
  });
}

function deleteApplication(applications, id) {
  return applications.filter((application) => application.id !== id);
}

function filterApplications(applications, status) {
  if (!status) return applications;
  return applications.filter((application) => application.status === status);
}

function parseApplicationsCsv(csv) {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = lines[0].split(',');
  const rows = lines.slice(1);

  return rows.map((row) => {
    const values = row.split(',');
    const application = {};

    header.forEach((key, index) => {
      application[key.trim().toLowerCase()] = values[index] ? values[index].trim() : '';
    });

    return {
      id: createId(),
      company: application.company || application.employer || '',
      role: application.role || application.job || application.title || '',
      dateApplied: application.date || application.dateapplied || application.applieddate || '',
      location: application.location || application.city || '',
      source: application.source || application.link || application.url || '',
      status: application.status || 'Applied'
    };
  });
}

module.exports = {
  createApplication,
  updateApplication,
  deleteApplication,
  filterApplications,
  parseApplicationsCsv
};
