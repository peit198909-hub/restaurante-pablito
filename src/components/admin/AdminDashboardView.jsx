import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import { DollarSign, ShoppingBag, TrendingUp, PackageCheck, Clock, Award, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

export default function AdminDashboardView({ setView, addAlert }) {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/pedidos/dashboard");
      if (res && res.metricas) {
        setMetricas(res.metricas);
      }
    } catch (err) {
      setError("Error cargando dashboard: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();

    const handleRealtimeUpdate = () => {
      cargarDashboard();
    };

    window.addEventListener("order_status_update", handleRealtimeUpdate);
    return () => window.removeEventListener("order_status_update", handleRealtimeUpdate);
  }, []);

  if (loading) {
    return (
      <div className="container py-5 text-center fade-in-up">
        <div className="spinner-border text-gold" style={{ width: "3rem", height: "3rem" }} role="status"></div>
        <p className="text-gold mt-3">Cargando métricas y ventas en tiempo real...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger glass-card p-4">
          <AlertCircle size={32} className="mb-2" />
          <p className="mb-0">{error}</p>
        </div>
      </div>
    );
  }

  const {
    totalVentas = 0,
    ventasHoy = 0,
    entregadosCount = 0,
    activosCount = 0,
    canceladosCount = 0,
    totalPedidos = 0,
    ticketPromedio = 0,
    topProductos = [],
  } = metricas || {};

  return (
    <div className="container py-4 fade-in-up">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="hero-title text-gold h2 mb-1">Dashboard Analítico de Ventas</h1>
          <p className="hero-subtitle text-muted mb-0">Resumen de ingresos, actividad y platos preferidos.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-gold d-flex align-items-center gap-1 fw-bold" onClick={cargarDashboard}>
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Fila de Tarjetas KPI */}
      <div className="row g-3 mb-4">
        {/* Total Ventas */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-4 h-100 border-gold border-start border-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-uppercase">Ingresos Totales</span>
              <div className="p-2 bg-warning bg-opacity-20 text-gold rounded-circle">
                <DollarSign size={20} />
              </div>
            </div>
            <h2 className="text-gold fw-bold display-6 mb-0">${Number(totalVentas).toFixed(2)}</h2>
            <div className="small text-muted mt-2 d-flex align-items-center gap-1">
              <TrendingUp size={14} className="text-success" />
              <span>De {entregadosCount} pedidos entregados</span>
            </div>
          </div>
        </div>

        {/* Ventas Hoy */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-4 h-100 border-success border-start border-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-uppercase">Ventas de Hoy</span>
              <div className="p-2 bg-success bg-opacity-20 text-success rounded-circle">
                <TrendingUp size={20} />
              </div>
            </div>
            <h2 className="text-success fw-bold display-6 mb-0">${Number(ventasHoy).toFixed(2)}</h2>
            <div className="small text-muted mt-2">Jornada actual del día</div>
          </div>
        </div>

        {/* Pedidos Activos */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-4 h-100 border-info border-start border-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-uppercase">Pedidos en Curso</span>
              <div className="p-2 bg-info bg-opacity-20 text-info rounded-circle">
                <Clock size={20} />
              </div>
            </div>
            <h2 className="text-dark fw-bold display-6 mb-0">{activosCount}</h2>
            <div className="small text-muted mt-2">En preparación / despacho</div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="glass-card p-4 h-100 border-secondary border-start border-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted extra-small fw-bold text-uppercase">Ticket Promedio</span>
              <div className="p-2 bg-dark bg-opacity-20 text-dark rounded-circle">
                <ShoppingBag size={20} />
              </div>
            </div>
            <h2 className="text-dark fw-bold display-6 mb-0">${Number(ticketPromedio).toFixed(2)}</h2>
            <div className="small text-muted mt-2">Valor promedio por entrega</div>
          </div>
        </div>
      </div>

      {/* Fila Inferior: Platos Más Vendidos y Accesos Rápidos */}
      <div className="row g-4">
        {/* Tabla de Top Productos */}
        <div className="col-lg-8">
          <div className="glass-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-glass pb-2">
              <h5 className="text-gold fw-bold m-0 d-flex align-items-center gap-2">
                <Award size={20} /> Platos Más Vendidos
              </h5>
              <span className="badge bg-gold text-dark font-mono">Top {topProductos.length}</span>
            </div>

            {topProductos.length === 0 ? (
              <p className="text-muted small text-center py-4">Aún no hay platos entregados para calcular estadísticas.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr className="text-muted extra-small">
                      <th>Plato</th>
                      <th>Categoría</th>
                      <th>Vendidos</th>
                      <th className="text-end">Ingresos Totales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductos.map((prod, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={prod.imagen_url}
                              alt={prod.nombre}
                              className="rounded shadow-sm"
                              style={{ width: "40px", height: "40px", objectFit: "cover" }}
                            />
                            <span className="fw-bold text-dark">{prod.nombre}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border border-glass">{prod.categoria}</span>
                        </td>
                        <td className="fw-bold text-dark">{prod.total_vendidos} unidades</td>
                        <td className="text-end text-gold fw-bold">${Number(prod.total_ingresos).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Panel de Atajos de Administración */}
        <div className="col-lg-4">
          <div className="glass-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="text-gold fw-bold mb-3 border-bottom border-glass pb-2">Acciones Rápidas</h5>
              <div className="d-grid gap-3">
                <button
                  className="btn btn-gold py-3 text-start d-flex align-items-center justify-content-between px-3 fw-bold shadow-sm"
                  onClick={() => setView("admin-pedidos")}
                >
                  <span className="d-flex align-items-center gap-2">
                    <PackageCheck size={18} />
                    Gestión de Pedidos ({activosCount} activos)
                  </span>
                  <ArrowRight size={18} />
                </button>

                <button
                  className="btn btn-outline-gold py-3 text-start d-flex align-items-center justify-content-between px-3 fw-bold"
                  onClick={() => setView("admin-productos")}
                >
                  <span className="d-flex align-items-center gap-2">
                    <ShoppingBag size={18} />
                    Administrar Menú de Platos
                  </span>
                  <ArrowRight size={18} />
                </button>

                <button
                  className="btn btn-outline-gold py-3 text-start d-flex align-items-center justify-content-between px-3 fw-bold"
                  onClick={() => setView("admin-config")}
                >
                  <span className="d-flex align-items-center gap-2">
                    <Clock size={18} />
                    Configurar Horarios y Delivery
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-dark bg-opacity-50 rounded border border-glass text-gold small">
              <strong>💡 Tip Profesional:</strong>
              <p className="mb-0 text-muted extra-small mt-1">
                Los usuarios con rol 'Repartidor' pueden iniciar sesión en la web para visualizar y gestionar sus entregas asignadas en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
