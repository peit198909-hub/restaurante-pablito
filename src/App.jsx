import React, { useState, useEffect, useCallback, useRef } from "react";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import AlertContainer from "./components/Alert";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ProfileView from "./components/ProfileView";
import AdminCreateUser from "./components/AdminCreateUser";
import MenuView from "./components/MenuView";
import CartView from "./components/CartView";
import MyOrdersView from "./components/MyOrdersView";
import OrderTrackingView from "./components/OrderTrackingView";
import AdminProductsView from "./components/admin/AdminProductsView";
import AdminOrdersView from "./components/admin/AdminOrdersView";
import AdminDashboardView from "./components/admin/AdminDashboardView";
import AdminConfigView from "./components/admin/AdminConfigView";
import AdminPosView from "./components/admin/AdminPosView";
import DeliveryView from "./components/DeliveryView";
import { useOrderAbly } from "./hooks/useOrderAbly";
import { playNotificationSound } from "./utils/soundUtils";
import { apiFetch } from "./api/client";
import { UtensilsCrossed, ShieldAlert, User, ShieldCheck, ShoppingBag, Package, TrendingUp, Truck } from "lucide-react";

const FORMATO_ESTADO = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_preparacion: "En Preparación",
  listo: "Listo para Entrega",
  en_camino: "En Camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function AppContent() {
  // Inicializar estado con datos guardados en localStorage para persistencia
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [usuario, setUsuario] = useState(() => {
    const savedUser = localStorage.getItem("usuario");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [view, setViewState] = useState(() => {
    return localStorage.getItem("currentView") || "inicio";
  });

  const setView = (newView) => {
    setViewState(newView);
    localStorage.setItem("currentView", newView);
  };

  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Estado para la lista de notificaciones persistente de la campanita
  const [notifications, setNotifications] = useState(() => {
    const savedUser = localStorage.getItem("usuario");
    const userId = savedUser ? JSON.parse(savedUser)?.id : "guest";
    const saved = localStorage.getItem(`notificaciones_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar notificaciones por usuario en localStorage
  useEffect(() => {
    if (usuario?.id) {
      localStorage.setItem(`notificaciones_${usuario.id}`, JSON.stringify(notifications));
    }
  }, [notifications, usuario?.id]);

  // Función utilitaria para agregar alertas flotantes autodescartables
  const addAlert = useCallback((message, type = "info") => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      removeAlert(id);
    }, 5000);
  }, []);

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Construir detalles de notificación estructurados según el rol del usuario
  const buildNotificationDetails = useCallback((eventData, rol) => {
    const { tipo, pedido_id, estado } = eventData;
    const id = pedido_id || "";
    let titulo = `Pedido #${id}`;
    let mensaje = "";
    let badgeColor = "bg-warning text-dark";

    if (rol === "repartidor") {
      if (tipo === "asignado") {
        titulo = `🛵 Nueva Entrega Asignada #${id}`;
        mensaje = `Se te asignó el pedido #${id}. Revisa los detalles de entrega en Mis Entregas.`;
        badgeColor = "bg-gold text-dark";
      } else if (estado === "listo") {
        titulo = `📦 Pedido #${id} listo en cocina`;
        mensaje = `El pedido #${id} está cocinado y listo para ser despachado.`;
        badgeColor = "bg-info text-dark";
      } else if (estado === "en_camino") {
        titulo = `🚚 Entrega #${id} en camino`;
        mensaje = `Iniciaste el reparto del pedido #${id}.`;
        badgeColor = "bg-primary text-white";
      } else if (estado === "entregado") {
        titulo = `🎉 Entrega #${id} completada`;
        mensaje = `El pedido #${id} fue entregado exitosamente.`;
        badgeColor = "bg-success text-white";
      } else {
        titulo = `🔔 Entrega #${id} actualizada`;
        mensaje = `El pedido #${id} cambió a estado '${FORMATO_ESTADO[estado] || estado}'.`;
        badgeColor = "bg-secondary text-white";
      }
    } else if (rol === "administrador") {
      if (tipo === "creado" || estado === "pendiente") {
        titulo = `🛒 Nuevo Pedido #${id} recibido`;
        mensaje = `Se ha recibido un nuevo pedido en el sistema. Revisa los detalles en Gestión de Pedidos.`;
        badgeColor = "bg-success text-white";
      } else if (estado === "confirmado") {
        titulo = `🔵 Pedido #${id} Confirmado`;
        mensaje = `El pedido #${id} fue aceptado y enviado a cocina.`;
        badgeColor = "bg-primary text-white";
      } else if (estado === "en_preparacion") {
        titulo = `🍳 Pedido #${id} En Preparación`;
        mensaje = `El pedido #${id} se está cocinando en cocina.`;
        badgeColor = "bg-warning text-dark";
      } else if (estado === "listo") {
        titulo = `📦 Pedido #${id} Listo para Entrega`;
        mensaje = `El pedido #${id} está empacado y listo para retiro/reparto.`;
        badgeColor = "bg-info text-dark";
      } else if (estado === "en_camino") {
        titulo = `🛵 Pedido #${id} En Camino`;
        mensaje = `El repartidor inició la entrega del pedido #${id}.`;
        badgeColor = "bg-primary text-white";
      } else if (estado === "entregado") {
        titulo = `✅ Pedido #${id} Entregado`;
        mensaje = `El pedido #${id} fue marcado como entregado.`;
        badgeColor = "bg-success text-white";
      } else if (estado === "cancelado") {
        titulo = `❌ Pedido #${id} Cancelado`;
        mensaje = `El pedido #${id} ha sido cancelado.`;
        badgeColor = "bg-danger text-white";
      } else {
        titulo = `🔔 Pedido #${id} Actualizado`;
        mensaje = `El pedido #${id} cambió al estado '${FORMATO_ESTADO[estado] || estado}'.`;
        badgeColor = "bg-secondary text-white";
      }
    } else {
      // Cliente
      if (tipo === "creado" || estado === "pendiente") {
        titulo = `🛒 ¡Tu pedido #${id} fue recibido!`;
        mensaje = `Tu pedido #${id} fue enviado al restaurante. ¡Está pendiente de aprobación y cocina!`;
        badgeColor = "bg-warning text-dark";
      } else if (estado === "confirmado") {
        titulo = `🔵 ¡Tu pedido #${id} fue confirmado!`;
        mensaje = `El restaurante aceptó tu pedido #${id}. ¡En breve pasará a la cocina!`;
        badgeColor = "bg-primary text-white";
      } else if (estado === "en_preparacion") {
        titulo = `👨‍🍳 Tu pedido #${id} está en cocina`;
        mensaje = `Nuestros chefs están preparando tu pedido #${id} con los mejores ingredientes.`;
        badgeColor = "bg-warning text-dark";
      } else if (estado === "listo") {
        titulo = `📦 ¡Tu pedido #${id} está listo!`;
        mensaje = `Tu pedido #${id} ya fue preparado y empaquetado.`;
        badgeColor = "bg-info text-dark";
      } else if (estado === "en_camino") {
        titulo = `🛵 ¡Tu pedido #${id} va en camino!`;
        mensaje = `El motorizado salió con tu pedido #${id} rumbo a tu domicilio. ¡Prepárate para recibirlo!`;
        badgeColor = "bg-gold text-dark";
      } else if (estado === "entregado") {
        titulo = `🎉 ¡Pedido #${id} Entregado!`;
        mensaje = `Tu pedido #${id} ha sido entregado. ¡Que disfrutes tu comida en Restaurante Pablito!`;
        badgeColor = "bg-success text-white";
      } else if (estado === "cancelado") {
        titulo = `❌ Tu pedido #${id} fue cancelado`;
        mensaje = `El pedido #${id} fue cancelado. Si tienes dudas, contáctate con nosotros.`;
        badgeColor = "bg-danger text-white";
      } else {
        titulo = `🔔 Tu pedido #${id} fue actualizado`;
        mensaje = `Tu pedido #${id} pasó al estado '${FORMATO_ESTADO[estado] || estado}'.`;
        badgeColor = "bg-secondary text-white";
      }
    }

    return {
      id: Date.now() + Math.random(),
      pedido_id: id,
      titulo,
      mensaje,
      estado,
      badgeColor,
      timestamp: new Date().toISOString(),
      leido: false,
    };
  }, []);

  // Sincronizar notificaciones activas del servidor al iniciar sesión o refrescar
  useEffect(() => {
    if (!usuario?.id || !token) {
      setNotifications([]);
      return;
    }

    let iniciales = [];
    try {
      const saved = localStorage.getItem(`notificaciones_${usuario.id}`);
      if (saved) iniciales = JSON.parse(saved);
    } catch (e) {
      iniciales = [];
    }

    const sincronizarConServidor = async () => {
      try {
        if (usuario.rol === "repartidor") {
          const res = await apiFetch("/api/pedidos/repartidor/activo");
          const entregas = res?.entrega?.entregas || (res?.entrega?.pedido ? [res.entrega] : []);
          for (const ent of entregas) {
            if (ent?.pedido?.id) {
              const pid = ent.pedido.id;
              const existe = iniciales.some((n) => Number(n.pedido_id) === Number(pid));
              if (!existe) {
                const notif = buildNotificationDetails(
                  { tipo: "asignado", pedido_id: pid, estado: ent.pedido.estado, pedido: ent.pedido },
                  "repartidor"
                );
                iniciales = [notif, ...iniciales];
              }
            }
          }
        } else if (usuario.rol === "administrador") {
          const res = await apiFetch("/api/pedidos?estado=pendiente&limit=10");
          const pedidosPendientes = res?.pedidos || (Array.isArray(res) ? res : []);
          for (const ped of pedidosPendientes) {
            const existe = iniciales.some((n) => Number(n.pedido_id) === Number(ped.id));
            if (!existe) {
              const notif = buildNotificationDetails(
                { tipo: "creado", pedido_id: ped.id, estado: ped.estado, pedido: ped },
                "administrador"
              );
              iniciales = [notif, ...iniciales];
            }
          }
        } else {
          // Cliente: Sincronizar sus pedidos recientes
          const res = await apiFetch("/api/pedidos/mis-pedidos?page=1&limit=5");
          const misPedidos = res?.pedidos || (Array.isArray(res) ? res : []);
          for (const ped of misPedidos) {
            const existe = iniciales.some((n) => Number(n.pedido_id) === Number(ped.id));
            if (!existe) {
              const notif = buildNotificationDetails(
                { tipo: "creado", pedido_id: ped.id, estado: ped.estado, pedido: ped },
                "cliente"
              );
              iniciales = [notif, ...iniciales];
            }
          }
        }
        setNotifications((prev) => {
          const mapa = new Map();
          // Preservar notificaciones existentes
          prev.forEach((n) => {
            const key = `${n.pedido_id}_${n.titulo}`;
            if (!mapa.has(key)) mapa.set(key, n);
          });
          // Agregar notificaciones iniciales sin duplicar
          iniciales.forEach((n) => {
            const key = `${n.pedido_id}_${n.titulo}`;
            if (!mapa.has(key)) mapa.set(key, n);
          });
          return Array.from(mapa.values()).slice(0, 50);
        });
      } catch (err) {
        setNotifications((prev) => prev);
      }
    };

    sincronizarConServidor();
  }, [usuario?.id, usuario?.rol, token, buildNotificationDetails]);

  const lastProcessedRef = useRef(new Map());

  // Manejador global de eventos Ably Realtime
  const handleOrderAblyUpdate = useCallback((eventData) => {
    if (!eventData || !eventData.pedido_id) return;
    const { tipo, pedido_id, estado, usuario_id, repartidor_id } = eventData;
    const key = `${pedido_id}_${tipo || ''}_${estado || ''}`;
    const now = Date.now();

    // Evitar procesar el mismo evento en menos de 1.5s
    if (lastProcessedRef.current.has(key) && (now - lastProcessedRef.current.get(key)) < 1500) {
      return;
    }
    lastProcessedRef.current.set(key, now);

    const nombreEstado = FORMATO_ESTADO[estado] || estado;

    // ID del usuario logueado (siempre como string para comparaciones seguras)
    const miId = String(usuario?.id ?? "");

    // Determinar si corresponde notificar y reproducir sonido en esta ventana según el rol activo
    let debeSonaryNotificar = false;

    if (usuario?.rol === "administrador") {
      // El administrador SIEMPRE recibe notificaciones de todos los pedidos
      debeSonaryNotificar = true;
    } else if (usuario?.rol === "repartidor") {
      // El repartidor recibe si:
      // - El pedido fue asignado a él (repartidor_id coincide)
      // - O es un evento "asignado" sin repartidor_id (caso de auto-asignación en cola)
      const repId = repartidor_id != null ? String(repartidor_id) : null;
      if (repId === miId || (tipo === "asignado" && !repId)) {
        debeSonaryNotificar = true;
      }
    } else if (usuario?.rol === "cliente") {
      // El cliente recibe si:
      // - El usuario_id del evento coincide con su propio ID
      // - O si usuario_id no está en el evento (eventos como "asignado" que pueden omitirlo)
      const evtUserId = usuario_id != null ? String(usuario_id) : null;
      if (!evtUserId || evtUserId === miId) {
        debeSonaryNotificar = true;
      }
    } else if (!usuario) {
      debeSonaryNotificar = true;
    }

    if (!debeSonaryNotificar) return;

    // Reproducir sonido brillante de notificación sonora
    playNotificationSound();

    if (usuario?.rol === "repartidor") {
      if (tipo === "asignado") {
        addAlert(`🛥 ¡Nuevo pedido #${pedido_id} asignado a tu cuenta!`, "success");
      } else {
        addAlert(`🔔 Entrega #${pedido_id} actualizada: ${nombreEstado}`, "info");
      }
    } else if (usuario?.rol === "administrador") {
      if (tipo === "creado") {
        addAlert(`🔔 ¡Nuevo pedido #${pedido_id} recibido en el restaurante!`, "success");
      } else {
        addAlert(`🔔 Pedido #${pedido_id} actualizado a '${nombreEstado}'`, "info");
      }
    } else {
      addAlert(`🔔 Tu pedido #${pedido_id} ahora está en estado: ${nombreEstado}`, "info");
    }

    // Agregar a la campanita persistente si el usuario está autenticado sin duplicados
    if (usuario) {
      const nuevaNotif = buildNotificationDetails(eventData, usuario.rol);
      setNotifications((prev) => {
        const yaExiste = prev.some(
          (n) => Number(n.pedido_id) === Number(pedido_id) && n.titulo === nuevaNotif.titulo
        );
        if (yaExiste) return prev;
        return [nuevaNotif, ...prev.slice(0, 49)];
      });
    }
  }, [usuario, addAlert, buildNotificationDetails]);

  // Activar conexión en tiempo real exclusiva de Ably Realtime
  useOrderAbly(token, handleOrderAblyUpdate);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leido: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleSelectNotification = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, leido: true } : n))
    );

    if (usuario?.rol === "repartidor") {
      setView("delivery");
    } else if (usuario?.rol === "administrador") {
      setView("admin-pedidos");
    } else {
      if (notif.pedido_id) {
        setCurrentOrderId(notif.pedido_id);
        setView("seguimiento");
      } else {
        setView("mis-pedidos");
      }
    }
  };

  // Guardar sesión tras login/registro
  const handleLoginSuccess = (newToken, nuevoUsuario) => {
    setToken(newToken);
    setUsuario(nuevoUsuario);
    localStorage.setItem("token", newToken);
    localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));

    // Cargar notificaciones del usuario logueado
    const savedNotifs = localStorage.getItem(`notificaciones_${nuevoUsuario.id}`);
    setNotifications(savedNotifs ? JSON.parse(savedNotifs) : []);

    addAlert(`Bienvenido/a de nuevo, ${nuevoUsuario.nombre}`, "success");
    if (nuevoUsuario?.rol === "repartidor") {
      setView("delivery");
    } else if (nuevoUsuario?.rol === "administrador") {
      setView("admin-dashboard");
    } else {
      setView("menu");
    }
  };

  // Actualizar datos del usuario autenticado en la sesión global
  const handleUpdateUsuario = (usuarioActualizado) => {
    setUsuario(usuarioActualizado);
    localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
  };

  // Limpiar sesión
  const handleLogout = () => {
    setToken("");
    setUsuario(null);
    setNotifications([]);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("currentView");
    setViewState("inicio");
    addAlert("Sesión cerrada con éxito", "info");
  };

  return (
    <>
      {/* Barra de navegación adaptable con campana de notificaciones */}
      <Navbar
        usuario={usuario}
        currentView={view}
        setView={setView}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearNotifications={handleClearNotifications}
        onSelectNotification={handleSelectNotification}
      />

      {/* Contenedor global de alertas flotantes */}
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <main className="main-content d-flex align-items-center">
        {view === "inicio" && (
          usuario?.rol === "administrador" ? (
            <AdminDashboardView setView={setView} addAlert={addAlert} />
          ) : (
            <div className="container text-center py-5 fade-in-up">
              <div className="row justify-content-center">
                <div className="col-lg-8">
                  <div className="glass-card p-5 mb-4">
                    <div className="mb-4">
                      <img
                        src="/restaurante-pablito-si.png"
                        alt="Restaurante Pablito Logo"
                        className="rounded-circle shadow-lg border border-gold"
                        style={{ width: "110px", height: "110px", objectFit: "cover" }}
                      />
                    </div>

                    {usuario ? (
                      <div>
                        <h1 className="hero-title text-gold mb-3">
                          ¡Bienvenido/a, {usuario.nombre} {usuario.apellido}!
                        </h1>
                        <p className="hero-subtitle mb-4">
                          Nos alegra tenerte de vuelta en el portal de Restaurante Pablito.
                        </p>

                        <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                          <button
                            className="btn btn-gold d-flex align-items-center gap-2 py-3 px-4 fw-bold shadow-sm"
                            onClick={() => setView("menu")}
                          >
                            <ShoppingBag size={20} />
                            Ver el Menú Delicioso
                          </button>

                          <button
                            className="btn btn-outline-gold d-flex align-items-center gap-2 py-3 px-4"
                            onClick={() => setView("mis-pedidos")}
                          >
                            <Package size={20} />
                            Mis Pedidos
                          </button>

                          <button
                            className="btn btn-outline-gold d-flex align-items-center gap-2 py-3 px-4"
                            onClick={() => setView("perfil")}
                          >
                            <User size={20} />
                            Mi Perfil
                          </button>
                        </div>

                        {/* Tarjeta informativa de cliente */}
                        <div className="mt-5 p-3 border border-glass rounded bg-dark bg-opacity-50 max-w-sm mx-auto">
                          <div className="d-flex align-items-center justify-content-center gap-2 text-gold small">
                            <User size={18} />
                            <span className="fw-bold">Nivel de Acceso: Cliente Registrado</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                    <div>
                      <h1 className="hero-title text-gold mb-3">Restaurante Pablito</h1>
                      <p className="hero-subtitle mb-4">
                        Bienvenido a nuestro sistema web de gestión de pedidos. Registrate como cliente
                        para poder disfrutar de las delicias de nuestra carta.
                      </p>
                      <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                        <button
                          className="btn btn-gold py-3 px-4 d-flex align-items-center gap-2"
                          onClick={() => setView("menu")}
                        >
                          <ShoppingBag size={20} />
                          Ver Menú
                        </button>
                        <button
                          className="btn btn-outline-gold py-3 px-4"
                          onClick={() => setView("login")}
                        >
                          Iniciar Sesión
                        </button>
                        <button
                          className="btn btn-outline-gold py-3 px-4"
                          onClick={() => setView("registro")}
                        >
                          Registrarse
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {view === "menu" && <MenuView setView={setView} addAlert={addAlert} />}

        {view === "carrito" && (
          <CartView
            usuario={usuario}
            setView={setView}
            addAlert={addAlert}
            onSetCurrentOrderId={setCurrentOrderId}
          />
        )}

        {view === "mis-pedidos" && (
          <MyOrdersView setView={setView} onSetCurrentOrderId={setCurrentOrderId} />
        )}

        {view === "seguimiento" && (
          <OrderTrackingView orderId={currentOrderId} setView={setView} />
        )}

        {view === "delivery" && (
          <DeliveryView usuario={usuario} addAlert={addAlert} />
        )}

        {view === "admin-dashboard" && usuario?.rol === "administrador" && (
          <AdminDashboardView setView={setView} addAlert={addAlert} />
        )}

        {view === "admin-productos" && usuario?.rol === "administrador" && (
          <AdminProductsView addAlert={addAlert} />
        )}

        {view === "admin-pedidos" && usuario?.rol === "administrador" && (
          <AdminOrdersView addAlert={addAlert} />
        )}

        {view === "admin-pos" && usuario?.rol === "administrador" && (
          <AdminPosView addAlert={addAlert} setView={setView} />
        )}

        {view === "admin-config" && usuario?.rol === "administrador" && (
          <AdminConfigView addAlert={addAlert} />
        )}

        {view === "login" && (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            addAlert={addAlert}
            setView={setView}
          />
        )}

        {view === "registro" && (
          <RegisterForm
            onLoginSuccess={handleLoginSuccess}
            addAlert={addAlert}
            setView={setView}
          />
        )}

        {view === "perfil" && token && (
          <ProfileView
            token={token}
            addAlert={addAlert}
            onUpdateUsuario={handleUpdateUsuario}
          />
        )}

        {view === "crear-admin" && token && usuario?.rol === "administrador" && (
          <AdminCreateUser
            token={token}
            addAlert={addAlert}
          />
        )}
      </main>

      {/* Footer elegante */}
      <footer className="py-4 text-center border-top border-glass text-muted small mt-auto">
        <div className="container">
          <p className="mb-0">© {new Date().getFullYear()} Restaurante Pablito. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
