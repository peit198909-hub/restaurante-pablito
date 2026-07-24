import React, { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { useCart } from "../context/CartContext";
import { Search, ShoppingCart, Utensils, CheckCircle2, Tag } from "lucide-react";

export default function MenuView({ setView, addAlert }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart, totalItems } = useCart();

  useEffect(() => {
    cargarDatos();
  }, [categoriaSeleccionada]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar categorias activas
      const catRes = await apiFetch("/api/categorias");
      setCategorias(catRes.categorias || []);

      // Cargar productos activos
      let queryParams = [];
      if (categoriaSeleccionada) {
        queryParams.push(`categoria=${encodeURIComponent(categoriaSeleccionada)}`);
      }
      if (busqueda) {
        queryParams.push(`q=${encodeURIComponent(busqueda)}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const prodRes = await apiFetch(`/api/productos${queryString}`);
      setProductos(prodRes.productos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const handleAgregarItem = (producto) => {
    addToCart(producto, 1);
    if (addAlert) {
      addAlert(`"${producto.nombre}" agregado al carrito`, "success");
    }
  };

  return (
    <div className="container py-4 fade-in-up">
      {/* Encabezado del Menú */}
      <div className="text-center mb-5">
        <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-gold-subtle text-gold mb-3">
          <Utensils size={36} />
        </div>
        <h1 className="hero-title text-gold">Nuestro Menú Delicioso</h1>
        <p className="hero-subtitle text-muted">
          Explora la variedad gastronómica preparada al instante para ti.
        </p>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="glass-card p-4 mb-4">
        <form onSubmit={handleBuscar} className="row g-3 align-items-center mb-3">
          <div className="col-md-8 col-lg-9">
            <div className="input-group">
              <span className="input-group-text bg-dark border-glass text-gold">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar por plato, postre, bebida..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4 col-lg-3">
            <button type="submit" className="btn btn-gold w-100 py-2">
              Buscar
            </button>
          </div>
        </form>

        {/* Botones de Categorías */}
        <div className="d-flex align-items-center gap-2 overflow-auto py-2">
          <button
            className={`btn btn-sm ${categoriaSeleccionada === "" ? "btn-gold" : "btn-outline-gold"}`}
            onClick={() => setCategoriaSeleccionada("")}
          >
            Todas las Categorías
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id || cat.nombre}
              className={`btn btn-sm ${categoriaSeleccionada === cat.nombre ? "btn-gold" : "btn-outline-gold"}`}
              onClick={() => setCategoriaSeleccionada(cat.nombre)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Spinner de carga o Error */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-gold" role="status">
            <span className="visually-hidden">Cargando menú...</span>
          </div>
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
                      className="btn btn-gold d-flex align-items-center gap-2 py-2 px-3"
                      onClick={() => handleAgregarItem(producto)}
                    >
                      <ShoppingCart size={18} />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón flotante para ver carrito si hay items */}
      {totalItems > 0 && (
        <div className="position-fixed bottom-0 end-0 m-4 z-3">
          <button
            className="btn btn-gold shadow-lg d-flex align-items-center gap-2 py-3 px-4 rounded-pill border border-dark"
            onClick={() => setView("carrito")}
          >
            <ShoppingCart size={22} />
            <span className="fw-bold">Ver Mi Carrito</span>
            <span className="badge bg-dark text-gold rounded-circle px-2 py-1 fs-6 ms-1">
              {totalItems}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
