import React, { useState } from "react";
import { User, LogOut, ShieldAlert, UtensilsCrossed, Utensils, ShoppingCart, Package, Settings, ClipboardList } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function Navbar({ usuario, currentView, setView, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems } = useCart();

  const handleNavigation = (targetView) => {
    setView(targetView);
    setIsOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom py-3">
      <div className="container">
        <a
          className="navbar-brand navbar-brand-custom d-flex align-items-center gap-2"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleNavigation("inicio");
          }}
        >
          <UtensilsCrossed size={24} />
          <span>Restaurante Pablito</span>
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
          <ul className="navbar-nav ms-auto gap-1 align-items-lg-center">
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

                {/* Opciones exclusivas para Administradores */}
                {usuario.rol === "administrador" && (
                  <>
                    <li className="nav-item">
                      <a
                        className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${
                          currentView === "admin-productos" ? "active" : ""
                        }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation("admin-productos");
                        }}
                      >
                        <Settings size={16} />
                        Gestión Menú
                      </a>
                    </li>

                    <li className="nav-item">
                      <a
                        className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${
                          currentView === "admin-pedidos" ? "active" : ""
                        }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation("admin-pedidos");
                        }}
                      >
                        <ClipboardList size={16} />
                        Gestión Pedidos
                      </a>
                    </li>

                    <li className="nav-item">
                      <a
                        className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${
                          currentView === "crear-admin" ? "active" : ""
                        }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigation("crear-admin");
                        }}
                      >
                        <ShieldAlert size={16} />
                        Crear Admin
                      </a>
                    </li>
                  </>
                )}

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
  );
}
