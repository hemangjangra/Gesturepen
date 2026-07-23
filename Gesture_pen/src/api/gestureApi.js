/**
 * gestureApi.js
 * ---------------------------------------------------------------------------
 * Centralized API client for the Gesture Pen Flask backend.
 * All calls target the Flask server at http://localhost:5000/api/v1
 *
 * Every function returns a normalized shape:
 *   { ok: boolean, data: object|null, error: string|null }
 *
 * This keeps the calling hooks and components clean — they never
 * need to deal with raw fetch errors or status codes directly.
 * ---------------------------------------------------------------------------
 */

const BASE_URL = 'http://localhost:5000/api/v1';

/**
 * Internal helper — wraps fetch with timeout, JSON parsing, and error normalization.
 * @param {string} path   - Relative path, e.g. '/health'
 * @param {object} opts   - fetch options (method, body, etc.)
 * @param {number} timeoutMs - Milliseconds before the request is aborted
 */
async function request(path, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      ...opts,
    });

    clearTimeout(timer);

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = { message: res.statusText };
    }

    if (!res.ok) {
      return {
        ok: false,
        data: null,
        error: data?.error || data?.message || `HTTP ${res.status}`,
      };
    }

    return { ok: true, data, error: null };
  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      return { ok: false, data: null, error: 'Request timed out. Is the backend running?' };
    }

    // Network / CORS / server-down errors land here
    return {
      ok: false,
      data: null,
      error: err.message || 'Network error. Backend may be offline.',
    };
  }
}

// ---------------------------------------------------------------------------
// Public API Functions
// ---------------------------------------------------------------------------

/**
 * GET /health
 * Lightweight ping to check if the Flask server is alive.
 */
export async function checkHealth() {
  return request('/health', { method: 'GET' }, 4000);
}

/**
 * POST /start
 * Initializes the camera capture and gesture tracking background loop.
 * @param {object} config - Optional config, e.g. { camera_index: 0 }
 */
export async function startSession(config = {}) {
  return request('/start', {
    method: 'POST',
    body: JSON.stringify(config),
  });
}

/**
 * POST /stop
 * Halts the tracking loop and releases the camera hardware resource.
 */
export async function stopSession() {
  return request('/stop', { method: 'POST' });
}

/**
 * POST /clear
 * Wipes the virtual NumPy drawing canvas back to a blank state.
 */
export async function clearCanvas() {
  return request('/clear', { method: 'POST' });
}

/**
 * POST /recognize
 * Triggers the OCR pipeline (preprocess → EasyOCR) on the current canvas.
 * Returns { text: string, confidence: number }
 */
export async function recognizeText(base64Image) {
  return request('/recognize', { 
    method: 'POST',
    body: JSON.stringify({ image: base64Image })
  });
}
