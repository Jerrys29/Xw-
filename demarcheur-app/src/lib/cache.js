// Cache localStorage — conserve les données 7 jours
const PREFIX = 'xwe_'
const TTL    = 31 * 24 * 60 * 60 * 1000

export const cache = {
  set(key, data) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }))
    } catch {}
  },
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (!raw) return null
      const { data, ts } = JSON.parse(raw)
      if (Date.now() - ts > TTL) { localStorage.removeItem(PREFIX + key); return null }
      return data
    } catch { return null }
  },
  ts(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (!raw) return null
      return JSON.parse(raw).ts
    } catch { return null }
  },
}
