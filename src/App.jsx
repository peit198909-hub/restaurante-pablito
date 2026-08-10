import React, { useState, useCallback } from "react";
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
import DeliveryView from "./components/DeliveryView";
import { useOrderAbly } from "./hooks/useOrderAbly";
import { playNotificationSound } from "./utils/soundUtils";
import { UtensilsCrossed, ShieldAlert, User, ShieldCheck, ShoppingBag, Package, TrendingUp, Truck } from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
  const [notifications, setNotifications] = useState(() => {
    const savedUser = localStorage.getItem("usuario");
    const userId = savedUser ? JSON.parse(savedUser)?.id : "guest";
    const saved = localStorage.getItem(`notificaciones_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar notificaciones en localStorage asociadas al usuario actual
  useEffect(() => {
    if (usuario?.id) {
      localStorage.setItem(`notificaciones_${usuario.id}`, JSON.stringify(notifications));
    }
  }, [notifications, usuario]);

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

  // Manejadores de acciones para la campana de notificaciones
  const handleMarkAsRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleSelectNotification = (notif) => {
    if (notif.pedido_id) {
      setCurrentOrderId(notif.pedido_id);
    }
    if (usuario?.rol === "administrador") {
      setView("admin-pedidos");
    } else if (usuario?.rol === "repartidor") {
      setView("delivery");
    } else {
      setView(notif.pedido_id ? "seguimiento" : "mis-pedidos");
    }
  };

  // Manejador global de eventos Ably Realtime para mostrar notificaciones flotantes y guardarlas en la campana
  const handleOrderAblyUpdate = useCallback((eventData) => {
    const { tipo, pedido_id, estado } = eventData;
    const nombreEstado = FORMATO_ESTADO[estado] || estado;

    // Reproducir el tono suave y brillante de ElevenLabs
    playNotificationSound();

    let message = "";
    let alertType = "info";

    if (usuario?.rol === "repartidor") {
      if (tipo === "asignado") {
        message = `🛵 ¡Nuevo pedido #${pedido_id} asignado automáticamente a tu cuenta!`;
        alertType = "success";
      } else {
        message = `🔔 Entrega #${pedido_id} actualizada: ${nombreEstado}`;
      }
    } else if (usuario?.rol === "administrador") {
      if (tipo === "creado") {
        message = `🔔 ¡Nuevo pedido #${pedido_id} recibido!`;
        alertType = "success";
      } else {
        message = `🔔 Pedido #${pedido_id} actualizado a '${nombreEstado}'`;
      }
    } else {
      message = `🔔 Tu pedido #${pedido_id} ahora está en estado: ${nombreEstado}`;
    }

    // Mostrar alerta flotante temporal
    addAlert(message, alertType);

    // Agregar a la lista persistente de la campana de notificaciones
    setNotifications((prev) => [
      {
        id: Date.now() + Math.random(),
        message,
        timestamp: new Date().toISOString(),
        read: false,
        pedido_id,
        tipo,
        estado,
      },
      ...prev.slice(0, 49), // Limitar a las últimas 50 notificaciones
    ]);
  }, [usuario, addAlert]);

  // Activar la conexión Ably Realtime en tiempo real
  useOrderAbly(token, handleOrderAblyUpdate);

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
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAllNotifications}
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

        {view === "admin-config" && usuario?.rol === "administrador" && (
          <AdminConfigView addAlert={addAlert} />
        )}

        {view === "login" && (
          <LoginForm
            apiBaseUrl={apiBaseUrl}
            onLoginSuccess={handleLoginSuccess}
            addAlert={addAlert}
            setView={setView}
          />
        )}

        {view === "registro" && (
          <RegisterForm
            apiBaseUrl={apiBaseUrl}
            onLoginSuccess={handleLoginSuccess}
            addAlert={addAlert}
            setView={setView}
          />
        )}

        {view === "perfil" && token && (
          <ProfileView
            apiBaseUrl={apiBaseUrl}
            token={token}
            addAlert={addAlert}
            onUpdateUsuario={handleUpdateUsuario}
          />
        )}

        {view === "crear-admin" && token && usuario?.rol === "administrador" && (
          <AdminCreateUser
            apiBaseUrl={apiBaseUrl}
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
