import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import { Plus, Edit, Eye, EyeOff, Utensils, X, Save } from "lucide-react";

export default function AdminProductsView({ addAlert }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "Platos Principales",
    imagen_url: "",
    disponible: true,
  });

  const [submitting, setSubmitting] = useState(false);

  const CATEGORIAS_OPCIONES = [
    "Platos Principales",
    "Bebidas",
    "Postres",
    "Entradas",
    "Combos",
  ];

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/productos/admin");
      setProductos(res.productos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nombre: "",
      descripcion: "",
      precio: "",
      categoria: "Platos Principales",
      imagen_url: "",
      disponible: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingId(prod.id);
    setFormData({
      nombre: prod.nombre,
      descripcion: prod.descripcion || "",
      precio: prod.precio,
      categoria: prod.categoria,
      imagen_url: prod.imagen_url || "",
      disponible: Boolean(prod.disponible),
    });
    setShowModal(true);
  };

  const handleToggleDisponibilidad = async (prod) => {
    try {
      const nuevoEstado = !prod.disponible;
      await apiFetch(`/api/productos/${prod.id}/disponibilidad`, {
        method: "PATCH",
        body: { disponible: nuevoEstado },
      });
      if (addAlert) {
        addAlert(
          `Producto "${prod.nombre}" ahora está ${nuevoEstado ? "Disponible" : "No disponible"}`,
          "info"
        );
      }
      cargarProductos();
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const precioNum = parseFloat(formData.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      if (addAlert) addAlert("El precio debe ser mayor a 0", "danger");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        precio: precioNum,
      };

      if (editingId) {
        await apiFetch(`/api/productos/${editingId}`, {
          method: "PUT",
          body: payload,
        });
        if (addAlert) addAlert("Producto actualizado con éxito", "success");
      } else {
        await apiFetch("/api/productos", {
          method: "POST",
          body: payload,
        });
        if (addAlert) addAlert("Producto creado con éxito", "success");
      }

      setShowModal(false);
      cargarProductos();
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4 fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="hero-title text-gold h2 mb-1">Administración del Menú</h1>
          <p className="hero-subtitle text-muted mb-0">Gestiona los productos y su disponibilidad.</p>
        </div>
        <button className="btn btn-gold d-flex align-items-center gap-2" onClick={handleOpenCreate}>
          <Plus size={18} />
          Nuevo Producto
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-gold" role="status"></div>
          <p className="text-gold mt-3">Cargando catálogo completo...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger glass-card text-center p-4">
          <p className="mb-0">{error}</p>
        </div>
      ) : (
        <div className="table-responsive glass-card p-3">
          <table className="table table-dark table-hover align-middle mb-0 bg-transparent">
            <thead>
              <tr className="text-gold border-bottom border-glass">
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod) => (
                <tr key={prod.id} className="border-bottom border-glass">
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          className="rounded object-fit-cover"
                          style={{ width: "45px", height: "45px" }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="bg-dark p-2 rounded text-gold">
                          <Utensils size={24} />
                        </div>
                      )}
                      <div>
                        <div className="fw-bold text-light">{prod.nombre}</div>
                        <div className="text-muted extra-small text-truncate" style={{ maxWidth: "250px" }}>
                          {prod.descripcion}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-dark border border-gold text-gold">{prod.categoria}</span>
                  </td>
                  <td className="fw-bold text-gold">${Number(prod.precio).toFixed(2)}</td>
                  <td>
                    {prod.disponible ? (
                      <span className="badge bg-success">Disponible</span>
                    ) : (
                      <span className="badge bg-secondary">No Disponible</span>
                    )}
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-sm btn-outline-gold p-2"
                        onClick={() => handleOpenEdit(prod)}
                        title="Editar producto"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={`btn btn-sm ${prod.disponible ? "btn-outline-warning" : "btn-outline-success"} p-2`}
                        onClick={() => handleToggleDisponibilidad(prod)}
                        title={prod.disponible ? "Desactivar disponibilidad" : "Activar disponibilidad"}
                      >
                        {prod.disponible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para Crear / Editar Producto */}
      {showModal && (
        <div className="modal show d-block bg-dark bg-opacity-75" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card border-glass text-light">
              <div className="modal-header border-bottom border-glass">
                <h5 className="modal-title text-gold fw-bold">
                  {editingId ? "Editar Producto" : "Nuevo Producto"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-gold small">Nombre del Producto *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-gold small">Descripción</label>
                    <textarea
                      className="form-input"
                      rows="2"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label text-gold small">Precio ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-input"
                        value={formData.precio}
                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-gold small">Categoría *</label>
                      <select
                        className="form-input"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      >
                        {CATEGORIAS_OPCIONES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-gold small">URL de Imagen (Opcional)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      value={formData.imagen_url}
                      onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                    />
                  </div>

                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="disponibleCheck"
                      checked={formData.disponible}
                      onChange={(e) => setFormData({ ...formData, disponible: e.target.checked })}
                    />
                    <label className="form-check-label text-light small" htmlFor="disponibleCheck">
                      Disponible para venta inmediata
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-top border-glass">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-gold d-flex align-items-center gap-1" disabled={submitting}>
                    <Save size={16} />
                    {submitting ? "Guardando..." : "Guardar Producto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
