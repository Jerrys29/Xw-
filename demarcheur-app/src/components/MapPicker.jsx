import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Navigation, Check, X, Crosshair, Loader } from 'lucide-react'

// Fix icône Leaflet (bug webpack/vite)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Icône personnalisée rouge vif pour la position sélectionnée
const pinIcon = new L.DivIcon({
  html: `<div style="
    width: 36px; height: 36px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(37,99,235,0.5);
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  className: '',
})

// Sous-composant : déplace la carte sur la position GPS
function FlyTo({ pos }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.flyTo(pos, 18, { animate: true, duration: 1 })
  }, [pos])
  return null
}

// Sous-composant : capture les clics sur la carte
function ClickHandler({ onMove }) {
  useMapEvents({ click(e) { onMove([e.latlng.lat, e.latlng.lng]) } })
  return null
}

// Sous-composant : marqueur déplaçable
function DraggableMarker({ pos, onMove }) {
  const markerRef = useRef(null)
  return (
    <Marker
      position={pos}
      icon={pinIcon}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const m = markerRef.current
          if (m) {
            const { lat, lng } = m.getLatLng()
            onMove([lat, lng])
          }
        },
      }}
    />
  )
}

export default function MapPicker({ initial, onConfirm, onClose }) {
  const [pos, setPos] = useState(initial ?? [6.3659, 2.4183]) // Cotonou par défaut
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsReady, setGpsReady] = useState(Boolean(initial))
  const [flyTarget, setFlyTarget] = useState(null)

  // Localiser automatiquement au premier affichage si pas de position initiale
  useEffect(() => {
    if (!initial) localize()
  }, [])

  function localize() {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = [coords.latitude, coords.longitude]
        setPos(p)
        setFlyTarget(p)
        setGpsReady(true)
        setGpsLoading(false)
      },
      () => {
        setGpsLoading(false)
        alert('Impossible de récupérer votre position. Vérifiez que la localisation est activée sur votre appareil.')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
      {/* Barre d'instruction */}
      <div className="absolute top-0 left-0 right-0 z-[10000] bg-white/95 backdrop-blur px-4 py-3 shadow-md">
        <div className="flex items-start justify-between gap-3 max-w-lg mx-auto">
          <div className="flex-1">
            <p className="font-bold text-slate-900 text-sm">Positionnez le pin sur la carte</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {gpsLoading
                ? 'Localisation en cours…'
                : 'Appuyez sur la carte ou déplacez le pin pour ajuster la position exacte'}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 flex-shrink-0">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Carte */}
      <MapContainer
        center={pos}
        zoom={17}
        style={{ flex: 1, width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMove={p => { setPos(p); setGpsReady(true) }} />
        {flyTarget && <FlyTo pos={flyTarget} />}
        {gpsReady && <DraggableMarker pos={pos} onMove={p => { setPos(p); setGpsReady(true) }} />}
      </MapContainer>

      {/* Boutons du bas */}
      <div className="absolute bottom-0 left-0 right-0 z-[10000] p-4 bg-white/95 backdrop-blur border-t border-slate-200">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button
            onClick={localize}
            disabled={gpsLoading}
            className="flex items-center justify-center gap-2 px-4 py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm flex-shrink-0 disabled:opacity-50"
          >
            {gpsLoading
              ? <Loader size={18} className="animate-spin" />
              : <Crosshair size={18} />
            }
            Ma position
          </button>
          <button
            onClick={() => gpsReady && onConfirm(pos[0], pos[1])}
            disabled={!gpsReady}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-base"
          >
            <Check size={20} /> Confirmer cette position
          </button>
        </div>
        {gpsReady && (
          <p className="text-center text-xs text-slate-400 mt-2">
            {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
          </p>
        )}
      </div>
    </div>
  )
}
