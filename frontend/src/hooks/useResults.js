import { useState, useCallback } from 'react';
import { lookupResult, fetchActiveYears } from '../utils/api';

export function useResults() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [years, setYears]     = useState([]);

  const loadYears = useCallback(async () => {
    try {
      const { data } = await fetchActiveYears();
      setYears(data);
    } catch {
      setYears([]);
    }
  }, []);

  const lookup = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await lookupResult(payload);
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        'Unable to retrieve results. Please try again.';
      setError(typeof msg === 'object' ? JSON.stringify(msg) : msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, lookup, reset, years, loadYears };
}