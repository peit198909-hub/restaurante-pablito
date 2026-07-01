import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, KeyRound, Save, Mail, Calendar } from "lucide-react";

// Vista y formulario de edicion de perfil
export default function ProfileView({ apiBaseUrl, token, addAlert }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [rol, setRol] = useState("");
  const [creadoEn, setCreadoEn] = useState("");
  
  // Estados para el cambio opcional de contrasena
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Obtener los datos del perfil al cargar el componente
  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const respuesta = await fetch(`${apiBaseUrl}/api/usuarios/perfil`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const datos = await respuesta.json();
        if (!respuesta.ok) {
          throw new Error(datos.message || "Error al obtener perfil");
        }

        const u = datos.usuario;
        setNombre(u.nombre || "");
        setApellido(u.apellido || "");
        setCorreo(u.correo || "");
        setTelefono(u.telefono || "");
        setDireccion(u.direccion || "");
        setRol(u.rol || "");
        setCreadoEn(u.creado_en || "");
      } catch (error) {
        addAlert(error.message, "danger");
      } finally {
        setCargando(false);
      }
    };

    obtenerPerfil();
  }, [apiBaseUrl, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre || !apellido) {
      addAlert("Nombre y apellido son requeridos", "danger");
      return;
    }

    if (cambiandoContrasena) {
      if (!contrasenaActual || !contrasenaNueva) {
        addAlert("Para cambiar la contrasena debe completar ambos campos", "danger");
        return;
      }
      if (contrasenaNueva.length < 6) {
        addAlert("La nueva contrasena debe tener al menos 6 caracteres", "danger");
        return;
      }
    }

    setGuardando(true);
    try {
      const payload = {
        nombre,
        apellido,
        telefono: telefono ? telefono : null,
        direccion: direccion ? direccion : null,
      };

      if (cambiandoContrasena) {
        payload.contrasenaActual = contrasenaActual;
        payload.contrasenaNueva = contrasenaNueva;
      }

      const respuesta = await fetch(`${apiBaseUrl}/api/usuarios/perfil`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const datos = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(datos.message || "Error al guardar los cambios");
      }

      addAlert("¡Perfil actualizado con exito!", "success");
      
      // Limpiar campos de contrasena
      setContrasenaActual("");
      setContrasenaNueva("");
      setCambiandoContrasena(false);
    } catch (error) {
      addAlert(error.message, "danger");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="container py-5 text-center fade-in-up">
        <div className="spinner-border text-gold" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Cargando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 fade-in-up">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="glass-card p-4 p-sm-5">
            <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-glass pb-3">
              <div>
                <h2 className="text-gold display-6 mb-1">Mi Perfil</h2>
                <p className="text-muted mb-0">Visualiza y actualiza tu informacion</p>
              </div>
              <div className="text-end">
                <span className="badge bg-warning text-dark px-3 py-2 fw-bold text-uppercase">
                  {rol}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-light small fw-bold">Nombre</label>
                  <div className="input-group">
                    <span className="input-group-text glass-input border-end-0">
                      <User size={18} className="text-gold" />
                    </span>
                    <input
                      type="text"
                      className="form-control glass-input border-start-0"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-light small fw-bold">Apellido</label>
                  <div className="input-group">
                    <span className="input-group-text glass-input border-end-0">
                      <User size={18} className="text-gold" />
                    </span>
                    <input
                      type="text"
                      className="form-control glass-input border-start-0"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-light small fw-bold">Correo Electronico (No editable)</label>
                  <div className="input-group">
                    <span className="input-group-text glass-input border-end-0 opacity-75">
                      <Mail size={18} className="text-gold" />
                    </span>
                    <input
                      type="email"
                      className="form-control glass-input border-start-0 opacity-75"
                      value={correo}
                      disabled
                    />
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label text-light small fw-bold">Telefono</label>
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
              </div>

              <div className="mb-4">
                <label className="form-label text-light small fw-bold">Direccion de Entrega</label>
                <div className="input-group">
                  <span className="input-group-text glass-input border-end-0">
                    <MapPin size={18} className="text-gold" />
                  </span>
                  <input
                    type="text"
                    className="form-control glass-input border-start-0"
                    placeholder="ej: Av. 9 de Octubre y Boyaca, Guayaquil"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4 p-3 border border-glass rounded bg-dark bg-opacity-25">
                <div className="form-check d-flex align-items-center mb-1">
                  <input
                    type="checkbox"
                    className="form-check-input glass-input"
                    id="chkChangePass"
                    checked={cambiandoContrasena}
                    onChange={(e) => setCambiandoContrasena(e.target.checked)}
                    style={{ margin: 0, padding: 0, width: "1.2em", height: "1.2em", cursor: "pointer" }}
                  />
                  <label className="form-check-label text-light fw-semibold ms-2" htmlFor="chkChangePass" style={{ cursor: "pointer" }}>
                    Deseo actualizar mi contrasena
                  </label>
                </div>

                {cambiandoContrasena && (
                  <div className="row fade-in-up mt-3">
                    <div className="col-md-6 mb-2">
                      <label className="form-label text-light small fw-bold">Contrasena Actual *</label>
                      <div className="input-group">
                        <span className="input-group-text glass-input border-end-0">
                          <KeyRound size={18} className="text-gold" />
                        </span>
                        <input
                          type="password"
                          className="form-control glass-input border-start-0"
                          placeholder="••••••••"
                          value={contrasenaActual}
                          onChange={(e) => setContrasenaActual(e.target.value)}
                          required={cambiandoContrasena}
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-2">
                      <label className="form-label text-light small fw-bold">Nueva Contrasena * (min. 6)</label>
                      <div className="input-group">
                        <span className="input-group-text glass-input border-end-0">
                          <KeyRound size={18} className="text-gold" />
                        </span>
                        <input
                          type="password"
                          className="form-control glass-input border-start-0"
                          placeholder="Nueva contrasena"
                          value={contrasenaNueva}
                          onChange={(e) => setContrasenaNueva(e.target.value)}
                          required={cambiandoContrasena}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="text-muted small d-flex align-items-center gap-1">
                  <Calendar size={14} />
                  <span>Miembro desde: {creadoEn ? new Date(creadoEn).toLocaleDateString() : "N/D"}</span>
                </div>
                
                <button
                  type="submit"
                  className="btn btn-gold px-4 py-3 d-flex align-items-center gap-2"
                  disabled={guardando}
                >
                  {guardando ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
