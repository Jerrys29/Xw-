import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!offline) return null
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[60] bg-amber-500 px-4 py-2 flex items-center gap-2 text-white text-sm font-semibold">
      <WifiOff size={16} /> Pas de connexion — données sauvegardées localement
    </div>
  )
}
