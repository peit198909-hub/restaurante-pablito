import React, { useState } from "react";
import { User, LogOut, ShieldAlert, UtensilsCrossed } from "lucide-react";

// Barra de navegacion que adapta sus links segun sesion y rol, con toggle responsivo
export default function Navbar({ usuario, currentView, setView, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

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
          onClick={(e) => { e.preventDefault(); handleNavigation("inicio"); }}
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
          <ul className="navbar-nav ms-auto gap-2">
            <li className="nav-item">
              <a 
                className={`nav-link nav-link-custom ${currentView === "inicio" ? "active" : ""}`}
                href="#"
                onClick={(e) => { e.preventDefault(); handleNavigation("inicio"); }}
              >
                Inicio
              </a>
            </li>
            
            {usuario ? (
              <>
                {/* Opciones para usuarios autenticados */}
                <li className="nav-item">
                  <a 
                    className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${currentView === "perfil" ? "active" : ""}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleNavigation("perfil"); }}
                  >
                    <User size={16} />
                    Mi Perfil
                  </a>
                </li>
                
                {/* Opcion exclusiva para administradores */}
                {usuario.rol === "administrador" && (
                  <li className="nav-item">
                    <a 
                      className={`nav-link nav-link-custom d-flex align-items-center gap-1 ${currentView === "crear-admin" ? "active" : ""}`}
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleNavigation("crear-admin"); }}
                    >
                      <ShieldAlert size={16} />
                      Crear Admin
                    </a>
                  </li>
                )}
                
                <li className="nav-item ms-lg-2">
                  <button 
                    className="btn btn-outline-gold d-flex align-items-center gap-1 w-100 py-2"
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
                <li className="nav-item">
                  <a 
                    className={`nav-link nav-link-custom ${currentView === "login" ? "active" : ""}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleNavigation("login"); }}
                  >
                    Iniciar Sesion
                  </a>
                </li>
                <li className="nav-item ms-lg-2">
                  <a 
                    className="btn btn-gold w-100 py-2"
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleNavigation("registro"); }}
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
