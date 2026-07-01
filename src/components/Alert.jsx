import React from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

// Contenedor flotante para mostrar notificaciones del sistema
export default function AlertContainer({ alerts, removeAlert }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="custom-alert-container">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`custom-alert custom-alert-${alert.type || "info"}`}
          role="alert"
        >
          {/* Iconos dinamicos de lucide-react */}
          {alert.type === "success" && <CheckCircle2 className="text-success" size={20} />}
          {alert.type === "danger" && <XCircle className="text-danger" size={20} />}
          {alert.type === "info" && <Info className="text-info" size={20} />}
          
          <div className="flex-grow-1 pe-2">{alert.message}</div>
          
          <button
            type="button"
            className="btn-close btn-close-white ms-auto"
            style={{ width: "8px", height: "8px", padding: "0" }}
            onClick={() => removeAlert(alert.id)}
            aria-label="Cerrar"
          ></button>
        </div>
      ))}
    </div>
  );
}
