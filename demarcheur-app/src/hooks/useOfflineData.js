import { useState, useEffect, useCallback } from 'react'
import { cache } from '../lib/cache'

/**
 * Hook universel offline-first.
 * - Si en ligne : charge depuis Supabase et met en cache
 * - Si hors ligne : retourne les données du cache
 * @param {string}   cacheKey  clé unique pour ce jeu de données
 * @param {Function} queryFn   fonction async qui retourne [] de données Supabase
 * @param {Array}    deps      dépendances pour relancer la requête
 */
export function useOfflineData(cacheKey, queryFn, deps = []) {
  const [data,    setData]    = useState(() => cache.get(cacheKey) ?? [])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    if (!navigator.onLine) {
      const cached = cache.get(cacheKey)
      setData(cached ?? [])
      setOffline(true)
      setLoading(false)
      return
    }
    try {
      const result = await queryFn()
      cache.set(cacheKey, result)
      setData(result)
      setOffline(false)
    } catch {
      const cached = cache.get(cacheKey)
      setData(cached ?? [])
      setOffline(true)
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ...deps])

  useEffect(() => { load() }, [load])

  return { data, loading, offline, reload: load }
}
