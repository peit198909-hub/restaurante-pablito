import React, { useState } from "react";
import { createPortal } from "react-dom";
import { User, LogOut, ShieldAlert, Utensils, ShoppingCart, Package, Settings, ClipboardList, Truck, Bell, Check, Trash2, ChevronDown, TrendingUp } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatTiempoRelativo } from "../utils/dateUtils";

export default function Navbar({
  usuario,
  currentView,
  setView,
  onLogout,
  notifications = [],
  onMarkAllAsRead,
  onClearNotifications,
  onSelectNotification,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const { totalItems } = useCart();

  const unreadCount = notifications.filter((n) => !n.leido).length;

  const handleNavigation = (targetView) => {
    setView(targetView);
    setIsOpen(false);
    setShowNotifDropdown(false);
    setShowAdminDropdown(false);
  };

  return createPortal(
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, width: "100%", zIndex: 1030 }}>
      <nav className="navbar navbar-expand-xl navbar-dark navbar-custom py-2 shadow-sm">
        <div className="container">
          <a
            className="navbar-brand navbar-brand-custom d-flex align-items-center gap-2"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleNavigation("inicio");
            }}
          >
            <img
              src="/restaurante-pablito-si.png"
              alt="Restaurante Pablito Logo"
              className="rounded-circle border border-gold shadow-sm"
              style={{ width: "36px", height: "36px", objectFit: "cover" }}
            />
            <span className="fw-bold tracking-wide">Restaurante Pablito</span>
          </a>
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} id="navbarNav">
            <ul className="navbar-nav ms-auto gap-1 align-items-xl-center">
              {/* Inicio */}
              <li className="nav-item">
                <a
                  className={`nav-link nav-link-custom ${currentView === "inicio" ? "active" : ""}`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("inicio");
                  }}
                >
                  Inicio
                </a>
              </li>

              {/* Menú (Público / Siempre visible) */}
              <li className="nav-item">
                <a
                  className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${currentView === "menu" ? "active" : ""}`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("menu");
                  }}
                >
                  <Utensils size={16} />
                  Menú
                </a>
              </li>

              {/* Carrito de Compras */}
              <li className="nav-item">
                <a
                  className={`nav-link nav-link-custom d-flex align-items-center gap-1 position-relative ${
                    currentView === "carrito" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation("carrito");
                  }}
                >
                  <ShoppingCart size={16} />
                  Carrito
                  {totalItems > 0 && (
                    <span className="badge bg-gold text-dark rounded-circle ms-1 px-2 py-1 fs-6">
                      {totalItems}
                    </span>
                  )}
                </a>
              </li>

              {usuario ? (
                <>
                  {/* Mis Pedidos (para clientes autenticados) */}
                  {usuario.rol === "cliente" && (
                    <li className="nav-item">
                      <a
                        className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${
                          currentView === "mis-pedidos" || currentView === "seguimiento" ? "active" : ""
                        }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation("mis-pedidos");
                        }}
                      >
                        <Package size={16} />
                        Mis Pedidos
                      </a>
                    </li>
                  )}

                  {/* Mis Entregas (para repartidores autenticados) */}
                  {usuario.rol === "repartidor" && (
                    <li className="nav-item">
                      <a
                        className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${
                          currentView === "delivery" ? "active" : ""
                        }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation("delivery");
                        }}
                      >
                        <Truck size={16} />
                        Mis Entregas
                      </a>
                    </li>
                  )}

                  {/* Opciones exclusivas para Administradores */}
                  {usuario.rol === "administrador" && (
                    <li className="nav-item dropdown position-relative">
                      <button
                        type="button"
                        className={`nav-link nav-link-custom btn btn-link p-2 border-0 d-flex align-items-center gap-1 text-gold fw-bold text-nowrap ${
                          currentView.startsWith("admin") || currentView === "crear-admin" ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowAdminDropdown(!showAdminDropdown);
                        }}
                      >
                        <ShieldAlert size={16} />
                        Panel Admin
                        <ChevronDown size={14} />
                      </button>

                      {showAdminDropdown && (
                        <div
                          className="dropdown-menu show p-2 shadow-lg border-glass rounded-3 position-absolute start-0 mt-2"
                          style={{ minWidth: "220px", backgroundColor: "#2a221f", zIndex: 1090 }}
                        >
                          <a
                            className={`dropdown-item nav-link-custom d-flex align-items-center gap-2 rounded-2 ${
                              currentView === "admin-dashboard" || currentView === "inicio" ? "active" : ""
                            }`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigation("admin-dashboard");
                            }}
                          >
                            <TrendingUp size={16} className="text-gold" />
                            Dashboard Analítico
                          </a>
                          <a
                            className={`dropdown-item nav-link-custom d-flex align-items-center gap-2 rounded-2 ${
                              currentView === "admin-pos" ? "active" : ""
                            }`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigation("admin-pos");
                            }}
                          >
                            <ShoppingCart size={16} className="text-gold" />
                            Venta Directa (POS)
                          </a>
                          <a
                            className={`dropdown-item nav-link-custom d-flex align-items-center gap-2 rounded-2 ${
                              currentView === "admin-productos" ? "active" : ""
                            }`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigation("admin-productos");
                            }}
                          >
                            <Settings size={16} className="text-gold" />
                            Gestión Menú
                          </a>
                          <a
                            className={`dropdown-item nav-link-custom d-flex align-items-center gap-2 rounded-2 ${
                              currentView === "admin-pedidos" ? "active" : ""
                            }`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigation("admin-pedidos");
                            }}
                          >
                            <ClipboardList size={16} className="text-gold" />
                            Gestión Pedidos
                          </a>
                          <a
                            className={`dropdown-item nav-link-custom d-flex align-items-center gap-2 rounded-2 ${
                              currentView === "admin-config" ? "active" : ""
                            }`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigation("admin-config");
                            }}
                          >
                            <Settings size={16} className="text-gold" />
                            Config. Negocio
                          </a>
                          <a
                            className={`dropdown-item nav-link-custom d-flex align-items-center gap-2 rounded-2 ${
                              currentView === "crear-admin" ? "active" : ""
                            }`}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavigation("crear-admin");
                            }}
                          >
                            <ShieldAlert size={16} className="text-gold" />
                            Crear Admin
                          </a>
                        </div>
                      )}
                    </li>
                  )}

                {/* Campanita de Notificaciones */}
                <li className="nav-item dropdown position-relative mx-lg-1">
                  <button
                    type="button"
                    className="nav-link nav-link-custom btn btn-link p-2 border-0 d-flex align-items-center position-relative text-gold"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowNotifDropdown(!showNotifDropdown);
                    }}
                    title="Notificaciones en tiempo real"
                    style={{ cursor: "pointer" }}
                  >
                    <Bell size={18} className={unreadCount > 0 ? "text-gold" : "text-light"} />
                    {unreadCount > 0 && (
                      <span
                        className="badge bg-danger rounded-circle position-absolute"
                        style={{
                          top: "2px",
                          right: "2px",
                          fontSize: "0.6rem",
                          padding: "0.25em 0.4em",
                          border: "1.5px solid #2a221f",
                        }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown flotante de Notificaciones */}
                  {showNotifDropdown && (
                    <div
                      className="dropdown-menu show p-0 shadow-lg border-glass rounded-3 overflow-hidden position-absolute end-0 mt-2"
                      style={{
                        width: "340px",
                        maxWidth: "92vw",
                        backgroundColor: "#ffffff",
                        zIndex: 1090,
                      }}
                    >
                      <div className="p-3 bg-light border-bottom border-glass d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <Bell size={18} className="text-gold" />
                          <span className="fw-bold text-dark fs-6">Notificaciones</span>
                          {unreadCount > 0 && (
                            <span className="badge bg-gold text-dark rounded-pill extra-small fw-bold">
                              {unreadCount} nuevas
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          {notifications.length > 0 && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm text-gold p-1 extra-small fw-bold border-0 d-flex align-items-center gap-1"
                                onClick={onMarkAllAsRead}
                                title="Marcar todas como leídas"
                              >
                                <Check size={14} /> Leídas
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm text-muted p-1 extra-small border-0 d-flex align-items-center"
                                onClick={onClearNotifications}
                                title="Limpiar historial"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="btn-close ms-1"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => setShowNotifDropdown(false)}
                          ></button>
                        </div>
                      </div>

                      <div className="notif-list" style={{ maxHeight: "360px", overflowY: "auto" }}>
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-muted">
                            <Bell size={32} className="text-gold opacity-50 mb-2" />
                            <p className="extra-small mb-0">No tienes notificaciones por el momento.</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 border-bottom border-light transition-all ${
                                !n.leido ? "bg-warning-subtle bg-opacity-25" : "bg-white"
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                if (onSelectNotification) onSelectNotification(n);
                                setShowNotifDropdown(false);
                              }}
                            >
                              <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
                                <span className={`badge ${n.badgeColor || "bg-gold text-dark"} extra-small fw-bold`}>
                                  {n.titulo}
                                </span>
                                <span className="extra-small text-muted" style={{ fontSize: "0.7rem" }}>
                                  {formatTiempoRelativo(n.timestamp)}
                                </span>
                              </div>
                              <p className="extra-small text-dark mb-0 fw-medium" style={{ lineHeight: "1.35" }}>
                                {n.mensaje}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </li>

                {/* Perfil */}
                <li className="nav-item">
                  <a
                    className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${
                      currentView === "perfil" ? "active" : ""
                    }`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation("perfil");
                    }}
                  >
                    <User size={16} />
                    Mi Perfil
                  </a>
                </li>

                {/* Salir */}
                <li className="nav-item ms-lg-2">
                  <button
                    className="btn btn-outline-gold d-flex align-items-center gap-1 w-100 py-1 px-3"
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut size={16} />
                    Salir
                  </button>
                </li>
              </>
            ) : (
              <>
                {/* Opciones para usuarios invitados */}
                <li className="nav-item ms-lg-2">
                  <a
                    className={`nav-link nav-link-custom ${currentView === "login" ? "active" : ""}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation("login");
                    }}
                  >
                    Iniciar Sesión
                  </a>
                </li>
                <li className="nav-item ms-lg-2">
                  <a
                    className="btn btn-gold w-100 py-1 px-3"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation("registro");
                    }}
                  >
                    Registrarse
                  </a>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>

    {/* Sub-Barra de Navegación Rápida para Administradores */}
    {usuario?.rol === "administrador" && (
      <div className="admin-subnav-bar py-2">
        <div className="container d-flex align-items-center justify-content-start justify-content-xl-center gap-2 overflow-auto text-nowrap">
          <button
            className={`admin-subnav-pill ${currentView === "admin-dashboard" || currentView === "inicio" ? "active" : ""}`}
            onClick={() => handleNavigation("admin-dashboard")}
          >
            <TrendingUp size={14} /> Dashboard Analítico
          </button>
          <button
            className={`admin-subnav-pill ${currentView === "admin-pos" ? "active" : ""}`}
            onClick={() => handleNavigation("admin-pos")}
          >
            <ShoppingCart size={14} /> Venta Directa (POS)
          </button>
          <button
            className={`admin-subnav-pill ${currentView === "admin-productos" ? "active" : ""}`}
            onClick={() => handleNavigation("admin-productos")}
          >
            <Settings size={14} /> Gestión Menú
          </button>
          <button
            className={`admin-subnav-pill ${currentView === "admin-pedidos" ? "active" : ""}`}
            onClick={() => handleNavigation("admin-pedidos")}
          >
            <ClipboardList size={14} /> Gestión Pedidos
          </button>
          <button
            className={`admin-subnav-pill ${currentView === "admin-config" ? "active" : ""}`}
            onClick={() => handleNavigation("admin-config")}
          >
            <Settings size={14} /> Config. Negocio
          </button>
          <button
            className={`admin-subnav-pill ${currentView === "crear-admin" ? "active" : ""}`}
            onClick={() => handleNavigation("crear-admin")}
          >
            <ShieldAlert size={14} /> Crear Admin
          </button>
        </div>
      </div>
    )}
  </header>,
  document.body
);
}
