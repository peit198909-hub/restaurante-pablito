import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Search, Check, X, Loader2, Compass } from "lucide-react";

// Icono personalizado para el pin de entrega
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Componente para re-centrar suavemente el mapa cuando cambian las coordenadas
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 16, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Componente para capturar clics directos en el mapa
function MapClickListener({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function AddressMapPicker({
  isOpen,
  onClose,
  onConfirmAddress,
  initialAddress = "",
}) {
  // Coordenadas por defecto (Quito, Ecuador)
  const DEFAULT_COORDS = [-0.180653, -78.467838];

  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [addressText, setAddressText] = useState(initialAddress);
  const [referenceText, setReferenceText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [geocoding, setGeocoding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const searchTimeoutRef = useRef(null);

  // Al abrir el modal, inicializar valores
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      if (initialAddress) {
        setAddressText(initialAddress);
        buscarCoordenadasPorTexto(initialAddress);
      } else {
        obtenerUbicacionGPS();
      }
    }
  }, [isOpen]);

  // Geocodificación inversa: Coordenadas [lat, lng] -> Dirección formateada
  const reverseGeocode = async (lat, lng) => {
    setGeocoding(true);
    setErrorMsg("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      if (data && data.display_name) {
        // Construir dirección limpia
        const addr = data.address || {};
        const calle = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || "";
        const numero = addr.house_number ? ` ${addr.house_number}` : "";
        const ciudad = addr.city || addr.town || addr.village || addr.state || "";

        let direccionLimpia = [calle + numero, ciudad].filter(Boolean).join(", ");
        if (!direccionLimpia) {
          direccionLimpia = data.display_name.split(",").slice(0, 3).join(",");
        }

        setAddressText(direccionLimpia);
      }
    } catch (err) {
      console.warn("Error en geocodificación inversa:", err);
    } finally {
      setGeocoding(false);
    }
  };

  // Buscar coordenadas a partir de texto
  const buscarCoordenadasPorTexto = async (query) => {
    if (!query || query.trim().length < 3) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newCoords = [parseFloat(item.lat), parseFloat(item.lon)];
        setCoords(newCoords);
        setAddressText(item.display_name.split(",").slice(0, 3).join(","));
      }
    } catch (err) {
      console.warn("Error buscando ubicación:", err);
    } finally {
      setSearching(false);
    }
  };

  // Búsqueda interactiva con sugerencias al escribir
  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              val
            )}&limit=5`,
            { headers: { "Accept-Language": "es" } }
          );
          const data = await res.json();
          setSearchResults(data || []);
        } catch (err) {
          console.warn("Error autocompletando:", err);
        } finally {
          setSearching(false);
        }
      }, 400);
    } else {
      setSearchResults([]);
    }
  };

  const seleccionarSugerencia = (item) => {
    const newCoords = [parseFloat(item.lat), parseFloat(item.lon)];
    setCoords(newCoords);
    setAddressText(item.display_name.split(",").slice(0, 3).join(","));
    setSearchQuery("");
    setSearchResults([]);
  };

  // Obtener ubicación por IP como respaldo si el GPS del dispositivo falla o está bloqueado
  const obtenerUbicacionPorIP = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const newCoords = [parseFloat(data.latitude), parseFloat(data.longitude)];
        setCoords(newCoords);
        reverseGeocode(newCoords[0], newCoords[1]);
        setErrorMsg("📍 Ubicación aproximada por red/ciudad detectada. Puedes afinar la ubicación moviendo el pin en el mapa.");
        return true;
      }
    } catch (err) {
      console.warn("Error obteniendo ubicación por IP:", err);
    }
    return false;
  };

  // Botón "Usar mi ubicación actual" (GPS con 3 niveles de fallback)
  const obtenerUbicacionGPS = () => {
    setGpsLoading(true);
    setErrorMsg("");

    if (!navigator.geolocation) {
      obtenerUbicacionPorIP().finally(() => setGpsLoading(false));
      return;
    }

    // Nivel 1: Alta precisión (GPS físico / dispositivo móvil)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = [pos.coords.latitude, pos.coords.longitude];
        setCoords(newCoords);
        reverseGeocode(newCoords[0], newCoords[1]);
        setGpsLoading(false);
      },
      (errHigh) => {
        console.warn("GPS Alta Precisión falló, intentando baja precisión por Wi-Fi/red...", errHigh);
        // Nivel 2: Baja precisión (Wi-Fi / Red local del navegador)
        navigator.geolocation.getCurrentPosition(
          (posLow) => {
            const newCoords = [posLow.coords.latitude, posLow.coords.longitude];
            setCoords(newCoords);
            reverseGeocode(newCoords[0], newCoords[1]);
            setGpsLoading(false);
          },
          async (errLow) => {
            console.warn("GPS Baja Precisión falló, usando IP Geolocation...", errLow);
            // Nivel 3: Servicio de Georeferenciación por IP
            const exitoIP = await obtenerUbicacionPorIP();
            if (!exitoIP) {
              setErrorMsg(
                "No se pudo detectar el GPS automáticamente. Puedes ingresar tu sector en la barra de búsqueda o hacer clic en el mapa."
              );
            }
            setGpsLoading(false);
          },
          { enableHighAccuracy: false, timeout: 5000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // Al mover el marcador o hacer clic en el mapa
  const handleMarkerDragEnd = (e) => {
    const marker = e.target;
    if (marker) {
      const latLng = marker.getLatLng();
      const newCoords = [latLng.lat, latLng.lng];
      setCoords(newCoords);
      reverseGeocode(latLng.lat, latLng.lng);
    }
  };

  const handleMapClick = (newCoords) => {
    setCoords(newCoords);
    reverseGeocode(newCoords[0], newCoords[1]);
  };

  const handleConfirm = () => {
    if (!addressText.trim()) {
      setErrorMsg("Por favor selecciona o ingresa una dirección válida.");
      return;
    }

    let direccionCompleta = addressText.trim();
    if (referenceText.trim()) {
      direccionCompleta += ` (Ref: ${referenceText.trim()})`;
    }

    onConfirmAddress({
      direccion: direccionCompleta,
      direccionPrincipal: addressText.trim(),
      referencia: referenceText.trim(),
      latitud: coords[0],
      longitud: coords[1],
    });
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(42, 34, 31, 0.8)",
        backdropFilter: "blur(6px)",
        zIndex: 1070,
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content glass-card shadow-lg border-glass text-dark overflow-hidden">
          {/* Header */}
          <div className="modal-header border-bottom border-glass p-3 bg-light">
            <h5 className="modal-title text-gold fw-bold d-flex align-items-center gap-2 m-0 fs-5">
              <MapPin size={22} className="text-gold" />
              Seleccionar Dirección de Entrega en el Mapa
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-3 p-md-4">
            {/* Barra de búsqueda y Botón GPS */}
            <div className="row g-2 mb-3 align-items-center">
              <div className="col-12 col-md-8 position-relative">
                <div className="input-group shadow-sm">
                  <span className="input-group-text glass-input border-end-0 text-gold">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input border-start-0"
                    placeholder="Buscar calle, sector o lugar..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                  />
                  {searching && (
                    <span className="input-group-text glass-input border-start-0">
                      <Loader2 size={18} className="animate-spin text-gold" />
                    </span>
                  )}
                </div>

                {/* Sugerencias desplegables */}
                {searchResults.length > 0 && (
                  <div
                    className="position-absolute w-100 bg-white border border-glass rounded shadow-lg mt-1"
                    style={{ zIndex: 1080, maxHeight: "200px", overflowY: "auto" }}
                  >
                    {searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 border-bottom border-light cursor-pointer hover-bg-light small text-dark"
                        onClick={() => seleccionarSugerencia(item)}
                        style={{ cursor: "pointer" }}
                      >
                        <MapPin size={14} className="text-gold me-2 inline-block" />
                        {item.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <button
                  type="button"
                  className="btn btn-outline-gold w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-bold shadow-sm"
                  onClick={obtenerUbicacionGPS}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Ubicando GPS...
                    </>
                  ) : (
                    <>
                      <Navigation size={18} />
                      Usar mi Ubicación GPS
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="alert alert-warning py-2 px-3 small mb-3 text-dark border-warning">
                {errorMsg}
              </div>
            )}

            {/* Contenedor del Mapa Interactivo */}
            <div
              className="border border-glass rounded overflow-hidden shadow-sm position-relative mb-3"
              style={{ height: "320px", width: "100%" }}
            >
              <MapContainer
                center={coords}
                zoom={16}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={coords}
                  draggable={true}
                  icon={customIcon}
                  eventHandlers={{ dragend: handleMarkerDragEnd }}
                />
                <MapRecenter center={coords} />
                <MapClickListener onMapClick={handleMapClick} />
              </MapContainer>

              <div
                className="position-absolute bottom-0 start-0 m-2 px-3 py-1 bg-dark bg-opacity-75 text-white extra-small rounded backdrop-blur shadow-sm"
                style={{ zIndex: 1000 }}
              >
                <Compass size={12} className="me-1 inline" />
                Haz clic o arrastra el marcador para fijar el punto exacto
              </div>
            </div>

            {/* Dirección detectada y Referencias adicionales */}
            <div className="row g-3">
              <div className="col-12 col-md-7">
                <label className="form-label text-gold small fw-bold mb-1">
                  Dirección Detectada *
                </label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0 text-gold">
                    <MapPin size={18} />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input border-start-0 fw-medium"
                    placeholder="Dirección seleccionada..."
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    required
                  />
                  {geocoding && (
                    <span className="input-group-text glass-input border-start-0">
                      <Loader2 size={16} className="animate-spin text-gold" />
                    </span>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-5">
                <label className="form-label text-gold small fw-bold mb-1">
                  Referencia Adicional (Opcional)
                </label>
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="Ej: Apto 3B, junto al parque..."
                  value={referenceText}
                  onChange={(e) => setReferenceText(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top border-glass p-3 bg-light d-flex justify-content-between">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onClose}>
              <X size={18} className="me-1" />
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-gold px-4 py-2 d-flex align-items-center gap-2 fw-bold"
              onClick={handleConfirm}
            >
              <Check size={18} />
              Confirmar Ubicación
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
