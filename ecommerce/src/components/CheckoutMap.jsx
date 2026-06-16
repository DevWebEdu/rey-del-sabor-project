import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DELIVERY_RADIUS_KM = 2;
const DELIVERY_RADIUS_M  = DELIVERY_RADIUS_KM * 1000;

function buildPreciseAddress(a) {
  if (!a) return null;
  const parts = [];
  if (a.road) parts.push(a.house_number ? `${a.road} ${a.house_number}` : a.road);
  const barrio = a.neighbourhood || a.quarter || a.residential || a.hamlet;
  if (barrio) parts.push(barrio);
  const distrito = a.suburb || a.city_district || a.borough;
  if (distrito) parts.push(distrito);
  const ciudad = a.city || a.town || a.village || a.municipality;
  if (ciudad) parts.push(ciudad);
  return parts.length ? parts.join(', ') : null;
}

function getDistanceKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const customIcon = new L.Icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
});

function MapClickHandler({ onSelect }) {
  useMapEvents({ click(e) { onSelect([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 17, { duration: 1 });
  }, [position, map]);
  return null;
}

export default function CheckoutMap({ onAddressChange }) {
  const defaultCenter = [-12.1657782, -76.9936553];
  const [position, setPosition]           = useState(null);
  const [addressText, setAddressText]     = useState('');
  const [detail, setDetail]               = useState('');
  const [suggestions, setSuggestions]     = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading]             = useState(false);
  const [outOfRange, setOutOfRange]       = useState(false);
  const debounceRef = useRef(null);

  const isWithinRange = (pos) => getDistanceKm(defaultCenter, pos) <= DELIVERY_RADIUS_KM;

  // Notifica al padre combinando dirección base + detalle del usuario
  const notify = (lat, lon, mainAddr, det) => {
    const combined = det.trim() ? `${mainAddr} — ${det.trim()}` : mainAddr;
    onAddressChange({ lat, lon, address: combined });
  };

  const fetchSuggestions = async (text) => {
    if (text.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text + ', Lima, Peru')}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  };

  // Cuando el usuario escribe → limpia el marcador y el detalle previos
  const handleInputChange = (e) => {
    const val = e.target.value;
    setAddressText(val);
    setOutOfRange(false);
    setPosition(null);
    setDetail('');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const selectSuggestion = (item) => {
    const lat  = parseFloat(item.lat);
    const lon  = parseFloat(item.lon);
    const addr = buildPreciseAddress(item.address) || item.display_name;
    setAddressText(addr);
    setDetail('');
    setSuggestions([]);
    setShowSuggestions(false);
    if (!isWithinRange([lat, lon])) { setOutOfRange(true); return; }
    setOutOfRange(false);
    setPosition([lat, lon]);
    notify(lat, lon, addr, '');
  };

  const reverseGeocode = async ([lat, lon]) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      const addr = buildPreciseAddress(data.address) || data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      setAddressText(addr);
      setDetail('');
      notify(lat, lon, addr, '');
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
      setAddressText(fallback);
      notify(lat, lon, fallback, '');
    }
  };

  const handleMapSelect = (pos) => {
    if (!isWithinRange(pos)) { setOutOfRange(true); return; }
    setOutOfRange(false);
    setPosition(pos);
    reverseGeocode(pos);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const coords = [pos.coords.latitude, pos.coords.longitude];
      if (!isWithinRange(coords)) { setOutOfRange(true); return; }
      setOutOfRange(false);
      setPosition(coords);
      reverseGeocode(coords);
    });
  };

  const handleDetailChange = (e) => {
    const val = e.target.value;
    setDetail(val);
    if (position) notify(position[0], position[1], addressText, val);
  };

  return (
    <div className="space-y-3">

      {/* Buscador principal */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={addressText}
              onChange={handleInputChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Busca tu calle o zona..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-orange-400 text-sm"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <button
            type="button"
            onClick={handleMyLocation}
            className="px-4 py-3 bg-orange-100 text-orange-600 rounded-xl font-semibold text-sm hover:bg-orange-200 transition-colors whitespace-nowrap"
          >
            📍 Mi ubicación
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-9999 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {suggestions.map((item, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={() => selectSuggestion(item)}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 border-b border-gray-100 last:border-0 flex items-start gap-2"
                >
                  <span className="text-orange-400 shrink-0 mt-0.5">📍</span>
                  <span className="line-clamp-2">{item.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Campo de dirección exacta — aparece al seleccionar un punto */}
      {position && (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Dirección exacta <span className="text-orange-400 normal-case font-normal">(recomendado)</span>
          </label>
          <input
            type="text"
            value={detail}
            onChange={handleDetailChange}
            placeholder="Ej: N.° 245, Mz B Lote 12, Piso 3, referencia..."
            className="w-full px-4 py-3 rounded-xl border-2 border-orange-300 focus:outline-none focus:border-orange-500 text-sm bg-orange-50 placeholder-gray-400"
          />
          <p className="text-xs text-gray-400">
            Completa con tu número de puerta, piso o punto de referencia
          </p>
        </div>
      )}

      {/* Aviso fuera de rango */}
      {outOfRange && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          <span>⚠️</span>
          <span>Esta dirección está fuera de nuestra zona de delivery ({DELIVERY_RADIUS_KM} km).</span>
        </div>
      )}

      {/* Mapa */}
      <div className="h-56 md:h-107.5 rounded-xl overflow-hidden border border-gray-200">
        <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={defaultCenter}
            radius={DELIVERY_RADIUS_M}
            pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.08, weight: 2, dashArray: '8 5' }}
          />
          <MapClickHandler onSelect={handleMapSelect} />
          {position && (
            <>
              <Marker position={position} icon={customIcon} />
              <FlyTo position={position} />
            </>
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Haz clic en el mapa o escribe tu calle para ubicarte
      </p>
    </div>
  );
}
