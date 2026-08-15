import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../../api/client";
import { formatFecha } from "../../utils/dateUtils";
import Pagination from "../Pagination";
import {
  Filter,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  ZoomIn,
} from "lucide-react";

export default function AdminOrdersView({ addAlert }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [receiptLightboxUrl, setReceiptLightboxUrl] = useState(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detalle del pedido modal
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

  const [repartidoresList, setRepartidoresList] = useState([]);

  useEffect(() => {
    cargarPedidos(page, limit);
    cargarRepartidores();

    const handleRealtimeUpdate = (e) => {
      const { pedido_id, estado } = e.detail || {};

      // Recargar automáticamente la grilla de pedidos en vivo
      cargarPedidos(page, limit);

      // Si la ventana de detalle está abierta, actualizar su estado en tiempo real
      setSelectedPedido((prev) => {
        if (prev && prev.pedido && Number(prev.pedido.id) === Number(pedido_id)) {
          return {
            ...prev,
            pedido: { ...prev.pedido, estado: estado || prev.pedido.estado },
          };
        }
        return prev;
      });
    };

    window.addEventListener("order_status_update", handleRealtimeUpdate);
    return () => window.removeEventListener("order_status_update", handleRealtimeUpdate);
  }, [page, limit, filtroEstado]);

  const cargarRepartidores = async () => {
    try {
      const res = await apiFetch("/api/repartidores");
      if (res && res.repartidores) {
        setRepartidoresList(res.repartidores);
      }
    } catch (err) {
      console.warn("No se pudo cargar la lista de repartidores:", err);
    }
  };

  const cargarPedidos = async (pg = page, lm = limit) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/pedidos?page=${pg}&limit=${lm}`;
      if (filtroEstado) {
        url += `&estado=${filtroEstado}`;
      }
      const data = await apiFetch(url);

      if (Array.isArray(data)) {
        setPedidos(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        setPedidos(data.pedidos || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError("No se pudieron cargar los pedidos: " + err.message);
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
      setFiltroEstado(nuevoEstado);
      setPage(1);
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
    }
  };

  const handleCambiarRepartidor = async (pedidoId, repartidorIdStr) => {
    try {
      const repartidor_id = repartidorIdStr ? parseInt(repartidorIdStr, 10) : null;
      await apiFetch(`/api/pedidos/${pedidoId}/repartidor`, {
        method: "PATCH",
        body: { repartidor_id },
      });
      if (addAlert) {
        addAlert(`Motorizado asignado con éxito al pedido #${pedidoId}`, "success");
      }
      cargarPedidos(page, limit);
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
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="hero-title text-gold h2 mb-1">Gestión de Pedidos</h1>
          <p className="hero-subtitle text-muted mb-0">
            Control de preparación, estado de pedidos y entregas en tiempo real.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-gold d-flex align-items-center gap-1 fw-bold"
            onClick={() => cargarPedidos()}
          >
            <RefreshCw size={16} />
            Refrescar
          </button>
        </div>
      </div>

      {/* Filtro por estado */}
      <div className="glass-card p-3 mb-4 d-flex align-items-center gap-2 overflow-auto">
        <span className="text-gold small fw-bold d-flex align-items-center gap-1 me-2 shrink-0">
          <Filter size={16} /> Estado:
        </span>
        <button
          className={`btn btn-sm ${filtroEstado === "" ? "btn-gold" : "btn-outline-gold"}`}
          onClick={() => setFiltroEstado("")}
        >
          Todos
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
        <>
          <div className="table-responsive table-custom-container">
            <table className="table-custom align-middle">
              <thead>
                <tr>
                  <th># ID</th>
                  <th>Cliente</th>
                  <th>Repartidor Asignado</th>
                  <th>Fecha</th>
                  <th>Dirección y Notas</th>
                  <th>Total</th>
                  <th>Estado Actual</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((ped) => (
                  <tr key={ped.id}>
                    <td className="fw-bold text-gold fs-6">#{ped.id}</td>
                    <td>
                      <div className="fw-bold text-dark fs-6">
                        {ped.cliente_nombre} {ped.cliente_apellido}
                      </div>
                      <div className="text-muted extra-small">{ped.cliente_correo}</div>
                    </td>
                    <td>
                      {(ped.tipo_entrega === "retiro" || (ped.direccion_entrega && ped.direccion_entrega.toLowerCase().includes("retiro"))) ? (
                        <span className="badge bg-warning text-dark fw-bold p-2 d-inline-flex align-items-center gap-1 shadow-sm">
                          🏪 Retiro en Local ($0.00 Envío)
                        </span>
                      ) : (
                        <select
                          className="form-select form-select-sm bg-white text-dark border-glass fw-bold shadow-sm"
                          value={ped.repartidor_id || ""}
                          onChange={(e) => handleCambiarRepartidor(ped.id, e.target.value)}
                          style={{ minWidth: "150px", cursor: "pointer" }}
                        >
                          <option value="">⏳ Sin Asignar (En Cola)</option>
                          {repartidoresList.map((rep) => (
                            <option key={rep.id} value={rep.id}>
                              🛵 {rep.nombre} {rep.apellido}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="small text-muted">{formatFecha(ped.creado_en)}</td>
                    <td className="small text-dark fw-medium" style={{ maxWidth: "240px" }}>
                      <div>{ped.direccion_entrega}</div>
                      {ped.notas && (
                        <div className="text-muted extra-small fst-italic mt-1" title="Notas del cliente">
                          📝 "{ped.notas}"
                        </div>
                      )}
                    </td>
                    <td className="fw-bold text-gold fs-6">${Number(ped.total).toFixed(2)}</td>
                    <td>
                      <select
                        className="form-select form-select-sm bg-white text-dark border-glass fw-bold shadow-sm"
                        value={ped.estado}
                        onChange={(e) => handleCambiarEstado(ped.id, e.target.value)}
                        style={{ cursor: "pointer" }}
                      >
                        {ESTADOS_DISPONIBLES.map((st) => (
                          <option key={st.value} value={st.value}>
                            {st.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          className="btn btn-sm btn-outline-gold p-1 px-2"
                          onClick={() => handleVerDetalle(ped.id)}
                          title="Ver detalle del pedido"
                        >
                          <Eye size={16} /> Ver Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={(newPage) => {
              setPage(newPage);
              cargarPedidos(newPage, limit);
            }}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
              cargarPedidos(1, newLimit);
            }}
          />
        </>
      )}

      {/* Modal: Detalle del Pedido */}
      {selectedPedido &&
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
              backgroundColor: "rgba(42, 34, 31, 0.75)",
              backdropFilter: "blur(5px)",
              zIndex: 1060,
              overflowY: "auto",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPedido(null);
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content glass-card shadow-lg border-glass text-dark">
                <div className="modal-header border-bottom border-glass p-3 bg-light">
                  <h5 className="modal-title text-gold fw-bold fs-5 m-0 d-flex align-items-center gap-2">
                    Detalle del Pedido #{selectedPedido.pedido?.id}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedPedido(null)}
                  ></button>
                </div>
                <div className="modal-body p-4 text-dark">
                  <div className="row g-3 mb-3 p-3 bg-light rounded border border-glass">
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
                        <strong>Fecha:</strong> {formatFecha(selectedPedido.pedido?.creado_en)}
                      </p>
                    </div>
                  </div>

                  {selectedPedido.pedido?.notas && (
                    <div className="alert alert-warning text-dark border-warning p-3 mb-4 shadow-sm">
                      <strong className="d-block mb-1 text-gold">📝 Notas Adicionales del Cliente:</strong>
                      <span className="fst-italic">"{selectedPedido.pedido.notas}"</span>
                    </div>
                  )}

                  {/* Comprobante de transferencia bancaria */}
                  {selectedPedido.pedido?.metodo_pago === "transferencia" && (
                    <div className="alert alert-info text-dark border-info p-3 mb-4 shadow-sm bg-white">
                      <strong className="d-block mb-2 text-gold d-flex align-items-center gap-1">
                        <ImageIcon size={16} /> Comprobante de Pago por Transferencia:
                      </strong>
                      {selectedPedido.pedido.comprobante_url ? (
                        <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
                          <div
                            className="flex-shrink-0 position-relative rounded border border-gold shadow-sm overflow-hidden"
                            style={{ cursor: "pointer", maxWidth: "200px" }}
                            onClick={() => setReceiptLightboxUrl(selectedPedido.pedido.comprobante_url)}
                            title="Haz clic para ver el comprobante en pantalla completa"
                          >
                            <img
                              src={selectedPedido.pedido.comprobante_url}
                              alt="Comprobante de pago"
                              className="img-fluid rounded"
                              style={{ maxHeight: "150px", objectFit: "contain", width: "100%" }}
                            />
                          </div>
                          <div>
                            <span className="badge bg-success text-white mb-2">Comprobante Adjunto</span>
                            <p className="small mb-2 text-muted">
                              Verifica el valor transferido y número de comprobante antes de aprobar el pedido.
                            </p>
                            <button
                              type="button"
                              className="btn btn-sm btn-gold d-inline-flex align-items-center gap-1"
                              onClick={() => setReceiptLightboxUrl(selectedPedido.pedido.comprobante_url)}
                            >
                              <ZoomIn size={14} /> Ver Comprobante Ampliado
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-danger fw-bold small">
                          ⚠️ El cliente seleccionó transferencia bancaria pero aún no ha adjuntado el comprobante.
                        </div>
                      )}
                    </div>
                  )}

                  <h6 className="text-gold fw-bold mb-3">Ítems Solicitados:</h6>
                  <div className="table-responsive mb-3">
                    <table className="table table-hover align-middle mb-0">
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
                              <span className="fw-bold">{it.producto_nombre}</span>
                              {it.notas && <div className="text-muted extra-small">"{it.notas}"</div>}
                            </td>
                            <td>{it.cantidad}</td>
                            <td>${Number(it.precio_unitario).toFixed(2)}</td>
                            <td className="text-gold fw-bold">${Number(it.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top border-glass">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setSelectedPedido(null)}
                    >
                      Cerrar
                    </button>
                    <div className="text-gold fs-5 fw-bold">
                      Total: ${Number(selectedPedido.pedido?.total).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Lightbox Administrador para Ver Comprobante Ampliado */}
      {receiptLightboxUrl &&
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
            onClick={() => setReceiptLightboxUrl(null)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "520px", width: "95%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content glass-card border-glass shadow-lg text-dark overflow-hidden bg-white">
                <div className="modal-header border-bottom border-glass p-3 bg-white d-flex align-items-center justify-content-between">
                  <h5 className="modal-title text-gold fw-bold fs-5 m-0 d-flex align-items-center gap-2">
                    <ImageIcon size={20} /> Comprobante de Pago — Pedido #{selectedPedido?.pedido?.id}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setReceiptLightboxUrl(null)}
                  ></button>
                </div>
                <div
                  className="modal-body p-3 text-center d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "var(--sand-input)", maxHeight: "75vh", overflow: "auto" }}
                >
                  <img
                    src={receiptLightboxUrl}
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
                    onClick={() => setReceiptLightboxUrl(null)}
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
