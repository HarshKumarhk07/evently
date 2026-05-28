import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
export default function MapView({ lat, lng, label, height = 280 }) {
  const mapRef = useRef(null);

  /* Fall back to a sane city center when the listing has no/invalid coords
     — Esri's World_Imagery returns "no imagery" tiles for (0,0) and other
     uncovered spots, which renders as a blank grey map. */
  const validLat = Number.isFinite(lat) && lat !== 0 ? lat : 12.9716;
  const validLng = Number.isFinite(lng) && lng !== 0 ? lng : 77.5946;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-900" style={{ height, minHeight: 260 }}>
      <MapContainer
        center={[validLat, validLng]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <MapResizeFix mapRef={mapRef} />
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        <TileLayer
          attribution='Labels &copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        <Marker position={[validLat, validLng]} icon={pinIcon}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  );
}

function MapResizeFix({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
      mapRef.current?.invalidateSize?.();
    }, 50);

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [map, mapRef]);

  return null;
}
