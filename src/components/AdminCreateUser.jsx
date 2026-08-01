import React, { useState } from "react";
import { User, Mail, Lock, Phone, MapPin, ShieldAlert, UserCheck } from "lucide-react";

// Componente administrativo exclusivo para crear nuevas cuentas de administradores
export default function AdminCreateUser({ apiBaseUrl, token, addAlert }) {
  const [tipoRol, setTipoRol] = useState("repartidor");
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
      addAlert("Por favor complete los campos obligatorios (*)", "danger");
      return;
    }

    if (contrasena.length < 6) {
      addAlert("La contraseña debe tener al menos 6 caracteres", "danger");
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

      const endpoint = tipoRol === "repartidor"
        ? `${apiBaseUrl}/api/usuarios/repartidor/crear`
        : `${apiBaseUrl}/api/usuarios/admin/crear`;

      const respuesta = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.message || `Error al crear la cuenta de ${tipoRol}`);
      }

      addAlert(`¡Cuenta de ${tipoRol === "repartidor" ? "Repartidor" : "Administrador"} ${datos.usuario.nombre} creada correctamente!`, "success");
      
      // Limpiar formulario
      setNombre("");
      setApellido("");
      setCorreo("");
      setContrasena("");
      setTelefono("");
      setDireccion("");
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
              <ShieldAlert className="text-gold mb-2" size={48} />
              <h2 className="text-gold display-6 mb-2">Crear Cuenta de Personal</h2>
              <p className="text-muted">Crea cuentas de inicio de sesión para el equipo de trabajo</p>

              {/* Selector de Tipo de Cuenta */}
              <div className="btn-group w-100 mt-3 p-1 bg-light rounded border border-glass" role="group">
                <button
                  type="button"
                  className={`btn ${tipoRol === "repartidor" ? "btn-gold fw-bold" : "btn-link text-dark text-decoration-none"}`}
                  onClick={() => setTipoRol("repartidor")}
                >
                  🛵 Cuenta de Repartidor / Delivery
                </button>
                <button
                  type="button"
                  className={`btn ${tipoRol === "administrador" ? "btn-gold fw-bold" : "btn-link text-dark text-decoration-none"}`}
                  onClick={() => setTipoRol("administrador")}
                >
                  🛡️ Cuenta de Administrador
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-sm-6 mb-3">
                  <label className="form-label text-gold small fw-bold">Nombre *</label>
                  <div className="input-group">
                    <span className="input-group-text glass-input border-end-0">
                      <User size={18} className="text-gold" />
                    </span>
                    <input
                      type="text"
                      className="form-control glass-input border-start-0"
                      placeholder="Maria"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="col-sm-6 mb-3">
                  <label className="form-label text-gold small fw-bold">Apellido *</label>
                  <div className="input-group">
                    <span className="input-group-text glass-input border-end-0">
                      <User size={18} className="text-gold" />
                    </span>
                    <input
                      type="text"
                      className="form-control glass-input border-start-0"
                      placeholder="Guaman"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-gold small fw-bold">Correo Electronico *</label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <Mail size={18} className="text-gold" />
                  </span>
                  <input
                    type="email"
                    className="form-control glass-input border-start-0"
                    placeholder="maria.guaman@restaurante.ec"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-gold small fw-bold">Contrasena * (min. 6)</label>
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
                <label className="form-label text-gold small fw-bold">Telefono (opcional)</label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <Phone size={18} className="text-gold" />
                  </span>
                  <input
                    type="tel"
                    className="form-control glass-input border-start-0"
                    placeholder="ej: 0997654321"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-gold small fw-bold">Direccion (opcional)</label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <MapPin size={18} className="text-gold" />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input border-start-0"
                    placeholder="Calle Larga y Benigno Malo, Cuenca"
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
                    <UserCheck size={20} />
                    {tipoRol === "repartidor" ? "Crear Repartidor / Delivery" : "Crear Administrador"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
