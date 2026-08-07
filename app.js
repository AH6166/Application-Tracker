const STORAGE_KEY = 'application-tracker-data-v1';

const form = document.getElementById('applicationForm');
const formContainer = document.getElementById('applicationFormContainer');
const formTitle = document.getElementById('formTitle');
const applicationIdField = document.getElementById('applicationId');
const cancelEditButton = document.getElementById('cancelEdit');
const toggleFormButton = document.getElementById('toggleFormButton');
const csvInput = document.getElementById('csvInput');
const tableBody = document.getElementById('applicationTableBody');
const searchInput = document.getElementById('searchInput');
const totalCount = document.getElementById('totalCount');
const appliedCount = document.getElementById('appliedCount');
const rejectedCount = document.getElementById('rejectedCount');
const ghostedCount = document.getElementById('ghostedCount');
const offersCount = document.getElementById('offersCount');
const summaryCards = document.querySelectorAll('.summary-card');

let applications = loadApplications();
let activeStatusFilter = '';

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function daysBetween(dateStringA, dateStringB) {
  const dateA = new Date(dateStringA);
  const dateB = new Date(dateStringB);

  if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
    return 0;
  }

  const msInDay = 1000 * 60 * 60 * 24;
  return Math.floor((dateB - dateA) / msInDay);
}

function applyGhostedStatus(applicationsList) {
  return applicationsList.map((application) => {
    const status = String(application.status || '').trim();
    const stage = String(application.stage || '').trim();
    const dateApplied = String(application.dateApplied || '').trim();

    if (
      stage === 'Review' &&
      !['Offer', 'Rejected', 'Ghosted'].includes(status) &&
      dateApplied &&
      daysBetween(dateApplied, new Date().toISOString().slice(0, 10)) > 60
    ) {
      return {
        ...application,
        status: 'Ghosted'
      };
    }

    return application;
  });
}

function loadApplications() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return applyGhostedStatus(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn('Unable to load stored applications', error);
    return [];
  }
}

function saveApplications() {
  const normalized = applyGhostedStatus(applications);
  applications = normalized;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

function resetForm() {
  form.reset();
  applicationIdField.value = '';
  formTitle.textContent = 'Add an application';
  formContainer.classList.add('hidden');
  toggleFormButton.setAttribute('aria-expanded', 'false');
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
  const normalizedMonth = String(month).padStart(2, '0');
  const normalizedDay = String(day).padStart(2, '0');
  return `${year}-${normalizedMonth}-${normalizedDay}`;
}

function formatDisplayDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number);
    return `${month}/${day}/${year}`;
  }

  return raw;
}

