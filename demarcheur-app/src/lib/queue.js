// File d'attente pour les opérations offline — stockée dans localStorage
const KEY = 'xwe_queue'

export const offlineQueue = {
  add(op) {
    const q = this.all()
    q.push({ ...op, _id: Date.now() + Math.random(), _ts: new Date().toISOString() })
    localStorage.setItem(KEY, JSON.stringify(q))
  },
  all() {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
  },
  remove(id) {
    localStorage.setItem(KEY, JSON.stringify(this.all().filter(o => o._id !== id)))
  },
  size() { return this.all().length },
  clear() { localStorage.removeItem(KEY) },
}
