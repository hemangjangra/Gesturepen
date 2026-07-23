/**
 * useGestureApi.js
 * ---------------------------------------------------------------------------
 * Custom React hook that wraps every backend interaction for the LiveDemo panel.
 *
 * Responsibilities:
 *  - Polls /health every 5 s to keep the `isOnline` flag fresh
 *  - Exposes action handlers: start, stop, clear, recognize
 *  - Tracks per-action loading states and the cumulative action log
 *  - Surfaces the latest OCR result from /recognize
 * ---------------------------------------------------------------------------
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkHealth,
  startSession,
  stopSession,
  clearCanvas,
  recognizeText,
} from '../api/gestureApi';

const POLL_INTERVAL_MS = 5000; // health check every 5 seconds

/**
 * Creates a timestamped log entry for the action log panel.
 */
function makeLogEntry(endpoint, method, ok, message) {
  return {
    id: Date.now() + Math.random(),
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    endpoint,
    method,
    ok,
    message,
  };
}

export function useGestureApi() {
  // --- State ---
  const [isOnline, setIsOnline]             = useState(null); // null = checking, true/false
  const [sessionActive, setSessionActive]   = useState(false);
  const [ocrResult, setOcrResult]           = useState(null); // { text, confidence }
  const [actionLog, setActionLog]           = useState([]);
  const [loading, setLoading]               = useState({
    start: false, stop: false, clear: false, recognize: false,
  });
  const [statusMsg, setStatusMsg]           = useState('');

  const pollRef = useRef(null);

  // --- Helpers ---

  /** Appends an entry to the front of the action log (max 50 entries). */
  const addLog = useCallback((endpoint, method, ok, message) => {
    setActionLog((prev) => [
      makeLogEntry(endpoint, method, ok, message),
      ...prev.slice(0, 49),
    ]);
  }, []);

  /** Sets loading state for a specific action key. */
  const setActionLoading = useCallback((key, val) => {
    setLoading((prev) => ({ ...prev, [key]: val }));
  }, []);

  // --- Health Polling ---

  const ping = useCallback(async () => {
    const { ok, data } = await checkHealth();
    setIsOnline(ok);
    if (ok) {
      setStatusMsg(data?.service || 'AirWrite AI API');
    } else {
      setStatusMsg('Backend offline — start the Flask server');
      // If the backend went offline mid-session, reflect that
      setSessionActive(false);
    }
  }, []);

  useEffect(() => {
    // First ping immediately
    ping();

    // Then poll on interval
    pollRef.current = setInterval(ping, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [ping]);

  // --- Action Handlers ---

  /** POST /start — begins camera capture + gesture tracking */
  const handleStart = useCallback(async () => {
    if (!isOnline || sessionActive) return;
    setActionLoading('start', true);

    const { ok, data, error } = await startSession({ camera_index: 0 });

    if (ok) {
      setSessionActive(true);
      addLog('/start', 'POST', true, data?.message || 'Session started');
    } else {
      addLog('/start', 'POST', false, error || 'Failed to start session');
    }

    setActionLoading('start', false);
  }, [isOnline, sessionActive, addLog, setActionLoading]);

  /** POST /stop — halts tracking and releases camera */
  const handleStop = useCallback(async () => {
    if (!isOnline || !sessionActive) return;
    setActionLoading('stop', true);

    const { ok, data, error } = await stopSession();

    if (ok) {
      setSessionActive(false);
      setOcrResult(null); // clear previous OCR on new session boundary
      addLog('/stop', 'POST', true, data?.message || 'Session stopped');
    } else {
      addLog('/stop', 'POST', false, error || 'Failed to stop session');
    }

    setActionLoading('stop', false);
  }, [isOnline, sessionActive, addLog, setActionLoading]);

  /** POST /clear — wipes the virtual drawing canvas */
  const handleClear = useCallback(async () => {
    if (!isOnline) return;
    setActionLoading('clear', true);

    const { ok, data, error } = await clearCanvas();

    if (ok) {
      setOcrResult(null);
      addLog('/clear', 'POST', true, data?.message || 'Canvas cleared');
    } else {
      addLog('/clear', 'POST', false, error || 'Failed to clear canvas');
    }

    setActionLoading('clear', false);
  }, [isOnline, addLog, setActionLoading]);

  /** POST /recognize — runs OCR and surfaces the result */
  const handleRecognize = useCallback(async (base64Image) => {
    if (!isOnline) return null;
    setActionLoading('recognize', true);

    const { ok, data, error } = await recognizeText(base64Image);

    let resObj = null;
    if (ok) {
      resObj = {
        text: data?.text || '(no text detected)',
        confidence: typeof data?.confidence === 'number'
          ? Math.round(data.confidence * 100)
          : null,
      };
      setOcrResult(resObj);
      addLog(
        '/recognize',
        'POST',
        true,
        `"${resObj.text}" (${resObj.confidence ?? '—'}% confidence)`,
      );
    } else {
      addLog('/recognize', 'POST', false, error || 'OCR failed');
    }

    setActionLoading('recognize', false);
    return resObj;
  }, [isOnline, addLog, setActionLoading]);

  // --- Public API ---
  return {
    isOnline,
    statusMsg,
    sessionActive,
    ocrResult,
    actionLog,
    loading,
    actions: {
      start:     handleStart,
      stop:      handleStop,
      clear:     handleClear,
      recognize: handleRecognize,
    },
  };
}
