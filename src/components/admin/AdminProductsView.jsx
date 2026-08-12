import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../../api/client";
import Pagination from "../Pagination";
import { Plus, Edit, Eye, EyeOff, Utensils, X, Save, Upload, Image, CheckCircle2, Folder, FolderPlus, Trash2 } from "lucide-react";

export default function AdminProductsView({ addAlert }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Estados de paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "Platos Principales",
    imagen_url: "",
    disponible: true,
    stock: 50,
  });

  const [submitting, setSubmitting] = useState(false);

  // Estados de Gestión de Categorías
  const [categoriasList, setCategoriasList] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catFormData, setCatFormData] = useState({
    nombre: "",
    descripcion: "",
    orden: 1,
    activa: true,
  });
  const [catPage, setCatPage] = useState(1);
  const catLimit = 5;
  const [submittingCat, setSubmittingCat] = useState(false);

  const DEFAULT_CATEGORIAS = [
    "Platos Principales",
    "Bebidas",
    "Postres",
    "Entradas",
    "Combos",
  ];

  const listaCategoriasOpciones = Array.from(
    new Set([
      ...DEFAULT_CATEGORIAS,
      ...categoriasList.map((c) => c.nombre),
    ])
  );

  useEffect(() => {
    cargarProductos(page, limit);
    cargarCategorias();
  }, [page, limit]);

  const cargarCategorias = async () => {
    try {
      let res;
      try {
        res = await apiFetch("/api/categorias/admin");
      } catch (e1) {
        try {
          res = await apiFetch("/api/productos/categorias/admin");
        } catch (e2) {
          res = await apiFetch("/api/categorias");
        }
      }
      if (res && res.categorias) {
        setCategoriasList(res.categorias);
      }
    } catch (err) {
      console.warn("No se pudo cargar la lista administrativa de categorías:", err);
    }
  };

  const handleOpenCategoryModal = () => {
    setEditingCatId(null);
    setCatFormData({
      nombre: "",
      descripcion: "",
      orden: (categoriasList.length + 1) * 10,
      activa: true,
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setCatFormData({
      nombre: cat.nombre,
      descripcion: cat.descripcion || "",
      orden: cat.orden || 0,
      activa: Boolean(cat.activa),
    });
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.nombre.trim()) {
      if (addAlert) addAlert("El nombre de la categoría es obligatorio", "danger");
      return;
    }

    setSubmittingCat(true);
    try {
      if (editingCatId) {
        try {
          await apiFetch(`/api/categorias/${editingCatId}`, { method: "PUT", body: catFormData });
        } catch (e1) {
          await apiFetch(`/api/productos/categorias/${editingCatId}`, { method: "PUT", body: catFormData });
        }
        if (addAlert) addAlert("Categoría actualizada con éxito", "success");
      } else {
        try {
          await apiFetch("/api/categorias", { method: "POST", body: catFormData });
        } catch (e1) {
          await apiFetch("/api/productos/categorias", { method: "POST", body: catFormData });
        }
        if (addAlert) addAlert("Nueva categoría creada con éxito", "success");
      }

      setEditingCatId(null);
      setCatFormData({ nombre: "", descripcion: "", orden: 1, activa: true });
      cargarCategorias();
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (catId, catNombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${catNombre}"?`)) return;

    try {
      try {
        await apiFetch(`/api/categorias/${catId}`, { method: "DELETE" });
      } catch (e1) {
        await apiFetch(`/api/productos/categorias/${catId}`, { method: "DELETE" });
      }
      if (addAlert) addAlert(`Categoría "${catNombre}" eliminada con éxito`, "success");
      cargarCategorias();
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
    }
  };

  const cargarProductos = async (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/productos/admin?page=${targetPage}&limit=${targetLimit}`);
      setProductos(res.productos || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPage(res.page || 1);
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
      stock: 50,
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
      stock: prod.stock !== undefined ? prod.stock : 50,
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

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (addAlert) addAlert("La imagen del producto no debe pesar más de 5MB.", "danger");
      return;
    }

    setUploadingImg(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const res = await apiFetch("/api/upload/producto", {
            method: "POST",
            body: { imagen: base64Data },
          });
          setFormData((prev) => ({ ...prev, imagen_url: res.url }));
          if (addAlert) addAlert("¡Imagen cargada con éxito!", "success");
        } catch (err) {
          if (addAlert) addAlert("Error subiendo imagen: " + err.message, "danger");
        } finally {
          setUploadingImg(false);
        }
      };
      reader.onerror = () => {
        if (addAlert) addAlert("Error al leer el archivo de imagen", "danger");
        setUploadingImg(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const precioNum = parseFloat(formData.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      if (addAlert) addAlert("El precio debe ser mayor a 0", "danger");
      return;
    }

    const stockNum = Math.max(0, parseInt(formData.stock, 10) || 0);

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        precio: precioNum,
        stock: stockNum,
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
          <p className="hero-subtitle text-muted mb-0">Gestiona los productos y las categorías del catálogo.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-gold d-flex align-items-center gap-2 shadow-sm" onClick={handleOpenCategoryModal}>
            <Folder size={18} />
            Gestionar Categorías
          </button>
          <button className="btn btn-gold d-flex align-items-center gap-2 shadow-sm" onClick={handleOpenCreate}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
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
        <>
          <div className="table-responsive table-custom-container">
            <table className="table-custom align-middle">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No hay productos registrados.
                    </td>
                  </tr>
                ) : (
                  productos.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {prod.imagen_url ? (
                            <img
                              src={prod.imagen_url}
                              alt={prod.nombre}
                              className="rounded object-fit-cover shadow-sm"
                              style={{ width: "48px", height: "48px" }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="bg-light p-2 rounded text-gold border border-glass">
                              <Utensils size={24} />
                            </div>
                          )}
                          <div>
                            <div className="fw-bold text-dark fs-6 mb-0">{prod.nombre}</div>
                            <div className="text-muted extra-small text-truncate" style={{ maxWidth: "280px" }}>
                              {prod.descripcion || "Sin descripción"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-category">{prod.categoria}</span>
                      </td>
                      <td className="fw-bold text-gold fs-6">${Number(prod.precio).toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${
                            (prod.stock !== undefined ? prod.stock : 50) <= 0
                              ? "bg-danger text-white"
                              : (prod.stock !== undefined ? prod.stock : 50) <= 5
                              ? "bg-warning text-dark"
                              : "bg-gold text-dark"
                          } fw-bold p-2`}
                        >
                          {(prod.stock !== undefined ? prod.stock : 50) <= 0
                            ? "0 (Agotado)"
                            : `${prod.stock !== undefined ? prod.stock : 50} un.`}
                        </span>
                      </td>
                      <td>
                        {prod.disponible ? (
                          <span className="badge badge-available">Disponible</span>
                        ) : (
                          <span className="badge badge-unavailable">No Disponible</span>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </>
      )}

      {/* Modal para Crear / Editar Producto */}
      {showModal &&
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
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content glass-card shadow-lg border-glass text-dark">
                <div className="modal-header border-bottom border-glass p-4">
                  <h5 className="modal-title text-gold fw-bold fs-4 m-0">
                    {editingId ? "Editar Producto" : "Nuevo Producto"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label text-gold small fw-bold">
                        Nombre del Producto *
                      </label>
                      <input
                        type="text"
                        className="form-control glass-input w-100"
                        placeholder="Ej. Hamburguesa Doble Queso"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-gold small fw-bold">
                        Descripción
                      </label>
                      <textarea
                        className="form-control glass-input w-100"
                        rows="3"
                        placeholder="Descripción detallada del plato o bebida..."
                        value={formData.descripcion}
                        onChange={(e) =>
                          setFormData({ ...formData, descripcion: e.target.value })
                        }
                      ></textarea>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="form-label text-gold small fw-bold">
                          Precio ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="form-control glass-input w-100"
                          placeholder="0.00"
                          value={formData.precio}
                          onChange={(e) =>
                            setFormData({ ...formData, precio: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-gold small fw-bold">
                          Stock (Inventario) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="form-control glass-input w-100"
                          placeholder="50"
                          value={formData.stock}
                          onChange={(e) =>
                            setFormData({ ...formData, stock: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label text-gold small fw-bold">
                          Categoría *
                        </label>
                        <select
                          className="form-select glass-input w-100"
                          value={formData.categoria}
                          onChange={(e) =>
                            setFormData({ ...formData, categoria: e.target.value })
                          }
                        >
                          {listaCategoriasOpciones.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-gold small fw-bold d-flex align-items-center justify-content-between">
                        <span>Imagen del Producto</span>
                        <label
                          htmlFor="productImageUpload"
                          className={`btn btn-sm btn-gold d-flex align-items-center gap-1 mb-0 ${uploadingImg ? "disabled" : ""}`}
                          style={{ cursor: "pointer" }}
                        >
                          <Upload size={14} />
                          {uploadingImg ? "Subiendo imagen..." : "Subir imagen desde equipo"}
                        </label>
                      </label>
                      <input
                        type="file"
                        id="productImageUpload"
                        accept="image/*"
                        className="d-none"
                        onChange={handleImageFileChange}
                        disabled={uploadingImg}
                      />
                      <input
                        type="url"
                        className="form-control glass-input w-100"
                        placeholder="https://... o pega la URL de la imagen"
                        value={formData.imagen_url}
                        onChange={(e) =>
                          setFormData({ ...formData, imagen_url: e.target.value })
                        }
                      />
                      {formData.imagen_url && (
                        <div className="mt-2 p-2 border border-glass rounded bg-light d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={formData.imagen_url}
                              alt="Vista previa del plato"
                              className="rounded object-fit-cover border border-gold"
                              style={{ width: "48px", height: "48px" }}
                            />
                            <div>
                              <span className="small text-gold fw-bold d-flex align-items-center gap-1">
                                <CheckCircle2 size={12} /> Imagen Lista
                              </span>
                              <span className="extra-small text-muted text-truncate d-block" style={{ maxWidth: "260px" }}>
                                {formData.imagen_url}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger p-1"
                            onClick={() => setFormData({ ...formData, imagen_url: "" })}
                            title="Remover imagen"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="form-check form-switch mt-4 p-3 bg-light rounded border border-glass d-flex align-items-center justify-content-between">
                      <label
                        className="form-check-label text-dark small fw-bold mb-0 me-3"
                        htmlFor="disponibleCheck"
                      >
                        Disponible para venta inmediata
                      </label>
                      <input
                        className="form-check-input ms-0 mt-0"
                        type="checkbox"
                        id="disponibleCheck"
                        style={{ cursor: "pointer", width: "2.5em", height: "1.25em" }}
                        checked={formData.disponible}
                        onChange={(e) =>
                          setFormData({ ...formData, disponible: e.target.checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="modal-footer border-top border-glass p-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-gold d-flex align-items-center gap-2 px-4"
                      disabled={submitting}
                    >
                      <Save size={18} />
                      {submitting ? "Guardando..." : "Guardar Producto"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Gestión de Categorías */}
      {showCategoryModal &&
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
              if (e.target === e.currentTarget) setShowCategoryModal(false);
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content glass-card shadow-lg border-glass text-dark">
                <div className="modal-header border-bottom border-glass p-4 d-flex align-items-center justify-content-between">
                  <h5 className="modal-title text-gold fw-bold fs-4 m-0 d-flex align-items-center gap-2">
                    <Folder size={22} /> Gestión de Categorías del Menú
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCategoryModal(false)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  {/* Formulario para agregar / editar categoría */}
                  <form onSubmit={handleSubmitCategory} className="p-3 bg-light rounded border border-glass mb-4 shadow-sm">
                    <h6 className="text-gold fw-bold mb-3 d-flex align-items-center gap-1">
                      <FolderPlus size={16} /> {editingCatId ? "Editar Categoría" : "Agregar Nueva Categoría"}
                    </h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-gold extra-small fw-bold mb-1">Nombre de Categoría *</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="Ej. Mariscos, Combos, Bebidas"
                          value={catFormData.nombre}
                          onChange={(e) => setCatFormData({ ...catFormData, nombre: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label text-gold extra-small fw-bold mb-1">Orden de Mostrar</label>
                        <input
                          type="number"
                          className="form-control glass-input"
                          placeholder="10"
                          value={catFormData.orden}
                          onChange={(e) => setCatFormData({ ...catFormData, orden: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3 d-flex align-items-end">
                        <div className="form-check form-switch mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="catActivaCheck"
                            checked={catFormData.activa}
                            onChange={(e) => setCatFormData({ ...catFormData, activa: e.target.checked })}
                          />
                          <label className="form-check-label extra-small fw-bold text-dark me-0 ms-2" htmlFor="catActivaCheck">
                            Activa
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label text-gold extra-small fw-bold mb-1">Descripción Opcional</label>
                        <input
                          type="text"
                          className="form-control glass-input"
                          placeholder="Breve descripción..."
                          value={catFormData.descripcion}
                          onChange={(e) => setCatFormData({ ...catFormData, descripcion: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-3">
                      {editingCatId && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setEditingCatId(null);
                            setCatFormData({ nombre: "", descripcion: "", orden: 1, activa: true });
                          }}
                        >
                          Cancelar Edición
                        </button>
                      )}
                      <button type="submit" className="btn btn-sm btn-gold d-flex align-items-center gap-1" disabled={submittingCat}>
                        <Save size={14} />
                        {submittingCat ? "Guardando..." : editingCatId ? "Actualizar Categoría" : "Guardar Categoría"}
                      </button>
                    </div>
                  </form>

                  {/* Tabla de Categorías registradas */}
                  <h6 className="text-gold fw-bold mb-2">Categorías Registradas en el Sistema</h6>
                  <div className="table-responsive border border-glass rounded">
                    <table className="table table-hover align-middle mb-0 extra-small">
                      <thead className="bg-light">
                        <tr>
                          <th>Categoría</th>
                          <th>Orden</th>
                          <th>Productos Vinc.</th>
                          <th>Estado</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoriasList.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-3 text-muted">
                              No hay categorías registradas aún.
                            </td>
                          </tr>
                        ) : (
                          categoriasList
                            .slice((catPage - 1) * catLimit, catPage * catLimit)
                            .map((cat) => (
                              <tr key={cat.id}>
                                <td>
                                  <div className="fw-bold text-dark">{cat.nombre}</div>
                                  {cat.descripcion && <div className="text-muted extra-small">{cat.descripcion}</div>}
                                </td>
                                <td className="fw-bold text-gold">{cat.orden}</td>
                                <td>
                                  <span className="badge bg-light text-dark border border-glass">
                                    {cat.total_productos || 0} prods
                                  </span>
                                </td>
                                <td>
                                  {cat.activa ? (
                                    <span className="badge bg-success text-white">Activa</span>
                                  ) : (
                                    <span className="badge bg-secondary text-white">Inactiva</span>
                                  )}
                                </td>
                                <td className="text-end">
                                  <div className="d-flex justify-content-end gap-1">
                                    <button
                                      className="btn btn-sm btn-outline-gold p-1"
                                      onClick={() => handleEditCategory(cat)}
                                      title="Editar categoría"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger p-1"
                                      onClick={() => handleDeleteCategory(cat.id, cat.nombre)}
                                      title="Eliminar categoría"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {categoriasList.length > catLimit && (
                    <div className="mt-2">
                      <Pagination
                        page={catPage}
                        totalPages={Math.ceil(categoriasList.length / catLimit) || 1}
                        total={categoriasList.length}
                        limit={catLimit}
                        onPageChange={(p) => setCatPage(p)}
                      />
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top border-glass p-3">
                  <button type="button" className="btn btn-gold btn-sm px-4" onClick={() => setShowCategoryModal(false)}>
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
