import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import { Filter, Eye, RefreshCw, CheckCircle, Clock } from "lucide-react";

export default function AdminOrdersView({ addAlert }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");

  const [selectedPedido, setSelectedPedido] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const ESTADOS_DISPONIBLES = [
    { value: "pendiente", label: "Pendiente" },
    { value: "confirmado", label: "Confirmado" },
    { value: "en_preparacion", label: "En Preparación" },
    { value: "listo", label: "Listo para Entrega" },
    { value: "en_camino", label: "En Camino" },
    { value: "entregado", label: "Entregado" },
    { value: "cancelado", label: "Cancelado" },
  ];

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado]);

  const cargarPedidos = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filtroEstado ? `/api/pedidos?estado=${filtroEstado}` : "/api/pedidos";
      const res = await apiFetch(url);
      setPedidos(res.pedidos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      await apiFetch(`/api/pedidos/${pedidoId}/estado`, {
        method: "PATCH",
        body: { estado: nuevoEstado },
      });
      if (addAlert) {
        addAlert(`Estado del pedido #${pedidoId} cambiado a '${nuevoEstado}'`, "success");
      }
      cargarPedidos();
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
    }
  };

  const handleVerDetalle = async (pedidoId) => {
    setModalLoading(true);
    try {
      const res = await apiFetch(`/api/pedidos/${pedidoId}`);
      setSelectedPedido(res);
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="container py-4 fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="hero-title text-gold h2 mb-1">Gestión de Pedidos</h1>
          <p className="hero-subtitle text-muted mb-0">Control y cambio de estados de todos los pedidos.</p>
        </div>
        <button className="btn btn-outline-gold d-flex align-items-center gap-1" onClick={cargarPedidos}>
          <RefreshCw size={16} />
          Refrescar
        </button>
      </div>

      {/* Filtro por estado */}
      <div className="glass-card p-3 mb-4 d-flex align-items-center gap-3 overflow-auto">
        <span className="text-gold small fw-bold d-flex align-items-center gap-1 me-2">
          <Filter size={16} /> Filtrar por estado:
        </span>
        <button
          className={`btn btn-sm ${filtroEstado === "" ? "btn-gold" : "btn-outline-gold"}`}
          onClick={() => setFiltroEstado("")}
        >
          Todos los estados
        </button>
        {ESTADOS_DISPONIBLES.map((st) => (
          <button
            key={st.value}
            className={`btn btn-sm ${filtroEstado === st.value ? "btn-gold" : "btn-outline-gold"}`}
            onClick={() => setFiltroEstado(st.value)}
          >
            {st.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-gold" role="status"></div>
          <p className="text-gold mt-3">Cargando pedidos de clientes...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger glass-card text-center p-4">
          <p className="mb-0">{error}</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="glass-card text-center py-5">
          <p className="text-muted">No hay pedidos registrados con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="table-responsive glass-card p-3">
          <table className="table table-dark table-hover align-middle mb-0 bg-transparent">
            <thead>
              <tr className="text-gold border-bottom border-glass">
                <th># ID</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Dirección</th>
                <th>Total</th>
                <th>Estado Actual</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((ped) => (
                <tr key={ped.id} className="border-bottom border-glass">
                  <td className="fw-bold text-gold">#{ped.id}</td>
                  <td>
                    <div className="fw-bold text-light">
                      {ped.cliente_nombre} {ped.cliente_apellido}
                    </div>
                    <div className="text-muted extra-small">{ped.cliente_correo}</div>
                  </td>
                  <td className="small text-muted">{new Date(ped.creado_en).toLocaleString()}</td>
                  <td className="small text-light">{ped.direccion_entrega}</td>
                  <td className="fw-bold text-gold">${Number(ped.total).toFixed(2)}</td>
                  <td>
                    <select
                      className="form-select form-select-sm bg-dark text-gold border-glass"
                      value={ped.estado}
                      onChange={(e) => handleCambiarEstado(ped.id, e.target.value)}
                    >
                      {ESTADOS_DISPONIBLES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-gold p-2"
                      onClick={() => handleVerDetalle(ped.id)}
                      title="Ver detalle del pedido"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalle de Pedido */}
      {selectedPedido && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-card border-glass text-light">
              <div className="modal-header border-bottom border-glass">
                <h5 className="modal-title text-gold fw-bold">
                  Detalle del Pedido #{selectedPedido.pedido?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedPedido(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Cliente:</strong> {selectedPedido.pedido?.cliente_nombre}{" "}
                      {selectedPedido.pedido?.cliente_apellido}
                    </p>
                    <p className="mb-1">
                      <strong>Correo:</strong> {selectedPedido.pedido?.cliente_correo}
                    </p>
                    <p className="mb-1">
                      <strong>Dirección:</strong> {selectedPedido.pedido?.direccion_entrega}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p className="mb-1">
                      <strong>Teléfono Contacto:</strong> {selectedPedido.pedido?.telefono_contacto || "N/A"}
                    </p>
                    <p className="mb-1">
                      <strong>Método Pago:</strong>{" "}
                      <span className="text-capitalize">{selectedPedido.pedido?.metodo_pago}</span>
                    </p>
                    <p className="mb-1">
                      <strong>Fecha:</strong>{" "}
                      {new Date(selectedPedido.pedido?.creado_en).toLocaleString()}
                    </p>
                  </div>
                </div>

                <h6 className="text-gold fw-bold mb-3">Ítems Solicitados:</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-dark table-sm bg-transparent">
                    <thead>
                      <tr className="text-muted border-bottom border-glass">
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>P. Unitario</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPedido.items?.map((it) => (
                        <tr key={it.id}>
                          <td>
                            {it.producto_nombre}
                            {it.notas && <div className="text-muted extra-small">"{it.notas}"</div>}
                          </td>
                          <td>{it.cantidad}</td>
                          <td>${Number(it.precio_unitario).toFixed(2)}</td>
                          <td className="text-gold">${Number(it.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-end text-gold fs-5 fw-bold pt-2 border-top border-glass">
                  Total Pedido: ${Number(selectedPedido.pedido?.total).toFixed(2)}
                </div>
              </div>
              <div className="modal-footer border-top border-glass">
                <button
                  type="button"
                  className="btn btn-outline-gold"
                  onClick={() => setSelectedPedido(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
