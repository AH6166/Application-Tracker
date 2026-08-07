const STORAGE_KEY = 'application-tracker-data-v1';

const form = document.getElementById('applicationForm');
const formTitle = document.getElementById('formTitle');
const applicationIdField = document.getElementById('applicationId');
const cancelEditButton = document.getElementById('cancelEdit');
const csvInput = document.getElementById('csvInput');
const tableBody = document.getElementById('applicationTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const totalCount = document.getElementById('totalCount');
const appliedCount = document.getElementById('appliedCount');
const interviewingCount = document.getElementById('interviewingCount');
const offersCount = document.getElementById('offersCount');

let applications = loadApplications();

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadApplications() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Unable to load stored applications', error);
    return [];
  }
}

function saveApplications() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function resetForm() {
  form.reset();
  applicationIdField.value = '';
  formTitle.textContent = 'Add an application';
}

function buildApplicationFromForm() {
  const data = new FormData(form);
  return {
    id: applicationIdField.value || createId(),
    company: String(data.get('company') || '').trim(),
    role: String(data.get('role') || '').trim(),
    dateApplied: String(data.get('dateApplied') || '').trim(),
    location: String(data.get('location') || '').trim(),
    source: String(data.get('source') || '').trim(),
    status: String(data.get('status') || 'Applied').trim(),
    notes: String(data.get('notes') || '').trim()
  };
}

function addOrUpdateApplication(event) {
  event.preventDefault();
  const payload = buildApplicationFromForm();

  if (!payload.company || !payload.role || !payload.dateApplied) {
    return;
  }

  if (payload.id && applications.some((item) => item.id === payload.id)) {
    applications = applications.map((item) => (item.id === payload.id ? payload : item));
  } else {
    applications = [payload, ...applications];
  }

  saveApplications();
  renderApplications();
  resetForm();
}

function deleteApplication(id) {
  applications = applications.filter((item) => item.id !== id);
  saveApplications();
  renderApplications();
}

function editApplication(id) {
  const item = applications.find((application) => application.id === id);
  if (!item) return;

  applicationIdField.value = item.id;
  formTitle.textContent = 'Edit application';
  form.elements.company.value = item.company || '';
  form.elements.role.value = item.role || '';
  form.elements.dateApplied.value = item.dateApplied || '';
  form.elements.status.value = item.status || 'Applied';
  form.elements.location.value = item.location || '';
  form.elements.source.value = item.source || '';
  form.elements.notes.value = item.notes || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseApplicationsCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const normalizedHeaders = headers.map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record = {};

    normalizedHeaders.forEach((header, index) => {
      record[header] = values[index] || '';
    });

    const company = record.company || record.organization || record.employer || '';
    const role = record.role || record.job || record.jobtitle || record.position || '';
    const dateApplied = record.dateapplied || record.applieddate || record.date || '';
    const location = record.location || record.city || '';
    const source = record.source || record.link || record.medium || '';
    const status = record.status || 'Applied';
    const notes = record.notes || record.comments || '';

    return {
      id: createId(),
      company: company.trim(),
      role: role.trim(),
      dateApplied: dateApplied.trim(),
      location: location.trim(),
      source: source.trim(),
      status: status.trim() || 'Applied',
      notes: notes.trim()
    };
  });
}

function importCsv(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const imported = parseApplicationsCsv(String(reader.result || ''));
    applications = [...imported, ...applications];
    saveApplications();
    renderApplications();
  };
  reader.readAsText(file);
}

function getVisibleApplications() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  return applications.filter((application) => {
    const matchesQuery =
      !query ||
      `${application.company} ${application.role}`.toLowerCase().includes(query);
    const matchesStatus = status === 'all' || application.status === status;
    return matchesQuery && matchesStatus;
  });
}

function renderApplications() {
  const visibleApplications = getVisibleApplications();

  if (visibleApplications.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="empty">No applications yet. Add one manually or import a CSV.</td></tr>';
  } else {
    tableBody.innerHTML = visibleApplications
      .map(
        (application) => `
          <tr>
            <td>${application.company || '—'}</td>
            <td>${application.role || '—'}</td>
            <td>${application.dateApplied || '—'}</td>
            <td>${application.status || 'Applied'}</td>
            <td>${application.location || '—'}</td>
            <td>${application.source || '—'}</td>
            <td>${application.notes || '—'}</td>
            <td>
              <div class="actions">
                <button type="button" class="secondary" data-action="edit" data-id="${application.id}">Edit</button>
                <button type="button" data-action="delete" data-id="${application.id}">Delete</button>
              </div>
            </td>
          </tr>
        `
      )
      .join('');
  }

  totalCount.textContent = applications.length;
  appliedCount.textContent = applications.filter((item) => item.status === 'Applied').length;
  interviewingCount.textContent = applications.filter((item) => item.status === 'Interviewing').length;
  offersCount.textContent = applications.filter((item) => item.status === 'Offer').length;
}

form.addEventListener('submit', addOrUpdateApplication);
cancelEditButton.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderApplications);
statusFilter.addEventListener('change', renderApplications);
csvInput.addEventListener('change', (event) => {
  const [file] = event.target.files || [];
  if (file) {
    importCsv(file);
    event.target.value = '';
  }
});

tableBody.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const id = button.getAttribute('data-id');
  const action = button.getAttribute('data-action');

  if (action === 'delete') {
    deleteApplication(id);
  }

  if (action === 'edit') {
    editApplication(id);
  }
});

renderApplications();
