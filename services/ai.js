const fs = require('fs');
const path = require('path');
const storage = require('../storage');

let OpenAIClient = null;
try {
  const { OpenAI } = require('openai');
  OpenAIClient = OpenAI;
} catch (err) {
  // openai package not installed; we'll handle at runtime
}

const DATA_DIR = path.join(process.cwd(), 'data');
const INDEX_FILE = path.join(DATA_DIR, 'ai-embeddings.json');

let indexCache = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function saveIndexToDisk(index) {
  ensureDataDir();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

function loadIndexFromDisk() {
  if (!fs.existsSync(INDEX_FILE)) return null;
  try {
    const raw = fs.readFileSync(INDEX_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function cosine(a, b) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / ((na * nb) || 1);
}

async function getClient() {
  if (!OpenAIClient) return null;
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY });
}

async function buildIndex() {
  // load applications and create text docs
  const apps = await storage.readApplications();
  const docs = apps.map((a) => ({
    id: a.id,
    text: `${a.company || ''} — ${a.role || ''} — ${a.dateApplied || ''} — ${a.status || ''} — ${a.location || ''} — ${a.stage || ''}`,
    meta: a
  }));

  const client = await getClient();
  if (!client) {
    // fall back to empty index (no embeddings)
    const idx = docs.map((d) => ({ ...d, embedding: null }));
    indexCache = idx;
    saveIndexToDisk(idx);
    return idx;
  }

  const inputs = docs.map((d) => d.text || '');
  const resp = await client.embeddings.create({ model: 'text-embedding-3-small', input: inputs });
  const embeddings = resp.data.map((r) => r.embedding);

  const idx = docs.map((d, i) => ({ ...d, embedding: embeddings[i] }));
  indexCache = idx;
  saveIndexToDisk(idx);
  return idx;
}

async function ensureIndex() {
  if (indexCache) return indexCache;
  const disk = loadIndexFromDisk();
  if (disk) {
    indexCache = disk;
    return indexCache;
  }
  return buildIndex();
}

async function refreshIndex() {
  indexCache = null;
  return ensureIndex();
}

async function handleAiQuery(query, { topK = 5 } = {}) {
  const client = await getClient();
  if (!client) {
    throw new Error('OpenAI client not configured. Set OPENAI_API_KEY and install the openai package.');
  }

  const idx = await ensureIndex();
  const qResp = await client.embeddings.create({ model: 'text-embedding-3-small', input: query });
  const qEmb = qResp.data[0].embedding;

  const scored = idx
    .map((item) => ({ item, score: item.embedding ? cosine(qEmb, item.embedding) : 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const contextText = scored.map((s) => `- ${s.item.text}`).join('\n');

  const systemPrompt = `You are a helpful assistant that answers questions using the application tracker data below. Answer concisely and cite companies/dates where relevant.`;
  const userPrompt = `Context:\n${contextText}\n\nQuestion:\n${query}`;

  const chatResp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 600
  });

  return {
    answer: chatResp.choices?.[0]?.message?.content || '',
    sources: scored.map((s) => s.item.meta)
  };
}

module.exports = {
  ensureIndex,
  refreshIndex,
  handleAiQuery,
  _internal: { cosine }
};
