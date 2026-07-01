import React, { useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";

// Formulario de inicio de sesion con consumo de API
export default function LoginForm({ apiBaseUrl, onLoginSuccess, addAlert, setView }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!correo || !contrasena) {
      addAlert("Debe ingresar correo y contrasena", "danger");
      return;
    }

    setCargando(true);
    try {
      const respuesta = await fetch(`${apiBaseUrl}/api/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ correo, contrasena }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.message || "Error al iniciar sesion");
      }

      // Guardar token y datos del usuario en el estado global
      onLoginSuccess(datos.token, datos.usuario);
      addAlert("¡Inicio de sesion exitoso!", "success");
      setView("inicio");
    } catch (error) {
      addAlert(error.message, "danger");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-5 fade-in-up">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="glass-card p-4 p-sm-5">
            <div className="text-center mb-4">
              <h2 className="text-gold display-6 mb-2">Iniciar Sesion</h2>
              <p className="text-muted">Ingresa al Restaurante Pablito</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label text-light small fw-bold">Correo Electronico</label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <Mail size={18} className="text-gold" />
                  </span>
                  <input
                    type="email"
                    className="form-control glass-input border-start-0"
                    placeholder="carlos.mendoza@ejemplo.ec"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-light small fw-bold">Contrasena</label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <Lock size={18} className="text-gold" />
                  </span>
                  <input
                    type="password"
                    className="form-control glass-input border-start-0"
                    placeholder="••••••••"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                disabled={cargando}
              >
                {cargando ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <>
                    <LogIn size={20} />
                    Ingresar
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-muted small mb-0">
                ¿Aun no tienes una cuenta?{" "}
                <a
                  href="#"
                  className="text-gold fw-bold text-decoration-none"
                  onClick={(e) => {
                    e.preventDefault();
                    setView("registro");
                  }}
                >
                  Registrate aqui
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
