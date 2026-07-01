import React, { useState } from "react";
import { User, Mail, Lock, Phone, MapPin, UserPlus } from "lucide-react";

// Formulario de registro para nuevos clientes
export default function RegisterForm({ apiBaseUrl, onLoginSuccess, addAlert, setView }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre || !apellido || !correo || !contrasena) {
      addAlert("Por favor, complete todos los campos obligatorios (*)", "danger");
      return;
    }

    if (contrasena.length < 6) {
      addAlert("La contrasena debe tener al menos 6 caracteres", "danger");
      return;
    }

    setCargando(true);
    try {
      const payload = {
        nombre,
        apellido,
        correo,
        contrasena,
        telefono: telefono ? telefono : undefined,
        direccion: direccion ? direccion : undefined,
      };

      const respuesta = await fetch(`${apiBaseUrl}/api/usuarios/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.message || "Error al registrarse");
      }

      // Loguear automaticamente al usuario despues de registrarse
      onLoginSuccess(datos.token, datos.usuario);
      addAlert("¡Registro completado con exito!", "success");
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
        <div className="col-md-8 col-lg-6">
          <div className="glass-card p-4 p-sm-5">
            <div className="text-center mb-4">
              <h2 className="text-gold display-6 mb-2">Crear Cuenta</h2>
              <p className="text-muted">Unete al Restaurante Pablito para realizar tus pedidos</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-sm-6 mb-3">
                  <label className="form-label text-light small fw-bold">Nombre *</label>
                  <div className="input-group">
                    <span className="input-group-text glass-input border-end-0">
                      <User size={18} className="text-gold" />
                    </span>
                    <input
                      type="text"
                      className="form-control glass-input border-start-0"
                      placeholder="Carlos"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="col-sm-6 mb-3">
                  <label className="form-label text-light small fw-bold">Apellido *</label>
                  <div className="input-group">
                    <span className="input-group-text glass-input border-end-0">
                      <User size={18} className="text-gold" />
                    </span>
                    <input
                      type="text"
                      className="form-control glass-input border-start-0"
                      placeholder="Mendoza"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-light small fw-bold">Correo Electronico *</label>
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

              <div className="mb-3">
                <label className="form-label text-light small fw-bold">Contrasena * (min. 6 caracteres)</label>
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

              <div className="mb-3">
                <label className="form-label text-light small fw-bold">Telefono (opcional)</label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <Phone size={18} className="text-gold" />
                  </span>
                  <input
                    type="tel"
                    className="form-control glass-input border-start-0"
                    placeholder="ej: 0991234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-light small fw-bold">Direccion (opcional)</label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <MapPin size={18} className="text-gold" />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input border-start-0"
                    placeholder="Av. Amazonas N24-12 y Colon, Quito"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
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
                    <UserPlus size={20} />
                    Registrarse
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-muted small mb-0">
                ¿Ya tienes una cuenta?{" "}
                <a
                  href="#"
                  className="text-gold fw-bold text-decoration-none"
                  onClick={(e) => {
                    e.preventDefault();
                    setView("login");
                  }}
                >
                  Inicia sesion aqui
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
