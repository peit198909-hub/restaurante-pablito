import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../api/client";
import { formatFecha } from "../utils/dateUtils";
import { playNotificationSound } from "../utils/soundUtils";
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Navigation,
  MessageSquare,
  RefreshCw,
  PackageCheck,
  Utensils,
  DollarSign,
  Image as ImageIcon,
  ZoomIn,
  X,
  History,
} from "lucide-react";

export default function DeliveryView({ usuario, addAlert }) {
  const [entregaActiva, setEntregaActiva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("activa"); // 'activa' | 'historial'
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Modal Lightbox para comprobante
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    cargarEntregaActiva();

    // SSE listener para actualizaciones instantáneas en tiempo real
    const handleSSEUpdate = (e) => {
      const { repartidor_id, pedido_id } = e.detail || {};
      if (!repartidor_id || Number(repartidor_id) === Number(usuario?.id)) {
        cargarEntregaActiva(true);
      }
    };

    window.addEventListener("order_status_update", handleSSEUpdate);
    window.addEventListener("sse_order_update", handleSSEUpdate);

    return () => {
      window.removeEventListener("order_status_update", handleSSEUpdate);
      window.removeEventListener("sse_order_update", handleSSEUpdate);
    };
  }, [usuario]);

  const cargarEntregaActiva = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/pedidos/repartidor/activo");
      setEntregaActiva(res.entrega || null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await apiFetch("/api/pedidos/repartidor/historial");
      setHistorial(res.entregas || []);
    } catch (err) {
      console.error("Error cargando historial de entregas:", err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!entregaActiva?.pedido?.id) return;

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/pedidos/repartidor/estado", {
        method: "PATCH",
        body: {
          pedido_id: entregaActiva.pedido.id,
          estado: nuevoEstado,
        },
      });

      playNotificationSound();

      if (nuevoEstado === "entregado") {
        if (addAlert) {
          addAlert(`¡Pedido #${entregaActiva.pedido.id} entregado con éxito! Buscando nuevo pedido...`, "success");
        }
      } else if (nuevoEstado === "en_camino") {
        if (addAlert) {
          addAlert(`Has iniciado la ruta para el Pedido #${entregaActiva.pedido.id}`, "info");
        }
      }

      await cargarEntregaActiva();
    } catch (err) {
      if (addAlert) addAlert("Error actualizando estado: " + err.message, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const p = entregaActiva?.pedido;
  const items = entregaActiva?.items || [];

  return (
    <div className="container py-4 fade-in-up">
      {/* Header del Panel de Delivery */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="hero-title text-gold h2 mb-1 d-flex align-items-center gap-2">
            <Truck size={28} className="text-gold" /> Panel de Delivery
          </h1>
          <p className="hero-subtitle text-muted mb-0">
            Repartidor: <strong className="text-dark">{usuario?.nombre} {usuario?.apellido}</strong>
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${tab === "activa" ? "btn-gold" : "btn-outline-gold"}`}
            onClick={() => setTab("activa")}
          >
            <Truck size={16} className="me-1" /> Entrega Activa
          </button>
          <button
            className={`btn btn-sm ${tab === "historial" ? "btn-gold" : "btn-outline-gold"}`}
            onClick={() => {
              setTab("historial");
              cargarHistorial();
            }}
          >
            <History size={16} className="me-1" /> Historial
          </button>
          <button
            className="btn btn-sm btn-outline-gold p-2"
            onClick={() => cargarEntregaActiva()}
            title="Refrescar asignación"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-gold" role="status"></div>
          <p className="text-gold mt-3">Comprobando entregas asignadas...</p>
        </div>
      ) : tab === "historial" ? (
        /* Vista de Historial de Entregas */
        <div className="glass-card p-4">
          <h3 className="h5 text-gold mb-3 border-bottom border-glass pb-2">
            Historial de Entregas Completadas
          </h3>
          {loadingHistorial ? (
            <div className="text-center py-4">
              <div className="spinner-border spinner-border-sm text-gold"></div>
            </div>
          ) : historial.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">Aún no has completado entregas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="text-muted small border-bottom border-glass">
                    <th># Pedido</th>
                    <th>Cliente</th>
                    <th>Dirección</th>
                    <th>Total</th>
                    <th>Completado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => (
                    <tr key={h.id}>
                      <td className="fw-bold text-gold">#{h.id}</td>
                      <td>{h.cliente_nombre} {h.cliente_apellido}</td>
                      <td className="small">{h.direccion_entrega}</td>
                      <td className="fw-bold text-gold">${Number(h.total).toFixed(2)}</td>
                      <td className="small text-muted">{formatFecha(h.actualizado_en || h.creado_en)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : !entregaActiva ? (
        /* Vista cuando NO HAY pedidos asignados (Esperando en cola) */
        <div className="glass-card p-5 text-center max-w-lg mx-auto">
          <div className="p-4 rounded-circle bg-dark bg-opacity-10 border border-gold text-gold d-inline-flex mb-4 animate-pulse">
            <Truck size={48} />
          </div>
          <h2 className="text-gold mb-3 h3">Esperando Pedidos...</h2>
          <p className="text-muted mb-4">
            Actualmente estás disponible. El sistema te asignará automáticamente el próximo pedido que ingrese o esté en cola.
          </p>
          <div className="d-flex justify-content-center align-items-center gap-2 text-gold small fw-bold">
            <span className="spinner-grow spinner-grow-sm text-gold" role="status"></span>
            Radar de asignación en vivo activo
          </div>
        </div>
      ) : (
        /* Vista de la Entrega Activa Asignada */
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="glass-card p-4 h-100 border-gold border-2">
              <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-glass mb-4 flex-wrap gap-2">
                <div>
                  <span className="badge bg-gold text-dark fw-bold me-2 fs-6">
                    Pedido Asignado #{p.id}
                  </span>
                  <span
                    className={`badge ${
                      p.estado === "en_camino" ? "bg-primary" : "bg-warning text-dark"
                    }`}
                  >
                    {p.estado === "en_camino" ? "En Camino 🛵" : "Listo para entregar 📦"}
                  </span>
                </div>
                <span className="small text-muted d-flex align-items-center gap-1">
                  <Clock size={14} /> {formatFecha(p.creado_en)}
                </span>
              </div>

              {/* Datos del Cliente y Dirección */}
              <div className="mb-4 p-3 rounded border border-glass bg-white shadow-sm">
                <h6 className="text-gold fw-bold mb-2 d-flex align-items-center gap-2">
                  <MapPin size={18} /> Datos de Entrega al Cliente
                </h6>
                <div className="fs-5 fw-bold text-dark mb-1">
                  {p.cliente_nombre} {p.cliente_apellido}
                </div>
                <div className="text-dark fw-medium mb-3 fs-6">
                  📍 {p.direccion_entrega}
                </div>

                <div className="d-flex flex-wrap gap-2 mb-3">
                  {/* Botón para abrir navegación en Google Maps */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.direccion_entrega)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-gold d-inline-flex align-items-center gap-1 fw-bold shadow-sm"
                  >
                    <Navigation size={14} /> Abrir en Google Maps / GPS ↗
                  </a>

                  {/* Botón para llamar o WhatsApp */}
                  {p.telefono_contacto && (
                    <>
                      <a
                        href={`tel:${p.telefono_contacto}`}
                        className="btn btn-sm btn-outline-gold d-inline-flex align-items-center gap-1"
                      >
                        <Phone size={14} /> Llamar ({p.telefono_contacto})
                      </a>
                      <a
                        href={`https://wa.me/${p.telefono_contacto.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${p.cliente_nombre}, soy tu repartidor de Restaurante Pablito. Voy en camino con tu pedido #${p.id}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-success text-white d-inline-flex align-items-center gap-1"
                      >
                        <MessageSquare size={14} /> WhatsApp
                      </a>
                    </>
                  )}
                </div>

                {p.distancia_km > 0 && (
                  <div className="extra-small text-muted fw-medium">
                    📏 Distancia estimada de envío: <strong>{p.distancia_km} km</strong>
                  </div>
                )}
              </div>

              {/* Método de Cobro / Pago */}
              <div className="p-3 rounded border border-glass bg-white shadow-sm mb-4">
                <h6 className="text-gold fw-bold mb-2 d-flex align-items-center gap-2">
                  <DollarSign size={18} /> Método de Cobro
                </h6>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <span className="fw-bold text-dark text-capitalize fs-6">
                      {p.metodo_pago === "efectivo" ? "💵 Efectivo contra entrega" : "💳 Transferencia Bancaria"}
                    </span>
                    {p.metodo_pago === "efectivo" ? (
                      <p className="mb-0 extra-small text-muted">
                        Cobrar al cliente en el punto de entrega.
                      </p>
                    ) : (
                      <p className="mb-0 extra-small text-success fw-bold">
                        Pago por transferencia bancaria registrado.
                      </p>
                    )}
                  </div>
                  <div className="text-end">
                    <span className="extra-small text-muted d-block">Monto a cobrar</span>
                    <span className="fs-4 fw-bold text-gold">${Number(p.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Comprobante de pago si existe */}
                {p.metodo_pago === "transferencia" && p.comprobante_url && (
                  <div className="mt-3 pt-3 border-top border-glass d-flex align-items-center gap-3">
                    <img
                      src={p.comprobante_url}
                      alt="Comprobante"
                      className="rounded border border-gold"
                      style={{ width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" }}
                      onClick={() => setShowReceiptModal(true)}
                    />
                    <div>
                      <span className="extra-small text-success fw-bold d-block">
                        Comprobante de pago adjunto
                      </span>
                      <button
                        type="button"
                        className="btn btn-link text-gold p-0 extra-small fw-bold d-flex align-items-center gap-1"
                        onClick={() => setShowReceiptModal(true)}
                      >
                        <ZoomIn size={12} /> Ver comprobante ampliado
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de Acción de la Entrega */}
              <div className="d-grid gap-2">
                {p.estado !== "en_camino" && (
                  <button
                    type="button"
                    className="btn btn-gold py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-lg"
                    onClick={() => handleCambiarEstado("en_camino")}
                    disabled={submitting}
                  >
                    <Truck size={20} />
                    {submitting ? "Actualizando..." : "🛵 Iniciar Ruta (Poner 'En Camino')"}
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-success py-3 text-white fw-bold fs-6 d-flex align-items-center justify-content-center gap-2 shadow-lg"
                  onClick={() => handleCambiarEstado("entregado")}
                  disabled={submitting}
                >
                  <CheckCircle2 size={22} />
                  {submitting ? "Completando..." : "✅ Marcar Como Entregado"}
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Productos a Entregar */}
          <div className="col-lg-5">
            <div className="glass-card p-4 h-100">
              <h3 className="h5 text-gold mb-3 border-bottom border-glass pb-2 d-flex align-items-center gap-2">
                <Utensils size={18} /> Productos del Pedido ({items.length})
              </h3>

              <div className="d-flex flex-column gap-2 mb-4">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="p-3 border border-glass rounded bg-white shadow-sm d-flex align-items-center justify-content-between gap-2"
                  >
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-gold text-dark fw-bold fs-6">
                        {it.cantidad}x
                      </span>
                      <div>
                        <span className="fw-bold text-dark">{it.producto_nombre}</span>
                        {it.notas && (
                          <div className="extra-small text-muted fst-italic">
                            "{it.notas}"
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="fw-bold text-gold">${Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {p.notas && (
                <div className="alert alert-warning text-dark border-warning p-3 mb-0 shadow-sm">
                  <strong className="d-block mb-1 text-gold">📝 Notas Especiales del Cliente:</strong>
                  <span className="fst-italic">"{p.notas}"</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Lightbox para Comprobante */}
      {showReceiptModal && p?.comprobante_url &&
        createPortal(
          <div
            className="modal show d-block"
            tabIndex="-1"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(42, 34, 31, 0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 1090,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
            onClick={() => setShowReceiptModal(false)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "520px", width: "95%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content glass-card border-glass shadow-lg text-dark overflow-hidden bg-white">
                <div className="modal-header border-bottom border-glass p-3 bg-white d-flex align-items-center justify-content-between">
                  <h5 className="modal-title text-gold fw-bold fs-5 m-0 d-flex align-items-center gap-2">
                    <ImageIcon size={20} /> Comprobante de Pago — Pedido #{p.id}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowReceiptModal(false)}
                  ></button>
                </div>
                <div
                  className="modal-body p-3 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "var(--sand-input)", maxHeight: "75vh", overflow: "auto" }}
                >
                  <img
                    src={p.comprobante_url}
                    alt="Comprobante de pago"
                    className="img-fluid rounded border border-glass shadow-sm"
                    style={{ maxHeight: "70vh", objectFit: "contain", maxWidth: "100%" }}
                  />
                </div>
                <div className="modal-footer border-top border-glass p-2 bg-white justify-content-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-gold px-4"
                    onClick={() => setShowReceiptModal(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