function buildApplicationFromForm() {
  const data = new FormData(form);
  const stageValue = String(data.get('stage') || '').trim();

  return {
    id: applicationIdField.value || createId(),
    company: String(data.get('company') || '').trim(),
    role: String(data.get('role') || '').trim(),
    dateApplied: normalizeDateValue(data.get('dateApplied')),
    location: String(data.get('location') || '').trim(),
    stage: stageValue || 'Review',
    status: String(data.get('status') || 'Applied').trim()
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
  form.elements.stage.value = item.stage || '';
  formContainer.classList.remove('hidden');
  toggleFormButton.setAttribute('aria-expanded', 'true');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function normalizeHeader(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeStage(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';

  if (normalized.includes('review')) return 'Review';
  if (normalized.includes('phone')) return 'Phone';
  if (normalized.includes('oa')) return 'OA';
  if (normalized.includes('vo')) return 'VO';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'Applied';

  if (/(ghost|ghosted|stale|silence)/.test(normalized)) {
    return 'Ghosted';
  }

  if (/(reject|rejected|decline|declined|no\s*go|not\s*moving\s*forward)/.test(normalized)) {
    return 'Rejected';
  }

  if (/(offer|accepted|hire|hired)/.test(normalized)) {
    return 'Offer';
  }

  if (/(interview|screen|phone|oa|vo|round|final)/.test(normalized)) {
    return 'Interview';
  }

  if (/(apply|applied)/.test(normalized)) {
    return 'Applied';
  }

  return 'Applied';
}

function parseStageAndStatus(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) {
    return { stage: '', status: 'Applied' };
  }

  if (value.includes('->')) {
    const [left, right] = value.split('->').map((part) => part.trim());
    return {
      stage: normalizeStage(left),
      status: normalizeStatus(right)
    };
  }

  const stage = normalizeStage(value);
  if (['Review', 'Phone', 'OA', 'VO'].includes(stage)) {
    return { stage, status: 'Interview' };
  }

  return { stage: '', status: normalizeStatus(value) };
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
    const dateApplied = normalizeDateValue(record.dateapplied || record.applieddate || record.date || '');
    const location = record.location || record.city || '';

    const rawStageValue = record.stage || record.milestone || record.progress || '';
    const rawStatusValue = record.status || record.result || record.outcome || '';
    const inferred = parseStageAndStatus(rawStatusValue || rawStageValue || '');
    const stage = normalizeStage(rawStageValue || inferred.stage || 'Review');
    const status = normalizeStatus(rawStatusValue || inferred.status || 'Applied');

    return {
      id: createId(),
      company: company.trim(),
      role: role.trim(),
      dateApplied: dateApplied.trim(),
      location: location.trim(),
      stage: stage || 'Review',
      status: status || 'Applied'
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

  return applications
    .filter((application) => {
      const matchesStatus = !activeStatusFilter || application.status === activeStatusFilter;
      const matchesQuery =
        !query ||
        `${application.company} ${application.role}`.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    })
    .sort((a, b) => {
      const dateA = a.dateApplied ? new Date(a.dateApplied) : new Date(0);
      const dateB = b.dateApplied ? new Date(b.dateApplied) : new Date(0);
      return dateB - dateA;
    });
}

function updateSummaryCardSelection() {
  summaryCards.forEach((card) => {
    const label = card.dataset.status || card.querySelector('span')?.textContent?.trim();
    const isActive = label && activeStatusFilter ? label === activeStatusFilter : !activeStatusFilter && label === 'Total';
    card.classList.toggle('active', isActive);
  });
}

function clearStatusFilter() {
  activeStatusFilter = '';
  updateSummaryCardSelection();
}

function setStatusFilter(status) {
  activeStatusFilter = activeStatusFilter === status ? '' : status;
  updateSummaryCardSelection();
  renderApplications();
}

function renderApplications() {
  const visibleApplications = getVisibleApplications();

  if (visibleApplications.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty">No applications yet. Add one manually or import a CSV.</td></tr>';
  } else {
    tableBody.innerHTML = visibleApplications
      .map(
        (application) => `
          <tr>
            <td>${formatDisplayDate(application.dateApplied)}</td>
            <td>${application.company || '—'}</td>
            <td>${application.role || '—'}</td>
            <td>${application.stage || '—'}</td>
            <td><span class="status-badge ${application.status || 'Applied'}">${application.status || 'Applied'}</span></td>
            <td>${application.location || '—'}</td>
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
  rejectedCount.textContent = applications.filter((item) => item.status === 'Rejected').length;
  ghostedCount.textContent = applications.filter((item) => item.status === 'Ghosted').length;
  offersCount.textContent = applications.filter((item) => item.status === 'Offer').length;

  const totalLabel = document.querySelector('.summary-card [data-status="Total"]') || document.querySelector('.summary-card:nth-child(1)');
  if (totalLabel) {
    totalLabel.classList.toggle('active', !activeStatusFilter);
  }

  applications = applyGhostedStatus(applications);
  if (applications.some((item) => item.status === 'Ghosted')) {
    saveApplications();
  }
}

toggleFormButton.addEventListener('click', () => {
  const isHidden = formContainer.classList.toggle('hidden');
  toggleFormButton.setAttribute('aria-expanded', String(!isHidden));

  if (!isHidden) {
    form.elements.company.focus();
  }
});

form.addEventListener('submit', addOrUpdateApplication);
cancelEditButton.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderApplications);
summaryCards.forEach((card) => {
  card.addEventListener('click', () => {
    const status = card.dataset.status || card.querySelector('span')?.textContent?.trim();
    if (status === 'Total') {
      clearStatusFilter();
      renderApplications();
      return;
    }

    setStatusFilter(status);
  });
});
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
