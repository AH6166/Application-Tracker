const express = require('express');
const cors = require('cors');
const path = require('path');
const { randomUUID } = require('crypto');
const {
  normalizeApplicationInput,
  readApplications,
  writeApplications
} = require('./storage');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// AI routes (optional)
try {
  const aiRouter = require('./routes/ai');
  app.use('/api', aiRouter);
} catch (err) {
  // AI routes not available (missing deps) — continue without failing
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/applications', async (req, res) => {
  res.json(await readApplications());
});

app.post('/api/applications', async (req, res) => {
  const payload = normalizeApplicationInput(req.body);

  if (!payload.company || !payload.role || !payload.dateApplied) {
    return res.status(400).json({ error: 'company, role, and dateApplied are required' });
  }

  const applications = readApplications();
  const newApplication = {
    id: randomUUID(),
    ...payload
  };

  const next = [newApplication, ...applications];
  await writeApplications(next);

  return res.status(201).json(newApplication);
});

app.put('/api/applications/:id', async (req, res) => {
  const applications = await readApplications();
  const id = req.params.id;
  const index = applications.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Application not found' });
  }

  const updatedApplication = {
    ...applications[index],
    ...normalizeApplicationInput(req.body)
  };

  applications[index] = updatedApplication;
  await writeApplications(applications);

  return res.json(updatedApplication);
});

app.delete('/api/applications/:id', async (req, res) => {
  const applications = await readApplications();
  const next = applications.filter((item) => item.id !== req.params.id);
  await writeApplications(next);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Application tracker API running on http://localhost:${PORT}`);
});
