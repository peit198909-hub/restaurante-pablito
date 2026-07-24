import React, { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { ArrowLeft, Clock, CheckCircle2, PackageCheck, Utensils, Truck, Home, AlertCircle, RefreshCw } from "lucide-react";

export default function OrderTrackingView({ orderId, setView }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ESTADOS_ORDEN = [
    { key: "pendiente", label: "Pendiente", icon: Clock },
    { key: "confirmado", label: "Confirmado", icon: CheckCircle2 },
    { key: "en_preparacion", label: "En Preparación", icon: Utensils },
    { key: "listo", label: "Listo", icon: PackageCheck },
    { key: "en_camino", label: "En Camino", icon: Truck },
    { key: "entregado", label: "Entregado", icon: Home },
  ];

  useEffect(() => {
    if (orderId) {
      cargarDetalle();
    } else {
      setLoading(false);
    }
  }, [orderId]);

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

  const getIndiceEstado = (estado) => {
    return ESTADOS_ORDEN.findIndex((e) => e.key === estado);
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
                <div className="row text-center position-relative g-3 py-3">
                  {ESTADOS_ORDEN.map((st, idx) => {
                    const IconComponent = st.icon;
                    const esCompletado = idx <= indiceActual;
                    const esActivo = idx === indiceActual;

                    return (
                      <div key={st.key} className="col-4 col-md-2">
                        <div
                          className={`d-inline-flex p-3 rounded-circle mb-2 transition-all ${
                            esActivo
                              ? "bg-gold text-dark shadow-gold animate-pulse"
                              : esCompletado
                              ? "bg-gold-subtle text-gold border border-gold"
                              : "bg-dark border border-glass text-muted opacity-50"
                          }`}
                        >
                          <IconComponent size={24} />
                        </div>
                        <div
                          className={`small fw-bold ${
                            esActivo ? "text-gold" : esCompletado ? "text-light" : "text-muted opacity-50"
                          }`}
                        >
                          {st.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Información del pedido */}
          <div className="col-lg-6">
            <div className="glass-card p-4 h-100">
              <h3 className="h5 text-gold mb-3 border-bottom border-glass pb-2">Detalles del Pedido</h3>
              <div className="text-light small mb-3">
                <p className="mb-1">
                  <strong>Cliente:</strong> {data.pedido.cliente_nombre} {data.pedido.cliente_apellido}
                </p>
                <p className="mb-1">
                  <strong>Dirección de Entrega:</strong> {data.pedido.direccion_entrega}
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
                  {new Date(data.pedido.creado_en).toLocaleString()}
                </p>
                {data.pedido.notas && (
                  <p className="mb-1">
                    <strong>Notas:</strong> {data.pedido.notas}
                  </p>
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
                    className="p-2 border border-glass rounded bg-dark bg-opacity-50 d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <span className="fw-bold text-gold me-2">{item.cantidad}x</span>
                      <span className="text-light">{item.producto_nombre}</span>
                      {item.notas && <div className="text-muted extra-small">"{item.notas}"</div>}
                    </div>
                    <span className="text-gold fw-bold">${Number(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-top border-glass pt-3 text-light small">
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
    </div>
  );
}
