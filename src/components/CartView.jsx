import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../api/client";
import { playNotificationSound } from "../utils/soundUtils";
import AddressMapPicker from "./AddressMapPicker";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Send,
  MapPin,
  Phone,
  CreditCard,
  FileText,
  Navigation,
  Truck,
  AlertOctagon,
  Clock,
  Compass,
  CheckCircle2,
  X,
  Store,
  Upload,
} from "lucide-react";

// Fórmula de Haversine para distancia en kilómetros
function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radio de la Tierra en KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return Math.round(dist * 10) / 10;
}

export default function CartView({ usuario, setView, onSetCurrentOrderId, addAlert }) {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();

  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [distanciaKm, setDistanciaKm] = useState(2.0);
  const [submitting, setSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [uploadingComprobante, setUploadingComprobante] = useState(false);
  const [tipoEntrega, setTipoEntrega] = useState("delivery"); // 'delivery' | 'retiro'

  const handleComprobanteFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      if (addAlert) addAlert("El comprobante de transferencia no debe pesar más de 5MB.", "danger");
      return;
    }

    setUploadingComprobante(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const res = await apiFetch("/api/upload/comprobante", {
            method: "POST",
            body: { imagen: base64Data },
          });
          setComprobanteUrl(res.url);
          if (addAlert) addAlert("¡Comprobante subido con éxito!", "success");
        } catch (err) {
          if (addAlert) addAlert("Error subiendo comprobante: " + err.message, "danger");
        } finally {
          setUploadingComprobante(false);
        }
      };
      reader.onerror = () => {
        if (addAlert) addAlert("Error al leer el archivo de comprobante", "danger");
        setUploadingComprobante(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      if (addAlert) addAlert(err.message, "danger");
      setUploadingComprobante(false);
    }
  };

  // Estado de la configuración del negocio
  const [config, setConfig] = useState(null);
  const [estaAbierto, setEstaAbierto] = useState(true);

  // Cargar configuración de la API al montar
  useEffect(() => {
    async function cargarConfig() {
      try {
        const res = await apiFetch("/api/configuracion");
        if (res) {
          setConfig(res.configuracion);
          setEstaAbierto(res.esta_abierto);
        }
      } catch (err) {
        console.warn("No se pudo cargar la configuración de envío:", err);
      }
    }
    cargarConfig();
  }, []);

  // Auto-completar dirección y teléfono del perfil
  useEffect(() => {
    if (usuario) {
      if (usuario.direccion) setDireccion(usuario.direccion);
      if (usuario.telefono) setTelefono(usuario.telefono);
    }
  }, [usuario]);

  // Precios de platos incluyen IVA (15% desglosado)
  const IVA_RATE = 0.15;
  const subtotalNeto = Math.round((subtotal / (1 + IVA_RATE)) * 100) / 100;
  const impuesto = Math.round((subtotal - subtotalNeto) * 100) / 100;

  const costoBase = config ? Number(config.costo_base_envio || 0) : 0;
  const precioKm = config ? Number(config.precio_por_km || 0) : 0;
  const maxKm = config ? Number(config.distancia_maxima_km || 0) : 0;

  const costoEnvio = tipoEntrega === "retiro"
    ? 0
    : (distanciaKm > 0
        ? Math.round((costoBase + (distanciaKm * precioKm)) * 100) / 100
        : costoBase);

  const total = Math.round((subtotal + costoEnvio) * 100) / 100;

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

    if (!estaAbierto) {
      if (addAlert) addAlert("El restaurante está cerrado en este momento. Revisa el horario de atención.", "danger");
      return;
    }

    if (tipoEntrega === "delivery" && !direccion.trim()) {
      if (addAlert) addAlert("Por favor ingresa una dirección de entrega válida.", "danger");
      return;
    }

    if (tipoEntrega === "delivery" && distanciaKm > maxKm) {
      if (addAlert) addAlert(`La distancia de envío (${distanciaKm} km) supera la cobertura máxima del local (${maxKm} km).`, "danger");
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = cart.map((item) => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        notas: item.notas || "",
      }));

      const payload = {
        items: itemsPayload,
        direccion_entrega: tipoEntrega === "retiro" ? "Retiro en el local — Restaurante Pablito" : direccion.trim(),
        telefono_contacto: telefono.trim(),
        notas: notas.trim(),
        metodo_pago: metodoPago,
        distancia_km: tipoEntrega === "retiro" ? 0 : distanciaKm,
        tipo_entrega: tipoEntrega,
      };

      if (metodoPago === "transferencia" && comprobanteUrl) {
        payload.comprobante_url = comprobanteUrl;
      }

      const res = await apiFetch("/api/pedidos", {
        method: "POST",
        body: payload,
      });

      if (addAlert) {
        addAlert("¡Pedido realizado con éxito! Código: #" + res.pedido.id, "success");
      }

      playNotificationSound();

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

      {/* Alerta si el restaurante se encuentra CERRADO */}
      {!estaAbierto && (
        <div className="alert alert-danger d-flex align-items-center gap-3 mb-4 shadow-sm">
          <AlertOctagon size={32} className="flex-shrink-0" />
          <div>
            <h5 className="alert-heading mb-1 fw-bold">Restaurante Cerrado en este momento</h5>
            <p className="mb-0 small">
              Horario de atención: <strong>{config?.hora_apertura || "08:00"} a {config?.hora_cierre || "22:00"}</strong> ({config?.dias_atencion || "Lunes a Domingo"}).
              No es posible realizar nuevos pedidos fuera del horario operativo.
            </p>
          </div>
        </div>
      )}

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
                  className="p-3 border border-glass rounded bg-white shadow-sm d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
                >
                  <div className="d-flex align-items-center gap-3">
                    {item.producto.imagen_url && (
                      <img
                        src={item.producto.imagen_url}
                        alt={item.producto.nombre}
                        className="rounded object-fit-cover shadow-sm"
                        style={{ width: "60px", height: "60px" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <h4 className="h6 text-dark fw-bold mb-1">{item.producto.nombre}</h4>
                      <div className="text-muted extra-small">
                        Precio unitario: ${Number(item.producto.precio).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-4">
                    {/* Control de cantidad */}
                    <div className="d-flex align-items-center gap-2 border border-glass rounded px-2 py-1 bg-light">
                      <button
                        className={`btn btn-link p-0 ${item.cantidad <= 1 ? "text-muted opacity-50" : "text-gold"}`}
                        onClick={() => updateQuantity(item.producto.id, Math.max(1, item.cantidad - 1))}
                        disabled={item.cantidad <= 1}
                        title={item.cantidad <= 1 ? "La cantidad mínima es 1. Para eliminar, usa el tacho de basura." : "Restar una unidad"}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="fw-bold text-dark px-2">{item.cantidad}</span>
                      <button
                        className="btn btn-link text-gold p-0"
                        onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal por item */}
                    <div className="text-end" style={{ minWidth: "80px" }}>
                      <span className="fw-bold text-gold fs-6">
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
              {/* Selector de Modalidad de Entrega */}
              <div className="mb-4">
                <label className="form-label text-gold small fw-bold d-flex align-items-center gap-1 mb-2">
                  <Truck size={16} /> Modalidad de Entrega *
                </label>
                <div className="row g-2">
                  <div className="col-6">
                    <button
                      type="button"
                      className={`btn w-100 p-3 rounded d-flex flex-column align-items-center justify-content-center gap-1 transition-all ${
                        tipoEntrega === "delivery"
                          ? "btn-gold fw-bold shadow"
                          : "btn-outline-secondary text-dark border-glass bg-light"
                      }`}
                      onClick={() => setTipoEntrega("delivery")}
                    >
                      <Truck size={22} />
                      <span className="small">Envío a Domicilio</span>
                    </button>
                  </div>
                  <div className="col-6">
                    <button
                      type="button"
                      className={`btn w-100 p-3 rounded d-flex flex-column align-items-center justify-content-center gap-1 transition-all ${
                        tipoEntrega === "retiro"
                          ? "btn-gold fw-bold shadow"
                          : "btn-outline-secondary text-dark border-glass bg-light"
                      }`}
                      onClick={() => setTipoEntrega("retiro")}
                    >
                      <Store size={22} />
                      <span className="small">Retiro en Local ($0.00)</span>
                    </button>
                  </div>
                </div>
              </div>

              {tipoEntrega === "delivery" ? (
                <>
                  {/* Dirección de Entrega Dinámica */}
                  <div className="mb-3">
                    <label className="form-label text-gold small fw-bold d-flex align-items-center justify-content-between">
                      <span className="d-flex align-items-center gap-1">
                        <MapPin size={16} /> Dirección de Entrega *
                      </span>
                      <button
                        type="button"
                        className="btn btn-link text-gold p-0 text-decoration-none extra-small fw-bold d-flex align-items-center gap-1"
                        onClick={() => setShowMapPicker(true)}
                      >
                        <Navigation size={12} /> Seleccionar en Mapa / GPS
                      </button>
                    </label>
                    <div className="input-group shadow-sm mb-2">
                      <input
                        type="text"
                        className="form-control glass-input"
                        placeholder="Calle principal, número y referencia"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn btn-gold d-flex align-items-center gap-1"
                        onClick={() => setShowMapPicker(true)}
                        title="Abrir mapa interactivo"
                      >
                        <MapPin size={16} />
                        <span className="d-none d-sm-inline">Mapa</span>
                      </button>
                    </div>
                  </div>

                  {/* Selector de Distancia en KM para Delivery */}
                  <div className="mb-3 p-3 rounded border border-glass bg-dark bg-opacity-30">
                    <label className="form-label text-gold small fw-bold d-flex align-items-center justify-content-between mb-1">
                      <span className="d-flex align-items-center gap-1">
                        <Truck size={16} /> Distancia de Envío (KM)
                      </span>
                      <span className="badge bg-gold text-dark fw-bold">{distanciaKm} km</span>
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="range"
                        className="form-range flex-grow-1"
                        min="0.5"
                        max={maxKm}
                        step="0.5"
                        value={distanciaKm}
                        onChange={(e) => setDistanciaKm(parseFloat(e.target.value))}
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max={maxKm}
                        className="form-control glass-input text-center fw-bold"
                        style={{ width: "80px" }}
                        value={distanciaKm}
                        onChange={(e) => setDistanciaKm(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="d-flex justify-content-between extra-small text-muted mt-1">
                      <span>Base: ${costoBase.toFixed(2)}</span>
                      <span>+${precioKm.toFixed(2)}/km</span>
                      <span>Máx: {maxKm} km</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mb-3 p-3 rounded border border-gold bg-warning bg-opacity-10 text-dark shadow-sm">
                  <div className="d-flex align-items-center gap-2 mb-1 fw-bold text-gold">
                    <Store size={18} /> Retiro en Restaurante Pablito
                  </div>
                  <p className="extra-small mb-0 text-muted">
                    No se cobrará costo de envío ($0.00). Podrás retirar tu comida en el local en cuanto el pedido cambie a <strong>"Listo para Entrega"</strong>.
                  </p>
                </div>
              )}

              {/* Teléfono de contacto */}
              <div className="mb-3">
                <label className="form-label text-gold small fw-bold d-flex align-items-center gap-1">
                  <Phone size={16} /> Teléfono de Contacto
                </label>
                <input
                  type="text"
                  className="form-control glass-input"
                  placeholder="Ej. 0991234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              {/* Notas del pedido */}
              <div className="mb-3">
                <label className="form-label text-gold small fw-bold d-flex align-items-center gap-1">
                  <FileText size={16} /> Notas Adicionales
                </label>
                <textarea
                  className="form-control glass-input"
                  rows="2"
                  placeholder="Ej. Tocar el timbre, sin salsas..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                ></textarea>
              </div>

              {/* Método de pago */}
              <div className="mb-4">
                <label className="form-label text-gold small fw-bold d-flex align-items-center gap-1">
                  <CreditCard size={16} /> Método de Pago
                </label>
                <select
                  className="form-select glass-input mb-3"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  <option value="efectivo">Efectivo contra entrega</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                </select>

                {metodoPago === "transferencia" && (
                  <div className="p-3 border border-glass rounded bg-dark bg-opacity-30 fade-in-up">
                    <h6 className="text-gold fw-bold mb-2 small d-flex align-items-center gap-1">
                      <CreditCard size={14} /> Datos para Transferencia Bancaria
                    </h6>
                    <div className="extra-small text-muted mb-3 bg-white p-2 rounded border border-glass">
                      <div><strong>Banco:</strong> Banco Pichincha</div>
                      <div><strong>Tipo de Cuenta:</strong> Ahorros</div>
                      <div><strong>Nº de Cuenta:</strong> 2205489100</div>
                      <div><strong>Titular:</strong> Restaurante Pablito S.A.</div>
                      <div><strong>RUC:</strong> 1792345678001</div>
                    </div>

                    <label className="form-label text-gold extra-small fw-bold d-block mb-1">
                      Comprobante de Transferencia
                    </label>
                    <div className="d-flex align-items-center gap-2">
                      <label
                        htmlFor="comprobanteUploadInput"
                        className={`btn btn-sm btn-gold d-flex align-items-center gap-1 w-100 justify-content-center ${
                          uploadingComprobante ? "disabled" : ""
                        }`}
                        style={{ cursor: "pointer" }}
                      >
                        <Upload size={14} />
                        {uploadingComprobante
                          ? "Subiendo comprobante..."
                          : comprobanteUrl
                          ? "Cambiar Comprobante"
                          : "Adjuntar Foto del Comprobante"}
                      </label>
                      <input
                        type="file"
                        id="comprobanteUploadInput"
                        accept="image/*"
                        className="d-none"
                        onChange={handleComprobanteFileChange}
                        disabled={uploadingComprobante}
                      />
                    </div>

                    {comprobanteUrl && (
                      <div className="mt-2 p-2 border border-glass rounded bg-white d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={comprobanteUrl}
                            alt="Comprobante"
                            className="rounded object-fit-cover border border-gold"
                            style={{ width: "45px", height: "45px" }}
                          />
                          <div>
                            <span className="extra-small text-success fw-bold d-flex align-items-center gap-1">
                              <CheckCircle2 size={12} /> Comprobante Listo
                            </span>
                            <span className="extra-small text-muted text-truncate d-block" style={{ maxWidth: "200px" }}>
                              {comprobanteUrl}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger p-1"
                          onClick={() => setComprobanteUrl("")}
                          title="Eliminar comprobante"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Desglose de Totales */}
              <div className="border-top border-glass pt-3 mb-4">
                <div className="d-flex justify-content-between text-muted mb-2">
                  <span>Monto Platos (IVA incl.)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-muted extra-small mb-2">
                  <span>Subtotal Neto (sin IVA)</span>
                  <span>${subtotalNeto.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-muted extra-small mb-2">
                  <span>IVA 15% (incl. desglosado)</span>
                  <span>${impuesto.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-muted mb-2 fw-medium">
                  <span className="d-flex align-items-center gap-1">
                    <Truck size={14} className="text-gold" /> Envío Delivery ({distanciaKm} km)
                  </span>
                  <span className="text-gold">${costoEnvio.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-gold fs-4 fw-bold border-top border-glass pt-2 mt-2">
                  <span>Total Final</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-lg"
                disabled={submitting || !estaAbierto}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Procesando...
                  </>
                ) : !estaAbierto ? (
                  <>
                    <Clock size={18} />
                    Restaurante Cerrado
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Confirmar y Pedir Ahora (${total.toFixed(2)})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Mapa Interactivo y Geolocalización */}
      <AddressMapPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialAddress={direccion}
        onConfirmAddress={(loc) => {
          setDireccion(loc.direccion);
          if (loc.latitud && loc.longitud && config) {
            const restLat = Number(config.latitud_restaurante);
            const restLon = Number(config.longitud_restaurante);
            const dist = calcularDistanciaHaversine(restLat, restLon, loc.latitud, loc.longitud);
            if (dist > 0) {
              setDistanciaKm(Math.min(dist, maxKm));
              if (addAlert) {
                addAlert(`📍 Ubicación seleccionada. Distancia calculada: ${dist} km.`, "info");
              }
            }
          }
        }}
      />
    </div>
  );
}
