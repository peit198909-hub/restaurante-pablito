import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "../api/client";
import { useCart } from "../context/CartContext";
import Pagination from "./Pagination";
import { Search, ShoppingCart, Utensils, Tag } from "lucide-react";

export default function MenuView({ setView, addAlert }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { addToCart, totalItems } = useCart();

  useEffect(() => {
    cargarDatos(1, limit);
  }, [categoriaSeleccionada]);

  const cargarDatos = async (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    setError(null);
    try {
      // Cargar categorias activas
      const catRes = await apiFetch("/api/categorias");
      setCategorias(catRes.categorias || []);

      // Cargar productos activos con paginación
      let queryParams = [`page=${targetPage}`, `limit=${targetLimit}`];
      if (categoriaSeleccionada) {
        queryParams.push(`categoria=${encodeURIComponent(categoriaSeleccionada)}`);
      }
      if (busqueda) {
        queryParams.push(`q=${encodeURIComponent(busqueda)}`);
      }

      const queryString = `?${queryParams.join("&")}`;
      const prodRes = await apiFetch(`/api/productos${queryString}`);
      if (prodRes && prodRes.productos) {
        setProductos(prodRes.productos || []);
        setTotal(prodRes.total || 0);
        setTotalPages(prodRes.totalPages || 1);
      } else {
        setProductos(Array.isArray(prodRes) ? prodRes : []);
        setTotal(Array.isArray(prodRes) ? prodRes.length : 0);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    setPage(1);
    cargarDatos(1, limit);
  };

  const handleAgregarItem = (producto) => {
    addToCart(producto, 1);
    if (addAlert) {
      addAlert(`¡${producto.nombre} agregado al carrito!`, "success");
    }
  };

  return (
    <div className="container py-4 fade-in-up">
      {/* Filtros de Categorías y Búsqueda */}
      <div className="row g-3 mb-4 align-items-center">
        <div className="col-lg-8">
          <div className="d-flex flex-wrap gap-2">
            <button
              className={`btn btn-sm ${
                categoriaSeleccionada === "" ? "btn-gold" : "btn-outline-gold"
              }`}
              onClick={() => setCategoriaSeleccionada("")}
            >
              Todas las categorías
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                className={`btn btn-sm ${
                  categoriaSeleccionada === cat.nombre ? "btn-gold" : "btn-outline-gold"
                }`}
                onClick={() => setCategoriaSeleccionada(cat.nombre)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="col-lg-4">
          <form onSubmit={handleBuscar} className="d-flex gap-2">
            <div className="input-group">
              <span className="input-group-text glass-input border-end-0">
                <Search size={18} className="text-gold" />
              </span>
              <input
                type="text"
                className="form-control glass-input border-start-0"
                placeholder="Buscar plato..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-gold px-3">
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Catálogo de Productos */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-gold" role="status"></div>
          <p className="text-gold mt-3">Cargando nuestro menú exquisito...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center glass-card p-4">
          <p className="mb-0">{error}</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-5 glass-card">
          <p className="text-muted fs-5">No se encontraron productos disponibles en esta categoría.</p>
        </div>
      ) : (
        /* Grilla de Productos */
        <div className="row g-4">
          {productos.map((producto) => (
            <div key={producto.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 glass-card product-card border-glass text-light overflow-hidden">
                {/* Imagen del producto */}
                <div className="product-image-container position-relative bg-dark bg-opacity-75" style={{ height: "200px" }}>
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-gold">
                      <Utensils size={48} opacity={0.4} />
                    </div>
                  )}

                  <span className="badge bg-dark border border-gold text-gold position-absolute top-0 end-0 m-3 px-3 py-2">
                    <Tag size={12} className="me-1" />
                    {producto.categoria}
                  </span>

                  {/* Insignia de Stock */}
                  <span
                    className={`badge position-absolute top-0 start-0 m-3 px-3 py-2 ${
                      (producto.stock !== undefined ? producto.stock : 50) <= 0
                        ? "bg-danger text-white fw-bold"
                        : (producto.stock !== undefined ? producto.stock : 50) <= 5
                        ? "bg-warning text-dark fw-bold"
                        : "bg-dark text-gold border border-glass"
                    }`}
                  >
                    {(producto.stock !== undefined ? producto.stock : 50) <= 0
                      ? "❌ Agotado"
                      : (producto.stock !== undefined ? producto.stock : 50) <= 5
                      ? `⚠️ ¡Pocas unidades! (${producto.stock})`
                      : `Stock: ${producto.stock !== undefined ? producto.stock : 50}`}
                  </span>
                </div>

                <div className="card-body d-flex flex-column p-4">
                  <h3 className="card-title text-gold h5 mb-2">{producto.nombre}</h3>
                  <p className="card-text text-muted small flex-grow-1 mb-3">
                    {producto.descripcion || "Sin descripción disponible."}
                  </p>

                  <div className="d-flex align-items-center justify-content-between pt-3 border-top border-glass mt-auto">
                    <div>
                      <span className="text-muted extra-small d-block">Precio</span>
                      <span className="fs-4 fw-bold text-gold">${Number(producto.precio).toFixed(2)}</span>
                    </div>

                    <button
                      className={`btn d-flex align-items-center gap-2 py-2 px-3 fw-bold rounded-pill ${
                        (producto.stock !== undefined ? producto.stock : 50) <= 0
                          ? "btn-secondary opacity-50 cursor-not-allowed"
                          : "btn-gold"
                      }`}
                      onClick={() => handleAgregarItem(producto)}
                      disabled={(producto.stock !== undefined ? producto.stock : 50) <= 0}
                    >
                      <ShoppingCart size={18} />
                      {(producto.stock !== undefined ? producto.stock : 50) <= 0 ? "Agotado" : "Agregar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Componente de Paginación para el Menú */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={(nuevaPagina) => {
          setPage(nuevaPagina);
          cargarDatos(nuevaPagina, limit);
        }}
        onLimitChange={(nuevoLimite) => {
          setLimit(nuevoLimite);
          setPage(1);
          cargarDatos(1, nuevoLimite);
        }}
      />

      {/* Botón flotante para ver carrito que SIGUE al usuario fijamente en el viewport mediante createPortal */}
      {totalItems > 0 &&
        createPortal(
          <div
            style={{
              position: "fixed",
              bottom: "28px",
              right: "28px",
              zIndex: 1080,
            }}
          >
            <button
              className="btn btn-gold shadow-lg d-flex align-items-center gap-2 py-3 px-4 rounded-pill border border-dark hover-scale"
              onClick={() => setView("carrito")}
              style={{
                boxShadow: "0 10px 25px -5px rgba(224, 86, 36, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
              }}
            >
              <ShoppingCart size={22} />
              <span className="fw-bold fs-6">Ver Mi Carrito</span>
              <span className="badge bg-dark text-gold rounded-circle px-2 py-1 fs-6 ms-1">
                {totalItems}
              </span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
