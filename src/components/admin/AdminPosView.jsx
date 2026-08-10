import React, { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  MapPin,
  DollarSign,
  Printer,
  CheckCircle2,
  Utensils,
  CreditCard,
  Building,
  Loader2,
  Compass,
  FileText,
} from "lucide-react";

export default function AdminPosView({ addAlert, setView }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de catálogo
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Estado del pedido actual (POS)
  const [cartItems, setCartItems] = useState([]);
  const [tipoCliente, setTipoCliente] = useState("final"); // 'final' o 'registrado'
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState("");
  const [nombreConsumidorFinal, setNombreConsumidorFinal] = useState("Consumidor Final");
  const [tipoEntrega, setTipoEntrega] = useState("retiro"); // 'retiro' o 'delivery'
  const [direccionEntrega, setDireccionEntrega] = useState("Venta Mostrador / Local");
  const [telefonoContacto, setTelefonoContacto] = useState("");
  const [distanciaKm, setDistanciaKm] = useState(0);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [montoPagado, setMontoPagado] = useState("");
  const [estadoInicial, setEstadoInicial] = useState("confirmado"); // 'confirmado', 'en_preparacion', 'entregado'
  const [notasPedido, setNotasPedido] = useState("");

  const [procesando, setProcesando] = useState(false);
  const [pedidoCompletado, setPedidoCompletado] = useState(null);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setLoading(true);
    try {
      // Categorías
      const catRes = await apiFetch("/api/categorias");
      setCategorias(catRes.categorias || []);

      // Productos disponibles
      const prodRes = await apiFetch("/api/productos");
      const listaProds = prodRes.productos || (Array.isArray(prodRes) ? prodRes : []);
      setProductos(listaProds);

      // Lista de clientes para la venta
      const clientRes = await apiFetch("/api/usuarios/clientes/lista");
      setClientes(clientRes.clientes || []);
    } catch (err) {
      if (addAlert) addAlert("Error cargando productos para punto de venta: " + err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto a la comanda POS
  const handleAddToCart = (producto) => {
    setCartItems((prev) => {
      const existeIndex = prev.findIndex((i) => i.producto_id === producto.id);
      if (existeIndex >= 0) {
        const copia = [...prev];
        copia[existeIndex].cantidad += 1;
        return copia;
      }
      return [
        ...prev,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: parseFloat(producto.precio),
          cantidad: 1,
          notas: "",
        },
      ];
    });
  };

  // Modificar cantidad
  const handleUpdateCantidad = (productoId, delta) => {
    setCartItems((prev) => {
      return prev
        .map((item) => {
          if (item.producto_id === productoId) {
            const nuevaCant = item.cantidad + delta;
            return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Eliminar ítem
  const handleRemoveItem = (productoId) => {
    setCartItems((prev) => prev.filter((i) => i.producto_id !== productoId));
  };

  // Cálculos de totales
  const subtotal = cartItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const IVA_RATE = 0.15;
  const impuesto = Math.round(subtotal * IVA_RATE * 100) / 100;
  const costoEnvio = tipoEntrega === "delivery" ? Math.round(distanciaKm * 0.25 * 100) / 100 : 0;
  const total = Math.round((subtotal + impuesto + costoEnvio) * 100) / 100;

  // Cálculo de cambio en efectivo
  const pagoNum = parseFloat(montoPagado || 0);
  const cambioEfectivo = pagoNum >= total ? (pagoNum - total).toFixed(2) : "0.00";

  // Enviar Venta Directa del Admin
  const handleConfirmarVenta = async () => {
    if (cartItems.length === 0) {
      if (addAlert) addAlert("Debes agregar al menos un producto a la comanda", "warning");
      return;
    }

    if (tipoEntrega === "delivery" && !direccionEntrega.trim()) {
      if (addAlert) addAlert("Ingresa la dirección de entrega para la venta a domicilio", "warning");
      return;
    }

    setProcesando(true);
    try {
      const itemsPayload = cartItems.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        notas: i.notas || null,
      }));

      const bodyData = {
        items: itemsPayload,
        cliente_id: tipoCliente === "registrado" && clienteSeleccionadoId ? Number(clienteSeleccionadoId) : null,
        direccion_entrega: tipoEntrega === "retiro" ? "Venta Directa en Local / Mostrador" : direccionEntrega,
        telefono_contacto: telefonoContacto || null,
        notas: `[VENTA ADMIN POS] ${tipoCliente === "final" ? nombreConsumidorFinal : "Cliente Registrado"}. ${notasPedido}`.trim(),
        metodo_pago: metodoPago,
        tipo_entrega: tipoEntrega,
        distancia_km: tipoEntrega === "delivery" ? parseFloat(distanciaKm) : 0,
        estado_inicial: estadoInicial,
      };

      const res = await apiFetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (res && res.status === "success") {
        if (addAlert) addAlert(`¡Venta #${res.pedido.id} registrada con éxito!`, "success");
        setPedidoCompletado({
          ...res.pedido,
          items: cartItems,
          montoPagado: pagoNum,
          cambio: cambioEfectivo,
          clienteNombre: tipoCliente === "registrado" 
            ? clientes.find(c => c.id === Number(clienteSeleccionadoId))?.nombre || "Cliente"
            : nombreConsumidorFinal
        });
        setCartItems([]);
        setMontoPagado("");
        setNotasPedido("");
      } else {
        throw new Error(res.message || "Error al procesar la venta");
      }
    } catch (err) {
      if (addAlert) addAlert("Error procesando venta: " + err.message, "danger");
    } finally {
      setProcesando(false);
    }
  };

  // Filtrado de productos en catálogo
  const productosFiltrados = productos.filter((p) => {
    const coincideCat = !categoriaSeleccionada || p.categoria === categoriaSeleccionada;
    const coincideBusqueda =
      !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    return coincideCat && coincideBusqueda;
  });

  if (loading) {
    return (
      <div className="container py-5 text-center fade-in-up">
        <Loader2 size={48} className="animate-spin text-gold mb-3" />
        <p className="text-light">Cargando sistema de ventas POS...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-lg-4 py-4 fade-in-up">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 border-bottom border-glass pb-3">
        <div>
          <h2 className="text-gold fw-bold mb-0 d-flex align-items-center gap-2">
            <ShoppingCart size={28} />
            Punto de Venta / Crear Venta Directa (POS)
          </h2>
          <p className="text-muted small mb-0">
            Registra pedidos de mostrador, presenciales o llamadas de clientes directamente al sistema.
          </p>
        </div>

        {setView && (
          <button className="btn btn-outline-gold btn-sm" onClick={() => setView("admin-pedidos")}>
            <FileText size={16} me={1} /> Ir a Gestión de Pedidos
          </button>
        )}
      </div>

      <div className="row g-4">
        {/* Columna Izquierda: Catálogo de Productos */}
        <div className="col-lg-7 col-xl-8">
          <div className="glass-card p-3 mb-3 border-glass">
            {/* Buscador y Categorías */}
            <div className="row g-2 align-items-center mb-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <Search size={18} className="text-gold" />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input border-start-0"
                    placeholder="Buscar plato o producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="d-flex gap-1 overflow-auto pb-1">
                  <button
                    className={`btn btn-sm text-nowrap ${
                      categoriaSeleccionada === "" ? "btn-gold" : "btn-outline-gold"
                    }`}
                    onClick={() => setCategoriaSeleccionada("")}
                  >
                    Todas
                  </button>
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      className={`btn btn-sm text-nowrap ${
                        categoriaSeleccionada === cat.nombre ? "btn-gold" : "btn-outline-gold"
                      }`}
                      onClick={() => setCategoriaSeleccionada(cat.nombre)}
                    >
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid de Productos */}
            <div className="row g-2 overflow-auto" style={{ maxHeight: "650px" }}>
              {productosFiltrados.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <Utensils size={40} className="mb-2 opacity-50 text-gold" />
                  <p className="mb-0">No se encontraron productos disponibles en el catálogo.</p>
                </div>
              ) : (
                productosFiltrados.map((prod) => {
                  const agotado = (prod.stock !== undefined ? prod.stock : 50) <= 0;
                  return (
                    <div key={prod.id} className="col-6 col-sm-4 col-md-3">
                      <div
                        className={`card h-100 glass-card product-card p-2 text-center border-glass position-relative cursor-pointer hover-scale ${
                          agotado ? "opacity-50" : ""
                        }`}
                        onClick={() => !agotado && handleAddToCart(prod)}
                        style={{ cursor: agotado ? "not-allowed" : "pointer" }}
                      >
                        <div
                          className="rounded overflow-hidden mb-2 bg-dark"
                          style={{ height: "90px" }}
                        >
                          {prod.imagen_url ? (
                            <img
                              src={prod.imagen_url}
                              alt={prod.nombre}
                              className="w-100 h-100 object-fit-cover"
                            />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 text-gold">
                              <Utensils size={28} />
                            </div>
                          )}
                        </div>

                        <span className="fw-bold text-white small text-truncate d-block" title={prod.nombre}>
                          {prod.nombre}
                        </span>
                        <span className="text-gold fw-bold fs-6 mt-1 d-block">
                          ${parseFloat(prod.precio).toFixed(2)}
                        </span>

                        <button
                          className={`btn btn-xs w-100 mt-2 fw-bold ${
                            agotado ? "btn-secondary" : "btn-gold py-1"
                          }`}
                          disabled={agotado}
                        >
                          {agotado ? "Agotado" : "+ Agregar"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Comanda / Carrito POS */}
        <div className="col-lg-5 col-xl-4">
          <div className="glass-card p-3 border-glass shadow-lg sticky-top bg-dark text-white" style={{ top: "90px" }}>
            <h4 className="text-gold fw-bold fs-5 mb-3 d-flex align-items-center justify-content-between border-bottom border-secondary pb-2">
              <span className="d-flex align-items-center gap-2 text-white">
                <ShoppingCart size={20} className="text-gold" /> Comanda de Venta
              </span>
              <span className="badge bg-gold text-dark fs-6 rounded-pill">{cartItems.length} ítems</span>
            </h4>

            {/* Ítems agregados */}
            <div className="overflow-auto mb-3" style={{ maxHeight: "250px" }}>
              {cartItems.length === 0 ? (
                <div className="text-center py-4 text-white opacity-75 border border-dashed border-secondary rounded p-3">
                  <ShoppingCart size={32} className="mb-2 text-gold opacity-75" />
                  <p className="small mb-0 text-white">Haz clic en los productos del catálogo para agregarlos a la comanda.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.producto_id}
                    className="p-2 mb-2 rounded bg-secondary bg-opacity-25 border border-secondary d-flex align-items-center justify-content-between gap-2"
                  >
                    <div className="flex-grow-1 overflow-hidden">
                      <span className="text-white fw-bold small text-truncate d-block">{item.nombre}</span>
                      <span className="text-gold extra-small fw-bold">
                        ${item.precio.toFixed(2)} x {item.cantidad} = ${(item.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      <button
                        className="btn btn-sm btn-outline-light px-2 py-0"
                        onClick={() => handleUpdateCantidad(item.producto_id, -1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="fw-bold text-white px-1 small">{item.cantidad}</span>
                      <button
                        className="btn btn-sm btn-outline-gold px-2 py-0"
                        onClick={() => handleUpdateCantidad(item.producto_id, 1)}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger px-1 py-0 ms-1"
                        onClick={() => handleRemoveItem(item.producto_id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Opciones del Cliente */}
            <div className="mb-3 pt-2 border-top border-secondary">
              <label className="form-label text-white extra-small fw-bold mb-1">Cliente de la Venta:</label>
              <div className="btn-group w-100 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm ${tipoCliente === "final" ? "btn-gold text-white" : "btn-outline-light text-white"}`}
                  onClick={() => setTipoCliente("final")}
                >
                  Cliente Presencial
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${tipoCliente === "registrado" ? "btn-gold text-white" : "btn-outline-light text-white"}`}
                  onClick={() => setTipoCliente("registrado")}
                >
                  Cliente Registrado
                </button>
              </div>

              {tipoCliente === "final" ? (
                <input
                  type="text"
                  className="form-control form-control-sm bg-secondary bg-opacity-25 text-white border-secondary"
                  style={{ color: "#ffffff" }}
                  placeholder="Nombre cliente (ej. Juan Pérez)"
                  value={nombreConsumidorFinal}
                  onChange={(e) => setNombreConsumidorFinal(e.target.value)}
                />
              ) : (
                <select
                  className="form-select form-select-sm bg-secondary bg-opacity-25 text-white border-secondary"
                  style={{ color: "#ffffff" }}
                  value={clienteSeleccionadoId}
                  onChange={(e) => setClienteSeleccionadoId(e.target.value)}
                >
                  <option value="" className="bg-dark text-white">-- Seleccionar Cliente Registrado --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id} className="bg-dark text-white">
                      {c.nombre} {c.apellido} ({c.correo})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Tipo de Entrega */}
            <div className="mb-3">
              <label className="form-label text-white extra-small fw-bold mb-1">Modalidad de Entrega:</label>
              <div className="btn-group w-100 mb-2">
                <button
                  type="button"
                  className={`btn btn-sm ${tipoEntrega === "retiro" ? "btn-gold text-white" : "btn-outline-light text-white"}`}
                  onClick={() => setTipoEntrega("retiro")}
                >
                  Retiro / Local ($0.00)
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${tipoEntrega === "delivery" ? "btn-gold text-white" : "btn-outline-light text-white"}`}
                  onClick={() => setTipoEntrega("delivery")}
                >
                  Delivery a Domicilio
                </button>
              </div>

              {tipoEntrega === "delivery" && (
                <div className="d-flex flex-column gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-secondary bg-opacity-25 text-white border-secondary"
                    style={{ color: "#ffffff" }}
                    placeholder="Dirección de entrega a domicilio"
                    value={direccionEntrega}
                    onChange={(e) => setDireccionEntrega(e.target.value)}
                  />
                  <div className="d-flex align-items-center gap-2">
                    <span className="extra-small text-white">Distancia estimada (km):</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-control form-control-sm bg-secondary bg-opacity-25 text-white border-secondary"
                      style={{ width: "80px", color: "#ffffff" }}
                      value={distanciaKm}
                      onChange={(e) => setDistanciaKm(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Método de Pago y Cambio en Efectivo */}
            <div className="mb-3">
              <label className="form-label text-white extra-small fw-bold mb-1">Método de Pago:</label>
              <div className="row g-1 mb-2">
                {["efectivo", "transferencia", "otro"].map((m) => (
                  <div key={m} className="col-4">
                    <button
                      type="button"
                      className={`btn btn-sm w-100 text-capitalize ${
                        metodoPago === m ? "btn-gold text-white" : "btn-outline-light text-white"
                      }`}
                      onClick={() => setMetodoPago(m)}
                    >
                      {m}
                    </button>
                  </div>
                ))}
              </div>

              {metodoPago === "efectivo" && (
                <div className="p-2 rounded bg-secondary bg-opacity-25 border border-secondary">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="extra-small text-white fw-bold">Efectivo Recibido:</span>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control form-control-sm bg-dark text-white border-secondary text-end fw-bold"
                      style={{ width: "110px", color: "#ffffff" }}
                      placeholder="$0.00"
                      value={montoPagado}
                      onChange={(e) => setMontoPagado(e.target.value)}
                    />
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="extra-small text-white fw-bold">Cambio a Entregar:</span>
                    <span className="fw-bold text-success fs-6">${cambioEfectivo}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Estado Inicial del Pedido */}
            <div className="mb-3">
              <label className="form-label text-white extra-small fw-bold mb-1">Estado del Pedido:</label>
              <select
                className="form-select form-select-sm bg-secondary bg-opacity-25 text-white border-secondary fw-bold"
                style={{ color: "#ffffff" }}
                value={estadoInicial}
                onChange={(e) => setEstadoInicial(e.target.value)}
              >
                <option value="confirmado" className="bg-dark text-white">Confirmado (Cocina / Preparación)</option>
                <option value="en_preparacion" className="bg-dark text-white">En Preparación</option>
                <option value="entregado" className="bg-dark text-white">Entregado Directamente (Venta Completa)</option>
              </select>
            </div>

            {/* Resumen Final de Cobro */}
            <div className="p-3 rounded bg-secondary bg-opacity-25 border border-gold mb-3">
              <div className="d-flex justify-content-between small text-white mb-1">
                <span className="text-white">Subtotal:</span>
                <span className="text-white fw-bold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between small text-white mb-1">
                <span className="text-white">IVA (15%):</span>
                <span className="text-white fw-bold">${impuesto.toFixed(2)}</span>
              </div>
              {tipoEntrega === "delivery" && (
                <div className="d-flex justify-content-between small text-white mb-1">
                  <span className="text-white">Envío ({distanciaKm} km):</span>
                  <span className="text-white fw-bold">${costoEnvio.toFixed(2)}</span>
                </div>
              )}
              <div className="d-flex justify-content-between fs-5 fw-bold text-gold border-top border-secondary pt-2">
                <span className="text-white">TOTAL A COBRAR:</span>
                <span className="text-gold">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botón de Confirmación */}
            <button
              className="btn btn-gold btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg py-3"
              disabled={cartItems.length === 0 || procesando}
              onClick={handleConfirmarVenta}
            >
              {procesando ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Procesando Venta...
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} />
                  Procesar y Confirmar Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Comprobante / Ticket de Venta Directa */}
      {pedidoCompletado && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.8)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-card border-gold text-light">
              <div className="modal-header border-bottom border-glass">
                <h5 className="modal-title text-gold fw-bold d-flex align-items-center gap-2">
                  <CheckCircle2 size={22} className="text-success" />
                  Comprobante de Venta #${pedidoCompletado.id}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPedidoCompletado(null)}
                ></button>
              </div>

              <div className="modal-body p-4 text-center">
                <img
                  src="/restaurante-pablito-si.png"
                  alt="Logo"
                  className="rounded-circle border border-gold mb-2"
                  style={{ width: "60px", height: "60px" }}
                />
                <h4 className="fw-bold text-gold mb-1">Restaurante Pablito</h4>
                <p className="extra-small text-muted mb-3">Venta Directa de Caja / Punto de Venta (POS)</p>

                <div className="text-start bg-dark p-3 rounded border border-glass mb-3 small">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Cliente:</span>
                    <strong className="text-white">{pedidoCompletado.clienteNombre}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Entrega:</span>
                    <strong className="text-gold text-capitalize">{pedidoCompletado.tipo_entrega}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Método de Pago:</span>
                    <strong className="text-white text-capitalize">{pedidoCompletado.metodo_pago}</strong>
                  </div>
                  {pedidoCompletado.metodo_pago === "efectivo" && (
                    <>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Pagó con:</span>
                        <strong className="text-white">${pedidoCompletado.montoPagado.toFixed(2)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Cambio Entregado:</span>
                        <strong className="text-success">${pedidoCompletado.cambio}</strong>
                      </div>
                    </>
                  )}
                </div>

                <h6 className="text-gold text-start fw-bold mb-2">Detalle de Productos:</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-dark table-sm small align-middle">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-center">Cant</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidoCompletado.items.map((it) => (
                        <tr key={it.producto_id}>
                          <td>{it.nombre}</td>
                          <td className="text-center">{it.cantidad}</td>
                          <td className="text-end">${(it.precio * it.cantidad).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="fs-4 fw-bold text-gold border-top border-glass pt-2 mb-3">
                  TOTAL PAGADO: ${Number(pedidoCompletado.total).toFixed(2)}
                </div>
              </div>

              <div className="modal-footer border-top border-glass d-flex justify-content-between">
                <button
                  className="btn btn-outline-gold d-flex align-items-center gap-2"
                  onClick={() => window.print()}
                >
                  <Printer size={18} /> Imprimir Comprobante
                </button>
                <button className="btn btn-gold fw-bold" onClick={() => setPedidoCompletado(null)}>
                  Aceptar y Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
