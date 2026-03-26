import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'

const pinIcon = new L.DivIcon({
  html: `<div style="
    width: 28px; height: 28px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 3px 8px rgba(37,99,235,0.5);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  className: '',
})

export default function MapPreview({ lat, lng, height = '160px' }) {
  if (!lat || !lng) return null
  return (
    <div style={{ height, borderRadius: '16px', overflow: 'hidden' }} className="w-full shadow-sm border border-slate-200">
      <MapContainer
        center={[lat, lng]}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  )
}
