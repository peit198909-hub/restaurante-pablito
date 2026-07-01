import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import AlertContainer from "./components/Alert";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import ProfileView from "./components/ProfileView";
import AdminCreateUser from "./components/AdminCreateUser";
import { UtensilsCrossed, ShieldAlert, User, ShieldCheck } from "lucide-react";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  // Inicializar estado con datos guardados en localStorage para persistencia
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [usuario, setUsuario] = useState(() => {
    const savedUser = localStorage.getItem("usuario");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [view, setView] = useState("inicio");
  const [alerts, setAlerts] = useState([]);

  // Funcion utilitaria para agregar alertas flotantes autodescartables
  const addAlert = (message, type = "info") => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    
    // Auto-eliminar despues de 5 segundos
    setTimeout(() => {
      removeAlert(id);
    }, 5000);
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Guardar sesion tras login/registro
  const handleLoginSuccess = (newToken, nuevoUsuario) => {
    setToken(newToken);
    setUsuario(nuevoUsuario);
    localStorage.setItem("token", newToken);
    localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
  };

  // Limpiar sesion
  const handleLogout = () => {
    setToken("");
    setUsuario(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    addAlert("Sesion cerrada con exito", "info");
    setView("inicio");
  };

  return (
    <>
      {/* Barra de navegacion adaptable */}
      <Navbar
        usuario={usuario}
        currentView={view}
        setView={setView}
        onLogout={handleLogout}
      />

      {/* Contenedor global de alertas flotantes */}
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <main className="main-content d-flex align-items-center">
        {view === "inicio" && (
          <div className="container text-center py-5 fade-in-up">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="glass-card p-5 mb-4">
                  <div className="mb-4">
                    <UtensilsCrossed size={64} className="text-gold" />
                  </div>
                  
                  {usuario ? (
                    <div>
                      <h1 className="hero-title text-gold mb-3">
                        ¡Bienvenido/a, {usuario.nombre} {usuario.apellido}!
                      </h1>
                      <p className="hero-subtitle mb-4">
                        Nos alegra tenerte de vuelta en el panel del Restaurante Pablito.
                      </p>
                      
                      <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                        <button
                          className="btn btn-gold d-flex align-items-center gap-2 py-3 px-4"
                          onClick={() => setView("perfil")}
                        >
                          <User size={20} />
                          Ver mi Perfil
                        </button>
                        
                        {usuario.rol === "administrador" && (
                          <button
                            className="btn btn-outline-gold d-flex align-items-center gap-2 py-3 px-4"
                            onClick={() => setView("crear-admin")}
                          >
                            <ShieldAlert size={20} />
                            Crear Administrador
                          </button>
                        )}
                      </div>

                      {/* Tarjeta informativa de rol */}
                      <div className="mt-5 p-3 border border-glass rounded bg-dark bg-opacity-50 max-w-sm mx-auto">
                        <div className="d-flex align-items-center justify-content-center gap-2 text-gold small">
                          {usuario.rol === "administrador" ? (
                            <>
                              <ShieldCheck size={18} />
                              <span className="fw-bold">Nivel de Acceso: Administrador del Sistema</span>
                            </>
                          ) : (
                            <>
                              <User size={18} />
                              <span className="fw-bold">Nivel de Acceso: Cliente Registrado</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h1 className="hero-title text-gold mb-3">Restaurante Pablito</h1>
                      <p className="hero-subtitle mb-4">
                        Bienvenido a nuestro sistema web de gestion de pedidos. Registrate como cliente
                        para poder acceder a las delicias de nuestra carta.
                      </p>
                      <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                        <button
                          className="btn btn-gold py-3 px-4"
                          onClick={() => setView("login")}
                        >
                          Iniciar Sesion
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

export default App;
