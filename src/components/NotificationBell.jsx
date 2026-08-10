import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, Package, CheckCircle2, Clock, Truck, XCircle, AlertCircle } from "lucide-react";

export default function NotificationBell({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Cerrar el dropdown al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusIcon = (tipo, estado) => {
    switch (estado || tipo) {
      case "pendiente":
        return <Clock size={16} className="text-warning me-2 flex-shrink-0" />;
      case "confirmado":
      case "en_preparacion":
        return <Package size={16} className="text-info me-2 flex-shrink-0" />;
      case "listo":
      case "en_camino":
        return <Truck size={16} className="text-primary me-2 flex-shrink-0" />;
      case "entregado":
        return <CheckCircle2 size={16} className="text-success me-2 flex-shrink-0" />;
      case "cancelado":
        return <XCircle size={16} className="text-danger me-2 flex-shrink-0" />;
      default:
        return <AlertCircle size={16} className="text-gold me-2 flex-shrink-0" />;
    }
  };

  const formatFecha = (fechaIso) => {
    if (!fechaIso) return "";
    const date = new Date(fechaIso);
    const ahora = new Date();
    const diffMs = ahora - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Ahora mismo";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHoras = Math.floor(diffMins / 60);
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    return date.toLocaleDateString("es-EC", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="position-relative d-inline-block" ref={dropdownRef}>
      {/* Botón Campana */}
      <button
        type="button"
        className="btn btn-link text-light position-relative p-2 d-flex align-items-center justify-content-center border-0 text-decoration-none shadow-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
        title="Notificaciones en vivo"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-gold" : "text-light opacity-75"} />
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm border border-dark"
            style={{ fontSize: "0.65rem", padding: "0.25em 0.45em" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Menú Desplegable de Notificaciones */}
      {isOpen && (
        <div
          className="dropdown-menu dropdown-menu-end show shadow-lg border border-gold border-opacity-25 rounded-3 bg-dark text-light p-0"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: "340px",
            maxHeight: "450px",
            zIndex: 1050,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(18, 18, 18, 0.95)",
          }}
        >
          {/* Cabecera */}
          <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary border-opacity-25 bg-secondary bg-opacity-10">
            <div className="d-flex align-items-center gap-2">
              <Bell size={16} className="text-gold" />
              <span className="fw-bold fs-6">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="badge bg-gold text-dark rounded-pill px-2 py-1 text-xs">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="d-flex align-items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn btn-sm text-gold hover-gold p-1 border-0"
                  onClick={onMarkAllAsRead}
                  title="Marcar todas como leídas"
                >
                  <Check size={16} />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm text-danger hover-danger p-1 border-0 ms-1"
                  onClick={onClearAll}
                  title="Limpiar todas"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div
            style={{
              maxHeight: "360px",
              overflowY: "auto",
            }}
            className="custom-scrollbar"
          >
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted">
                <Bell size={32} className="opacity-25 mb-2 text-gold d-block mx-auto" />
                <p className="small mb-0">No tienes notificaciones pendientes</p>
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Las actualizaciones de pedidos en tiempo real aparecerán aquí.
                </small>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`list-group-item list-group-item-action p-3 text-light bg-transparent border-bottom border-secondary border-opacity-10 transition-colors ${
                      !notif.read ? "bg-gold bg-opacity-10 fw-semibold" : "opacity-75"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      if (!notif.read && onMarkAsRead) {
                        onMarkAsRead(notif.id);
                      }
                      if (onSelectNotification) {
                        onSelectNotification(notif);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <div className="d-flex align-items-start gap-2">
                        {getStatusIcon(notif.tipo, notif.estado)}
                        <div>
                          <p className="mb-1 text-sm lh-sm" style={{ fontSize: "0.85rem" }}>
                            {notif.message}
                          </p>
                          <span
                            className="text-gold opacity-75 d-block"
                            style={{ fontSize: "0.72rem" }}
                          >
                            {formatFecha(notif.timestamp)}
                          </span>
                        </div>
                      </div>
                      {!notif.read && (
                        <span
                          className="bg-gold rounded-circle d-inline-block flex-shrink-0 mt-1"
                          style={{ width: "8px", height: "8px" }}
                          title="No leída"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
