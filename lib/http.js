const DEFAULT_TIMEOUT = 30000;

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}, timeoutMs = DEFAULT_TIMEOUT) {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  let data;
  try { data = await res.json(); } catch (e) { data = null; }
  return { res, data };
}

module.exports = { fetchWithTimeout, fetchJson, DEFAULT_TIMEOUT };