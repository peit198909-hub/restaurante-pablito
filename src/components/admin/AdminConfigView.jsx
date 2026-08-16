import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Settings,
  Clock,
  Truck,
  Save,
  CheckCircle2,
  AlertTriangle,
  Store,
  MapPin,
  DollarSign,
  Loader2,
  Calendar,
  Compass,
  Navigation,
} from "lucide-react";

// Icono personalizado para el pin del restaurante en el mapa
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Componente para re-centrar el mapa al cambiar coordenadas
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1] && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, 16, { animate: true });
    }
  }, [center, map]);
  return null;
}

// Componente para escuchar clics directos en el mapa
function MapClickListener({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function AdminConfigView({ addAlert }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados del formulario
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [direccionLocal, setDireccionLocal] = useState("");
  const [horaApertura, setHoraApertura] = useState("08:00");
  const [horaCierre, setHoraCierre] = useState("22:00");
  const [diasAtencion, setDiasAtencion] = useState("Lunes a Domingo");
  const [abiertoManual, setAbiertoManual] = useState(true);
  const [costoBaseEnvio, setCostoBaseEnvio] = useState(1.50);
  const [precioPorKm, setPrecioPorKm] = useState(0.50);
  const [distanciaMaximaKm, setDistanciaMaximaKm] = useState(15.0);
  const [latitudRestaurante, setLatitudRestaurante] = useState(-0.180653);
  const [longitudRestaurante, setLongitudRestaurante] = useState(-78.467838);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/configuracion");
      if (res && res.configuracion) {
        const c = res.configuracion;
        setConfig(c);
        setNombreNegocio(c.nombre_negocio || "Restaurante Pablito");
        setTelefonoContacto(c.telefono_contacto || "");
        setDireccionLocal(c.direccion_local || "");
        setHoraApertura(c.hora_apertura || "08:00");
        setHoraCierre(c.hora_cierre || "22:00");
        setDiasAtencion(c.dias_atencion || "Lunes a Domingo");
        setAbiertoManual(c.abierto_manual === 1);
        setCostoBaseEnvio(c.costo_base_envio !== undefined ? c.costo_base_envio : "");
        setPrecioPorKm(c.precio_por_km !== undefined ? c.precio_por_km : "");
        setDistanciaMaximaKm(c.distancia_maxima_km !== undefined ? c.distancia_maxima_km : "");
        setLatitudRestaurante(c.latitud_restaurante !== undefined ? c.latitud_restaurante : "");
        setLongitudRestaurante(c.longitud_restaurante !== undefined ? c.longitud_restaurante : "");
      }
    } catch (err) {
      if (addAlert) addAlert("Error al cargar la configuración: " + err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const handleGuardarConfig = async (e) => {
    e.preventDefault();
    
    if (telefonoContacto && telefonoContacto.length !== 10) {
      if (addAlert) addAlert("El número de teléfono de contacto debe tener exactamente 10 dígitos", "danger");
      return;
    }

    setSaving(true);
    try {
      const body = {
        nombre_negocio: nombreNegocio,
        telefono_contacto: telefonoContacto,
        direccion_local: direccionLocal,
        hora_apertura: horaApertura,
        hora_cierre: horaCierre,
        dias_atencion: diasAtencion,
        abierto_manual: abiertoManual ? 1 : 0,
        costo_base_envio: parseFloat(costoBaseEnvio),
        precio_por_km: parseFloat(precioPorKm),
        distancia_maxima_km: parseFloat(distanciaMaximaKm),
        latitud_restaurante: parseFloat(latitudRestaurante),
        longitud_restaurante: parseFloat(longitudRestaurante),
      };

      const res = await apiFetch("/api/configuracion", {
        method: "PUT",
        body,
      });

      if (res && res.configuracion) {
        setConfig(res.configuracion);
        if (addAlert) addAlert("¡Configuración del negocio guardada exitosamente!", "success");
      }
    } catch (err) {
      if (addAlert) addAlert(err.message || "Error al actualizar la configuración", "danger");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center fade-in-up">
        <Loader2 size={48} className="animate-spin text-gold mb-3" />
        <p className="text-muted">Cargando módulos de configuración...</p>
      </div>
    );
  }

  return (
    <div className="container py-4 fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom border-glass">
        <div>
          <h1 className="hero-title text-gold mb-1 h2 d-flex align-items-center gap-2">
            <Settings className="text-gold" size={28} />
            Configuración del Negocio
          </h1>
          <p className="text-muted small mb-0">
            Administra los horarios de atención al cliente y las tarifas por kilómetro para delivery.
          </p>
        </div>
      </div>

      <form onSubmit={handleGuardarConfig}>
        <div className="row g-4">
          {/* Tarjeta 1: Estado del Servicio & Horarios */}
          <div className="col-12 col-lg-6">
            <div className="glass-card p-4 h-100 shadow-sm border border-glass">
              <div className="d-flex align-items-center gap-2 mb-3 text-gold fw-bold border-bottom border-glass pb-2">
                <Clock size={20} />
                <span>Horarios y Estado de Atención</span>
              </div>

              {/* Interruptor Global de Servicio */}
              <div className="p-3 mb-4 rounded-3 border bg-dark bg-opacity-50 d-flex align-items-center justify-content-between">
                <div>
                  <label className="form-label text-white fw-bold mb-0 d-flex align-items-center gap-2">
                    <Store size={18} className={abiertoManual ? "text-success" : "text-danger"} />
                    Estado de Operación
                  </label>
                  <small className="text-muted d-block">
                    {abiertoManual
                      ? "El restaurante está Abierto y aceptando pedidos."
                      : "El restaurante está Cerrado (No se aceptan pedidos)."
                    }
                  </small>
                </div>
                <div className="form-check form-switch fs-4 mb-0">
                  <input
                    className="form-check-input style-switch"
                    type="checkbox"
                    role="switch"
                    checked={abiertoManual}
                    onChange={(e) => setAbiertoManual(e.target.checked)}
                  />
                </div>
              </div>

              {/* Días y Horas */}
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-gold small fw-bold mb-1">
                    <Calendar size={14} className="me-1 inline" />
                    Días de Atención
                  </label>
                  <input
                    type="text"
                    className="form-control glass-input"
                    value={diasAtencion}
                    onChange={(e) => setDiasAtencion(e.target.value)}
                    placeholder="Ej: Lunes a Domingo, Martes a Domingo"
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="form-label text-gold small fw-bold mb-1">
                    Hora de Apertura
                  </label>
                  <input
                    type="time"
                    className="form-control glass-input"
                    value={horaApertura}
                    onChange={(e) => setHoraApertura(e.target.value)}
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="form-label text-gold small fw-bold mb-1">
                    Hora de Cierre
                  </label>
                  <input
                    type="time"
                    className="form-control glass-input"
                    value={horaCierre}
                    onChange={(e) => setHoraCierre(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Info General del Restaurante */}
              <div className="mt-4 pt-3 border-top border-glass">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-gold small fw-bold mb-1">Nombre del Local</label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      value={nombreNegocio}
                      onChange={(e) => setNombreNegocio(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-gold small fw-bold mb-1">Teléfono Contacto</label>
                    <input
                      type="tel"
                      className="form-control glass-input"
                      placeholder="ej: 0991234567"
                      value={telefonoContacto}
                      maxLength={10}
                      onChange={(e) => setTelefonoContacto(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-gold small fw-bold mb-1">Dirección Física del Restaurante</label>
                    <input
                      type="text"
                      className="form-control glass-input"
                      value={direccionLocal}
                      onChange={(e) => setDireccionLocal(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Configuración de Delivery y Tarifas por KM */}
          <div className="col-12 col-lg-6">
            <div className="glass-card p-4 h-100 shadow-sm border border-glass">
              <div className="d-flex align-items-center gap-2 mb-3 text-gold fw-bold border-bottom border-glass pb-2">
                <Truck size={20} />
                <span>Tarifas y Envíos por Delivery (KM)</span>
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label text-gold small fw-bold mb-1">
                    <DollarSign size={14} className="me-1 inline" />
                    Costo Base de Envío ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control glass-input"
                    value={costoBaseEnvio}
                    onChange={(e) => setCostoBaseEnvio(e.target.value)}
                    required
                  />
                  <small className="text-muted extra-small">Tarifa fija mínima al enviar un pedido.</small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label text-gold small fw-bold mb-1">
                    <DollarSign size={14} className="me-1 inline" />
                    Adicional por Kilómetro ($/KM)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control glass-input"
                    value={precioPorKm}
                    onChange={(e) => setPrecioPorKm(e.target.value)}
                    required
                  />
                  <small className="text-muted extra-small">Costo por cada km recorrido.</small>
                </div>

                <div className="col-12">
                  <label className="form-label text-gold small fw-bold mb-1">
                    <Compass size={14} className="me-1 inline" />
                    Distancia Máxima de Reparto (KM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    className="form-control glass-input"
                    value={distanciaMaximaKm}
                    onChange={(e) => setDistanciaMaximaKm(e.target.value)}
                    required
                  />
                  <small className="text-muted extra-small">Pedidos más lejanos a esta distancia serán rechazados.</small>
                </div>
              </div>

              {/* Coordenadas GPS del Local y Mapa de Google Maps */}
              <div className="mt-4 pt-3 border-top border-glass">
                <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                  <label className="form-label text-gold small fw-bold mb-0 d-flex align-items-center gap-1">
                    <MapPin size={16} />
                    Coordenadas GPS del Restaurante (Punto de Origen)
                  </label>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-gold d-inline-flex align-items-center gap-1 extra-small"
                    onClick={() => {
                      if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setLatitudRestaurante(pos.coords.latitude.toFixed(6));
                            setLongitudRestaurante(pos.coords.longitude.toFixed(6));
                            if (addAlert) addAlert("Ubicación GPS capturada con éxito", "success");
                          },
                          (err) => {
                            if (addAlert) addAlert("Error capturando GPS: " + err.message, "danger");
                          }
                        );
                      }
                    }}
                  >
                    <Compass size={14} /> Capturar GPS Actual
                  </button>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <span className="extra-small text-muted mb-1 d-block">Latitud</span>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control glass-input"
                      value={latitudRestaurante}
                      onChange={(e) => setLatitudRestaurante(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <span className="extra-small text-muted mb-1 d-block">Longitud</span>
                    <input
                      type="number"
                      step="0.000001"
                      className="form-control glass-input"
                      value={longitudRestaurante}
                      onChange={(e) => setLongitudRestaurante(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Mapa Interactivo Seleccionable (Leaflet / OpenStreetMap) */}
                <div className="mt-3 rounded overflow-hidden border border-gold shadow-sm bg-dark">
                  <div className="p-2 bg-dark bg-opacity-75 border-bottom border-glass d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <span className="extra-small text-gold fw-bold d-flex align-items-center gap-1">
                      🗺️ Mapa Interactivo del Restaurante:
                    </span>
                    <span className="extra-small text-muted">
                      💡 Haz clic en el mapa o arrastra el pin rojo para marcar la ubicación exacta
                    </span>
                  </div>

                  <div style={{ height: "300px", width: "100%", position: "relative" }}>
                    {!isNaN(parseFloat(latitudRestaurante)) && !isNaN(parseFloat(longitudRestaurante)) && (
                      <MapContainer
                        center={[parseFloat(latitudRestaurante), parseFloat(longitudRestaurante)]}
                        zoom={16}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapRecenter center={[parseFloat(latitudRestaurante), parseFloat(longitudRestaurante)]} />
                        <MapClickListener
                          onMapClick={([lat, lng]) => {
                            setLatitudRestaurante(lat.toFixed(6));
                            setLongitudRestaurante(lng.toFixed(6));
                            if (addAlert) addAlert("Ubicación del restaurante asignada en el mapa", "info");
                          }}
                        />
                        <Marker
                          position={[parseFloat(latitudRestaurante), parseFloat(longitudRestaurante)]}
                          icon={customIcon}
                          draggable={true}
                          eventHandlers={{
                            dragend: (e) => {
                              const marker = e.target;
                              const position = marker.getLatLng();
                              setLatitudRestaurante(position.lat.toFixed(6));
                              setLongitudRestaurante(position.lng.toFixed(6));
                              if (addAlert) addAlert("Marcador ajustado correctamente", "info");
                            },
                          }}
                        />
                      </MapContainer>
                    )}
                  </div>
                </div>

                <small className="text-muted extra-small mt-2 d-block">
                  Haz clic directo o arrastra el marcador en el mapa para ajustar la posición exacta del restaurante.
                </small>
              </div>

              {/* Ejemplo en vivo */}
              <div className="mt-4 p-3 rounded bg-dark bg-opacity-40 border border-glass">
                <span className="extra-small text-gold fw-bold d-block mb-1">Ejemplo de Cálculo:</span>
                <span className="small text-white">
                  Envío a <strong>5 km</strong> = Costo Base (${parseFloat(costoBaseEnvio || 0).toFixed(2)}) + 5 × ${parseFloat(precioPorKm || 0).toFixed(2)} ={" "}
                  <strong className="text-gold">
                    ${(parseFloat(costoBaseEnvio || 0) + 5 * parseFloat(precioPorKm || 0)).toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de guardar cambios */}
        <div className="mt-4 text-end">
          <button
            type="submit"
            className="btn btn-gold btn-lg px-5 fw-bold d-inline-flex align-items-center gap-2 shadow-lg"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Configuración del Negocio
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
