/**
 * Couche d'écriture offline-first.
 * - En ligne  → écrit dans Supabase + met à jour le cache
 * - Hors ligne → écrit dans le cache local + met en file d'attente
 *
 * Les IDs temporaires (préfixe "tmp_") sont remplacés par les vrais IDs
 * lors de la synchronisation dans OfflineBanner.
 */
import { supabase } from './supabase'
import { cache }    from './cache'
import { offlineQueue } from './queue'

export function tempId() {
  return 'tmp_' + crypto.randomUUID()
}

// ── INSERT ──────────────────────────────────────────────────────────────────
export async function offlineInsert(table, payload, cacheKey) {
  if (navigator.onLine) {
    const { data, error } = await supabase.from(table).insert(payload).select().single()
    if (!error && cacheKey) {
      const list = cache.get(cacheKey) ?? []
      cache.set(cacheKey, [...list, data])
    }
    return { data, error, offline: false }
  }
  // Hors ligne
  const fakeId = tempId()
  const record = { ...payload, id: fakeId, _offline: true }
  if (cacheKey) {
    const list = cache.get(cacheKey) ?? []
    cache.set(cacheKey, [...list, record])
  }
  offlineQueue.add({ type: 'insert', table, payload, _cacheKey: cacheKey, _tempId: fakeId })
  return { data: record, error: null, offline: true }
}

// ── UPDATE ──────────────────────────────────────────────────────────────────
export async function offlineUpdate(table, id, payload, cacheKey) {
  if (navigator.onLine) {
    const { error } = await supabase.from(table).update(payload).eq('id', id)
    if (!error && cacheKey) {
      const list = cache.get(cacheKey) ?? []
      cache.set(cacheKey, list.map(r => r.id === id ? { ...r, ...payload } : r))
    }
    return { error, offline: false }
  }
  if (cacheKey) {
    const list = cache.get(cacheKey) ?? []
    cache.set(cacheKey, list.map(r => r.id === id ? { ...r, ...payload } : r))
  }
  offlineQueue.add({ type: 'update', table, id, payload, _cacheKey: cacheKey })
  return { error: null, offline: true }
}

// ── DELETE ──────────────────────────────────────────────────────────────────
export async function offlineDelete(table, id, cacheKey) {
  if (navigator.onLine) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (!error && cacheKey) {
      const list = cache.get(cacheKey) ?? []
      cache.set(cacheKey, list.filter(r => r.id !== id))
    }
    return { error, offline: false }
  }
  if (cacheKey) {
    const list = cache.get(cacheKey) ?? []
    cache.set(cacheKey, list.filter(r => r.id !== id))
  }
  offlineQueue.add({ type: 'delete', table, id, _cacheKey: cacheKey })
  return { error: null, offline: true }
}
