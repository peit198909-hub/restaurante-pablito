import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../api/client";
import { formatFecha } from "../utils/dateUtils";
import { ArrowLeft, Clock, CheckCircle2, PackageCheck, Utensils, Truck, Home, AlertCircle, RefreshCw, Upload, Image as ImageIcon, ZoomIn, X, Store, Navigation } from "lucide-react";

export default function OrderTrackingView({ orderId, setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const ESTADOS_ORDEN_DELIVERY = [
    { key: "pendiente", label: "Pendiente", icon: Clock },
    { key: "confirmado", label: "Confirmado", icon: CheckCircle2 },
    { key: "en_preparacion", label: "En Preparación", icon: Utensils },
    { key: "listo", label: "Listo", icon: PackageCheck },
    { key: "en_camino", label: "En Camino", icon: Truck },
    { key: "entregado", label: "Entregado", icon: Home },
  ];

  const ESTADOS_ORDEN_RETIRO = [
    { key: "pendiente", label: "Pendiente", icon: Clock },
    { key: "confirmado", label: "Confirmado", icon: CheckCircle2 },
    { key: "en_preparacion", label: "En Preparación", icon: Utensils },
    { key: "listo", label: "Listo para Retirar", icon: PackageCheck },
    { key: "entregado", label: "Retirado", icon: Store },
  ];

  useEffect(() => {
    if (orderId) {
      cargarDetalle();
    } else {
      setLoading(false);
    }

    const handleSSEUpdate = (e) => {
      const { pedido_id, estado, pedido } = e.detail || {};
      if (Number(pedido_id) === Number(orderId)) {
        // Actualizar el estado en vivo instantáneamente
        setData((prev) => {
          if (!prev || !prev.pedido) return prev;
          return {
            ...prev,
            pedido: {
              ...prev.pedido,
              estado: estado || (pedido ? pedido.estado : prev.pedido.estado),
            },
          };
        });
        // Recargar silenciosamente la orden para sincronizar datos completos
        recargarSilencioso();
      }
    };

    window.addEventListener("order_status_update", handleSSEUpdate);
    return () => {
      window.removeEventListener("order_status_update", handleSSEUpdate);
    };
  }, [orderId]);

  const recargarSilencioso = async () => {
    try {
      const res = await apiFetch(`/api/pedidos/${orderId}`);
      setData(res);
    } catch (err) {
      console.error("Error en recarga silenciosa de SSE:", err);
    }
  };

  const cargarDetalle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/pedidos/${orderId}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceiptLate = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;

    setUploadingReceipt(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const uploadRes = await apiFetch("/api/upload/comprobante", {
            method: "POST",
            body: { imagen: base64Data },
          });

          await apiFetch(`/api/pedidos/${orderId}/comprobante`, {
            method: "PATCH",
            body: { comprobante_url: uploadRes.url },
          });

          await cargarDetalle();
        } catch (err) {
          console.error("Error al subir comprobante:", err);
        } finally {
          setUploadingReceipt(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingReceipt(false);
    }
  };

  if (!orderId) {
    return (
      <div className="container py-5 text-center fade-in-up">
        <div className="glass-card p-5 max-w-md mx-auto">
          <AlertCircle size={48} className="text-gold mb-3" />
          <h2 className="text-gold mb-3">No hay pedido seleccionado</h2>
          <p className="text-muted mb-4">Selecciona un pedido desde tu historial para ver el seguimiento en tiempo real.</p>
          <button className="btn btn-gold py-2 px-4" onClick={() => setView("mis-pedidos")}>
            Ir a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  const estadoActual = data?.pedido?.estado || "pendiente";
  const esCancelado = estadoActual === "cancelado";
  const esRetiro = data?.pedido?.tipo_entrega === "retiro" ||
    (data?.pedido?.direccion_entrega && data.pedido.direccion_entrega.toLowerCase().includes("retiro"));

  const estadosOrden = esRetiro ? ESTADOS_ORDEN_RETIRO : ESTADOS_ORDEN_DELIVERY;

  const getIndiceEstado = (estado) => {
    return estadosOrden.findIndex((e) => e.key === estado);
  };

  const indiceActual = getIndiceEstado(estadoActual);

  return (
    <div className="container py-4 fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-outline-gold p-2" onClick={() => setView("mis-pedidos")}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="hero-title text-gold h2 mb-0">Seguimiento de Pedido #{orderId}</h1>
        </div>
        <button className="btn btn-outline-gold btn-sm d-flex align-items-center gap-1" onClick={cargarDetalle}>
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-gold" role="status"></div>
          <p className="text-gold mt-3">Cargando estado de la orden...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger glass-card text-center p-4">
          <p className="mb-0">{error}</p>
        </div>
      ) : data ? (
        <div className="row g-4">
          {/* Timeline de Estado */}
          <div className="col-12">
            <div className="glass-card p-4">
              <h2 className="h5 text-gold mb-4 text-center">Línea de Tiempo del Estado</h2>

              {esCancelado ? (
                <div className="alert alert-danger text-center p-4">
                  <h4 className="alert-heading fw-bold">El pedido ha sido Cancelado</h4>
                  <p className="mb-0">
                    Si tienes dudas sobre tu cancelación, contáctate con el restaurante.
                  </p>
                </div>
              ) : (
                <div className="row text-center position-relative g-3 py-3 justify-content-center">
                  {estadosOrden.map((st, idx) => {
                    const IconComponent = st.icon;
                    const esCompletado = idx <= indiceActual;
                    const esActivo = idx === indiceActual;

                    return (
                      <div key={st.key} className={esRetiro ? "col-6 col-sm-4 col-md" : "col-4 col-md-2"}>
                        <div
                          className={`d-inline-flex p-3 rounded-circle mb-2 transition-all shadow-sm ${
                            esActivo
                              ? "bg-gold text-white shadow-gold animate-pulse"
                              : esCompletado
                              ? "bg-warning-subtle text-warning border border-warning"
                              : "bg-light border border-glass text-muted"
                          }`}
                        >
                          <IconComponent size={24} />
                        </div>
                        <div
                          className={`small fw-bold ${
                            esActivo ? "text-gold" : esCompletado ? "text-dark" : "text-muted"
                          }`}
                        >
                          {st.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Banner de aviso para Retiro en Local cuando está listo */}
              {esRetiro && !esCancelado && (
                <div className="alert alert-warning border border-gold glass-card text-center p-4 mt-3 shadow-sm">
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-2 text-gold h5 fw-bold">
                    <Store size={26} /> Retiro en el Local — Restaurante Pablito
                  </div>
                  {data.pedido.estado === "listo" ? (
                    <div className="text-dark">
                      <p className="fw-bold fs-6 mb-2 text-success">
                        ¡Tu pedido está listo! Ya puedes pasar a retirarlo por nuestro restaurante.
                      </p>
                      <a
                        href="https://maps.google.com/?q=Restaurante+Pablito"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-gold btn-sm d-inline-flex align-items-center gap-2 shadow-sm mt-1"
                      >
                        <Navigation size={16} /> Abrir Ubicación del Restaurante en Google Maps
                      </a>
                    </div>
                  ) : data.pedido.estado === "entregado" ? (
                    <p className="mb-0 text-success fw-bold">
                      ✅ ¡Pedido retirado exitosamente en el restaurante! ¡Buen provecho!
                    </p>
                  ) : (
                    <p className="mb-0 text-muted small">
                      Tu pedido se está preparando en cocina. En cuanto cambie a <strong>"Listo"</strong>, podrás pasar a retirarlo directamente.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Información del pedido */}
          <div className="col-lg-6">
            <div className="glass-card p-4 h-100">
              <h3 className="h5 text-gold mb-3 border-bottom border-glass pb-2">Detalles del Pedido</h3>
              <div className="text-dark small mb-3">
                <p className="mb-1">
                  <strong>Cliente:</strong> {data.pedido.cliente_nombre} {data.pedido.cliente_apellido}
                </p>
                <p className="mb-1">
                  <strong>Modalidad de Entrega:</strong>{" "}
                  {esRetiro ? (
                    <span className="badge bg-gold text-dark fw-bold ms-1">🏪 Retiro en Local ($0.00 Envío)</span>
                  ) : (
                    <span className="badge bg-secondary text-white fw-bold ms-1">🛵 Envío a Domicilio</span>
                  )}
                </p>
                <p className="mb-1">
                  <strong>Dirección:</strong> {data.pedido.direccion_entrega}
                </p>
                {data.pedido.telefono_contacto && (
                  <p className="mb-1">
                    <strong>Teléfono Contacto:</strong> {data.pedido.telefono_contacto}
                  </p>
                )}
                <p className="mb-1">
                  <strong>Método de Pago:</strong>{" "}
                  <span className="text-capitalize">{data.pedido.metodo_pago}</span>
                </p>
                <p className="mb-1">
                  <strong>Fecha de Registro:</strong>{" "}
                  {formatFecha(data.pedido.creado_en)}
                </p>
                {data.pedido.notas && (
                  <p className="mb-1">
                    <strong>Notas:</strong> {data.pedido.notas}
                  </p>
                )}

                {data.pedido.metodo_pago === "transferencia" && (
                  <div className="mt-3 p-3 border border-glass rounded bg-white shadow-sm">
                    <strong className="d-block text-gold mb-2 small d-flex align-items-center gap-1">
                      <ImageIcon size={14} /> Comprobante de Transferencia
                    </strong>
                    {data.pedido.comprobante_url ? (
                      <div className="d-flex flex-column gap-2">
                        <div
                          className="position-relative d-inline-block rounded border border-gold shadow-sm overflow-hidden"
                          style={{ cursor: "pointer", maxWidth: "200px" }}
                          onClick={() => setShowReceiptModal(true)}
                          title="Haz clic para ampliar comprobante"
                        >
                          <img
                            src={data.pedido.comprobante_url}
                            alt="Comprobante de transferencia bancaria"
                            className="img-fluid rounded"
                            style={{ maxHeight: "160px", objectFit: "contain", width: "100%" }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-gold d-inline-flex align-items-center gap-1 w-auto"
                          style={{ width: "fit-content" }}
                          onClick={() => setShowReceiptModal(true)}
                        >
                          <ZoomIn size={14} /> Ver comprobante ampliado
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="extra-small text-muted mb-2">
                          Aún no has subido la foto de tu comprobante bancario.
                        </p>
                        <label
                          htmlFor="uploadLateReceiptInput"
                          className={`btn btn-sm btn-gold d-flex align-items-center gap-1 w-100 justify-content-center ${
                            uploadingReceipt ? "disabled" : ""
                          }`}
                          style={{ cursor: "pointer" }}
                        >
                          <Upload size={14} />
                          {uploadingReceipt ? "Subiendo comprobante..." : "Subir Comprobante Ahora"}
                        </label>
                        <input
                          type="file"
                          id="uploadLateReceiptInput"
                          accept="image/*"
                          className="d-none"
                          onChange={handleUploadReceiptLate}
                          disabled={uploadingReceipt}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items solicitados */}
          <div className="col-lg-6">
            <div className="glass-card p-4 h-100">
              <h3 className="h5 text-gold mb-3 border-bottom border-glass pb-2">Platos Solicitados</h3>
              <div className="d-flex flex-column gap-2 mb-3">
                {data.items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-glass rounded bg-white shadow-sm d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <span className="fw-bold text-gold me-2">{item.cantidad}x</span>
                      <span className="text-dark fw-bold">{item.producto_nombre}</span>
                      {item.notas && <div className="text-muted extra-small">"{item.notas}"</div>}
                    </div>
                    <span className="text-gold fw-bold fs-6">${Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-top border-glass pt-3 text-dark small">
                <div className="d-flex justify-content-between mb-1">
                  <span>Subtotal</span>
                  <span>${Number(data.pedido.subtotal).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>IVA</span>
                  <span>${Number(data.pedido.impuesto).toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold text-gold fs-5 border-top border-glass pt-2 mt-2">
                  <span>Total</span>
                  <span>${Number(data.pedido.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal Lightbox Elegante para Ver Comprobante Ampliado */}
      {showReceiptModal && data?.pedido?.comprobante_url &&
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
                    <ImageIcon size={20} /> Comprobante de Pago — Pedido #{orderId}
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
                    src={data.pedido.comprobante_url}
                    alt="Comprobante de pago completo"
                    className="img-fluid rounded border border-glass shadow-sm"
                    style={{ maxHeight: "70vh", objectFit: "contain", maxWidth: "100%" }}
                  />
                </div>
                <div className="modal-footer border-top border-glass p-2 bg-white justify-content-between">
                  <span className="extra-small text-muted">
                    Comprobante de transferencia bancaria
                  </span>
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
