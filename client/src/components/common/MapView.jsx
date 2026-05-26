import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/* A CSS-only marker — avoids the broken default-icon issue under bundlers. */
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:30px;height:30px;border-radius:50% 50% 50% 0;
    background:linear-gradient(135deg,#7c3aed,#ec4899);
    transform:rotate(-45deg);box-shadow:0 6px 16px rgba(124,58,237,.55);
    border:2px solid #fff"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

/* Compact location map for detail pages. */
export default function MapView({ lat = 12.9716, lng = 77.5946, label, height = 280 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06]" style={{ height }}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pinIcon}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}
