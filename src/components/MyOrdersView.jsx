import React, { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { Package, Clock, Eye, ShoppingBag } from "lucide-react";

export default function MyOrdersView({ setView, onSetCurrentOrderId }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/pedidos/mis-pedidos");
      setPedidos(res.pedidos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case "pendiente":
        return <span className="badge bg-warning text-dark">Pendiente</span>;
      case "confirmado":
        return <span className="badge bg-info text-dark">Confirmado</span>;
      case "en_preparacion":
        return <span className="badge bg-primary text-light">En Preparación</span>;
      case "listo":
        return <span className="badge bg-secondary text-light">Listo para Entrega</span>;
      case "en_camino":
        return <span className="badge bg-purple text-light" style={{ backgroundColor: "#8a2be2" }}>En Camino</span>;
      case "entregado":
        return <span className="badge bg-success">Entregado</span>;
      case "cancelado":
        return <span className="badge bg-danger">Cancelado</span>;
      default:
        return <span className="badge bg-secondary">{estado}</span>;
    }
  };

  return (
    <div className="container py-4 fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="hero-title text-gold h2 mb-1">Mis Pedidos</h1>
          <p className="hero-subtitle text-muted mb-0">Historial completo de tus pedidos realizados.</p>
        </div>
        <button className="btn btn-outline-gold" onClick={() => setView("menu")}>
          <ShoppingBag size={18} className="me-2" />
          Hacer Nuevo Pedido
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-gold" role="status"></div>
          <p className="text-gold mt-3">Cargando tu historial de pedidos...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger glass-card text-center p-4">
          <p className="mb-0">{error}</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="glass-card text-center py-5">
          <Package size={48} className="text-gold mb-3 opacity-50" />
          <h3 className="text-gold">No has realizado pedidos aún</h3>
          <p className="text-muted mb-4">¡Pide tus platos favoritos en nuestro menú ahora!</p>
          <button className="btn btn-gold py-2 px-4" onClick={() => setView("menu")}>
            Ir al Menú
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="col-12 col-md-6 col-lg-4">
              <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between border-glass">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-glass pb-2">
                    <span className="fw-bold text-gold fs-5">Pedido #{pedido.id}</span>
                    {getStatusBadge(pedido.estado)}
                  </div>

                  <div className="text-muted small mb-2 d-flex align-items-center gap-1">
                    <Clock size={14} />
                    {new Date(pedido.creado_en).toLocaleString()}
                  </div>

                  <div className="text-light small mb-3">
                    <div>
                      <strong>Dirección:</strong> {pedido.direccion_entrega}
                    </div>
                    <div>
                      <strong>Ítems:</strong> {pedido.total_items || 1} producto(s)
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-top border-glass d-flex align-items-center justify-content-between mt-auto">
                  <div>
                    <span className="text-muted extra-small d-block">Total</span>
                    <span className="fw-bold text-gold fs-5">${Number(pedido.total).toFixed(2)}</span>
                  </div>

                  <button
                    className="btn btn-gold btn-sm d-flex align-items-center gap-1"
                    onClick={() => {
                      onSetCurrentOrderId(pedido.id);
                      setView("seguimiento");
                    }}
                  >
                    <Eye size={16} />
                    Ver Seguimiento
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
