const express = require('express');
const { handleAiQuery, refreshIndex } = require('../services/ai');

const router = express.Router();

router.post('/ai-query', async (req, res) => {
  const { query, topK } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query is required' });

  try {
    const result = await handleAiQuery(query, { topK: topK || 5 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/ai-refresh', async (req, res) => {
  try {
    await refreshIndex();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
