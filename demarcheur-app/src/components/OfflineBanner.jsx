import { useEffect, useState, useCallback } from 'react'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { offlineQueue } from '../lib/queue'
import { supabase } from '../lib/supabase'
import { cache } from '../lib/cache'

async function processQueue() {
  const ops = offlineQueue.all()
  if (!ops.length) return 0

  const tempIdMap = {} // tmp_xxx → vrai UUID Supabase
  let synced = 0

  for (const op of ops) {
    try {
      // Remplace les IDs temporaires par les vrais dans le payload
      const payload = Object.fromEntries(
        Object.entries(op.payload ?? {}).map(([k, v]) =>
          [k, (typeof v === 'string' && tempIdMap[v]) ? tempIdMap[v] : v]
        )
      )

      if (op.type === 'insert') {
        const { data, error } = await supabase.from(op.table).insert(payload).select().single()
        if (!error) {
          if (op._tempId) tempIdMap[op._tempId] = data.id
          // Met à jour le cache : remplace l'enregistrement temporaire par le vrai
          if (op._cacheKey) {
            const list = cache.get(op._cacheKey) ?? []
            cache.set(op._cacheKey, list.map(r => r.id === op._tempId ? { ...data, _offline: false } : r))
          }
          offlineQueue.remove(op._id); synced++
        }
      } else if (op.type === 'update') {
        const realId = tempIdMap[op.id] ?? op.id
        const { error } = await supabase.from(op.table).update(payload).eq('id', realId)
        if (!error) { offlineQueue.remove(op._id); synced++ }
      } else if (op.type === 'delete') {
        const realId = tempIdMap[op.id] ?? op.id
        if (typeof realId === 'string' && realId.startsWith('tmp_')) {
          offlineQueue.remove(op._id); synced++; continue
        }
        const { error } = await supabase.from(op.table).delete().eq('id', realId)
        if (!error) { offlineQueue.remove(op._id); synced++ }
      }
    } catch {}
  }
  return synced
}

export default function OfflineBanner() {
  const [offline,  setOffline]  = useState(!navigator.onLine)
  const [queueLen, setQueueLen] = useState(offlineQueue.size())
  const [syncing,  setSyncing]  = useState(false)
  const [syncDone, setSyncDone] = useState(false)

  const refreshQueue = () => setQueueLen(offlineQueue.size())

  const sync = useCallback(async () => {
    setSyncing(true)
    const n = await processQueue()
    refreshQueue()
    setSyncing(false)
    if (n > 0) { setSyncDone(true); setTimeout(() => setSyncDone(false), 3000) }
  }, [])

  useEffect(() => {
    const goOnline = async () => {
      setOffline(false)
      await sync()
    }
    const goOffline = () => { setOffline(true); refreshQueue() }
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline) }
  }, [sync])

  // Rafraîchit le compteur de queue toutes les 5s
  useEffect(() => {
    const t = setInterval(refreshQueue, 5000)
    return () => clearInterval(t)
  }, [])

  if (syncDone) return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] bg-emerald-500 px-4 py-2 flex items-center gap-2 text-white text-sm font-semibold">
      <CheckCircle2 size={16} /> Données synchronisées !
    </div>
  )

  if (!offline && queueLen === 0) return null

  if (!offline && queueLen > 0) return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] bg-blue-600 px-4 py-2 flex items-center gap-2 text-white text-sm font-semibold">
      <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
      <span className="flex-1">{queueLen} modification(s) en attente</span>
      <button onClick={sync} disabled={syncing} className="underline text-white/90 text-xs">
        {syncing ? 'Sync…' : 'Synchroniser'}
      </button>
    </div>
  )

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] bg-amber-500 px-4 py-2 flex items-center gap-2 text-white text-sm font-semibold">
      <WifiOff size={16} />
      <span className="flex-1">Hors ligne — données en cache</span>
      {queueLen > 0 && <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{queueLen} en attente</span>}
    </div>
  )
}
