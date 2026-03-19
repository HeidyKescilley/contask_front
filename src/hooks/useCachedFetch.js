"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "../utils/api";

// Module-level cache: { key: { data, timestamp } }
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Hook de fetch com cache stale-while-revalidate.
 * Retorna dados cacheados imediatamente e revalida em background.
 *
 * @param {string} endpoint - Endpoint da API (ex: "/obligation/dashboard?department=Fiscal")
 * @param {object} options
 * @param {boolean} options.enabled - Se false, não faz fetch (default: true)
 * @param {string} options.cacheKey - Chave de cache customizada (default: endpoint)
 * @param {number} options.ttl - TTL em ms (default: 5min)
 * @returns {{ data, loading, error, refresh }}
 */
export function useCachedFetch(endpoint, options = {}) {
  const { enabled = true, cacheKey, ttl = CACHE_TTL } = options;
  const key = cacheKey || endpoint;

  const cached = cache.get(key);
  const isStale = cached ? Date.now() - cached.timestamp > ttl : true;

  const [data, setData] = useState(cached?.data || null);
  const [loading, setLoading] = useState(!cached?.data);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled || !endpoint) return;

    // Only show loading if no cached data
    if (showLoading && !cache.get(key)?.data) {
      setLoading(true);
    }

    try {
      const res = await api.get(endpoint);
      const newData = res.data;

      cache.set(key, { data: newData, timestamp: Date.now() });

      if (mountedRef.current) {
        setData(newData);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        // Keep stale data on error
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, enabled, key]);

  useEffect(() => {
    if (!enabled) return;

    if (cached?.data) {
      // Return cached data immediately
      setData(cached.data);
      setLoading(false);

      // Revalidate in background if stale
      if (isStale) {
        fetchData(false);
      }
    } else {
      fetchData(true);
    }
  }, [endpoint, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    cache.delete(key);
    return fetchData(true);
  }, [key, fetchData]);

  return { data, loading, error, refresh };
}

/**
 * Invalida cache entries por prefixo.
 * Útil para invalidar ao fazer mutações.
 */
export function invalidateCacheByPrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

export default useCachedFetch;
