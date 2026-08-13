const aiQueryInput = document.getElementById('aiQueryInput');
const aiQuerySubmit = document.getElementById('aiQuerySubmit');
const aiResult = document.getElementById('aiResult');
const aiAnswer = document.getElementById('aiAnswer');
const aiSources = document.getElementById('aiSources');
const aiRefreshIndex = document.getElementById('aiRefreshIndex');

function showLoading(state) {
  aiQuerySubmit.disabled = state;
  aiQuerySubmit.textContent = state ? 'Asking…' : 'Ask';
}

async function postJson(path, body) {
  const resp = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return resp.json();
}

aiQuerySubmit.addEventListener('click', async () => {
  const q = aiQueryInput.value.trim();
  if (!q) return;

  showLoading(true);
  aiResult.classList.add('hidden');
  aiAnswer.textContent = '';
  aiSources.innerHTML = '';

  try {
    const result = await postJson('/api/ai-query', { query: q, topK: 5 });
    if (result.error) {
      aiAnswer.textContent = `Error: ${result.error}`;
    } else {
      aiAnswer.textContent = result.answer || 'No answer';
      if (Array.isArray(result.sources) && result.sources.length) {
        result.sources.forEach((s) => {
          const li = document.createElement('li');
          li.textContent = `${s.company || 'Unknown'} — ${s.dateApplied || ''} — ${s.status || ''}`;
          aiSources.appendChild(li);
        });
      }
    }
  } catch (err) {
    aiAnswer.textContent = `Request failed: ${err.message}`;
  } finally {
    showLoading(false);
    aiResult.classList.remove('hidden');
  }
});

aiRefreshIndex.addEventListener('click', async () => {
  aiRefreshIndex.disabled = true;
  const prev = aiRefreshIndex.textContent;
  aiRefreshIndex.textContent = 'Refreshing…';
  try {
    const res = await postJson('/api/ai-refresh', {});
    if (res && res.ok) {
      aiRefreshIndex.textContent = 'Refreshed';
      setTimeout(() => { aiRefreshIndex.textContent = prev; aiRefreshIndex.disabled = false; }, 1200);
    } else {
      aiRefreshIndex.textContent = 'Error';
      aiRefreshIndex.disabled = false;
    }
  } catch (err) {
    aiRefreshIndex.textContent = 'Error';
    aiRefreshIndex.disabled = false;
  }
});
