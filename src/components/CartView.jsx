import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../api/client";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Send, MapPin, Phone, CreditCard, FileText } from "lucide-react";

export default function CartView({ usuario, setView, addAlert, onSetCurrentOrderId }) {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();

  const [direccion, setDireccion] = useState(usuario?.direccion || "");
  const [telefono, setTelefono] = useState(usuario?.telefono || "");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [submitting, setSubmitting] = useState(false);

  const IVA_RATE = 0.15;
  const impuesto = Math.round(subtotal * IVA_RATE * 100) / 100;
  const total = Math.round((subtotal + impuesto) * 100) / 100;

  const handleConfirmarPedido = async (e) => {
    e.preventDefault();

    if (!usuario) {
      if (addAlert) addAlert("Debes iniciar sesión para confirmar tu pedido.", "warning");
      setView("login");
      return;
    }

    if (cart.length === 0) {
      if (addAlert) addAlert("El carrito de compras está vacío.", "danger");
      return;
    }

    if (!direccion.trim()) {
      if (addAlert) addAlert("Por favor ingresa una dirección de entrega válida.", "danger");
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = cart.map((item) => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        notas: item.notas || "",
      }));

      const res = await apiFetch("/api/pedidos", {
        method: "POST",
        body: {
          items: itemsPayload,
          direccion_entrega: direccion.trim(),
          telefono_contacto: telefono.trim(),
          notas: notas.trim(),
          metodo_pago: metodoPago,
        },
      });

      if (addAlert) {
        addAlert("¡Pedido realizado con éxito! Código: #" + res.pedido.id, "success");
      }

      clearCart();
      if (onSetCurrentOrderId) {
        onSetCurrentOrderId(res.pedido.id);
      }
      setView("seguimiento");
    } catch (err) {
      if (addAlert) {
        addAlert(err.message || "Error al procesar el pedido.", "danger");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container py-5 text-center fade-in-up">
        <div className="glass-card p-5 max-w-md mx-auto">
          <div className="p-4 rounded-circle bg-dark border border-gold text-gold d-inline-flex mb-4">
            <ShoppingCart size={48} />
          </div>
          <h2 className="text-gold mb-3">Tu carrito está vacío</h2>
          <p className="text-muted mb-4">
            Aún no has agregado platos deliciosos a tu orden. ¡Descubre nuestro menú!
          </p>
          <button className="btn btn-gold py-3 px-4" onClick={() => setView("menu")}>
            Explorar Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 fade-in-up">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-outline-gold p-2" onClick={() => setView("menu")}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="hero-title text-gold mb-0 h2">Mi Carrito y Pedido</h1>
      </div>

      <div className="row g-4">
        {/* Lista de productos en el Carrito */}
        <div className="col-lg-7">
          <div className="glass-card p-4 mb-4">
            <div className="d-flex align-items-center justify-content-between pb-3 border-bottom border-glass mb-3">
              <h2 className="h5 text-gold mb-0">Detalle de Ítems ({cart.length})</h2>
              <button
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                onClick={clearCart}
              >
                <Trash2 size={14} />
                Vaciar Carrito
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {cart.map((item) => (
                <div
                  key={item.producto.id}
                  className="p-3 border border-glass rounded bg-dark bg-opacity-50 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
                >
                  <div className="d-flex align-items-center gap-3">
                    {item.producto.imagen_url && (
                      <img
                        src={item.producto.imagen_url}
                        alt={item.producto.nombre}
                        className="rounded object-fit-cover"
                        style={{ width: "60px", height: "60px" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <h4 className="h6 text-gold mb-1">{item.producto.nombre}</h4>
                      <div className="text-muted extra-small">
                        Precio unitario: ${Number(item.producto.precio).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-4">
                    {/* Control de cantidad */}
                    <div className="d-flex align-items-center gap-2 border border-glass rounded px-2 py-1 bg-dark">
                      <button
                        className="btn btn-link text-gold p-0"
                        onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="fw-bold text-light px-2">{item.cantidad}</span>
                      <button
                        className="btn btn-link text-gold p-0"
                        onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal por item */}
                    <div className="text-end" style={{ minWidth: "80px" }}>
                      <span className="fw-bold text-gold">
                        ${(item.producto.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>

                    <button
                      className="btn btn-link text-danger p-0 ms-2"
                      onClick={() => removeFromCart(item.producto.id)}
                      title="Eliminar producto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen de Pago y Formulario de Entrega */}
        <div className="col-lg-5">
          <div className="glass-card p-4 mb-4">
            <h2 className="h5 text-gold mb-4 border-bottom border-glass pb-2">Información de Entrega</h2>

            <form onSubmit={handleConfirmarPedido}>
              {/* Dirección de Entrega */}
              <div className="mb-3">
                <label className="form-label text-gold small d-flex align-items-center gap-1">
                  <MapPin size={16} /> Dirección de Entrega *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Calle principal, número y referencia"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required
                />
              </div>

              {/* Teléfono de contacto */}
              <div className="mb-3">
                <label className="form-label text-gold small d-flex align-items-center gap-1">
                  <Phone size={16} /> Teléfono de Contacto
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 0991234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              {/* Notas del pedido */}
              <div className="mb-3">
                <label className="form-label text-gold small d-flex align-items-center gap-1">
                  <FileText size={16} /> Notas Adicionales
                </label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="Ej. Tocar el timbre, sin salsas..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                ></textarea>
              </div>

              {/* Método de pago */}
              <div className="mb-4">
                <label className="form-label text-gold small d-flex align-items-center gap-1">
                  <CreditCard size={16} /> Método de Pago
                </label>
                <select
                  className="form-input"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  <option value="efectivo">Efectivo contra entrega</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>
              </div>

              {/* Desglose de Totales */}
              <div className="border-top border-glass pt-3 mb-4">
                <div className="d-flex justify-content-between text-muted mb-2">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-muted mb-2">
                  <span>IVA (15%)</span>
                  <span>${impuesto.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-gold fs-4 fw-bold border-top border-glass pt-2 mt-2">
                  <span>Total Estimado</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Confirmar y Pedir Ahora
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
