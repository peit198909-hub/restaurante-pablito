import { useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Custom Hook para conectarse al canal SSE (Server-Sent Events) de pedidos en tiempo real.
 * @param {string} token - Token JWT del usuario o admin autenticado.
 * @param {function} onOrderUpdate - Callback ejecutado al recibir una actualizacion de pedido.
 */
export function useOrderSSE(token, onOrderUpdate) {
  const callbackRef = useRef(onOrderUpdate);

  useEffect(() => {
    callbackRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  useEffect(() => {
    if (!token) return;

    const streamUrl = `${API_URL}/api/pedidos/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener("conexion", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("⚡ SSE Conectado con éxito:", data);
      } catch (err) {
        console.error("Error parseando handshake SSE:", err);
      }
    });

    eventSource.addEventListener("pedido_actualizado", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("⚡ SSE Pedido Actualizado:", data);

        // Disparar evento personalizado del navegador para sincronizacion global
        window.dispatchEvent(new CustomEvent("order_status_update", { detail: data }));

        if (callbackRef.current) {
          callbackRef.current(data);
        }
      } catch (err) {
        console.error("Error parseando evento de pedido SSE:", err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("⚠️ Conexión SSE interrumpida o reconectando...", err);
    };

    return () => {
      console.log("Cerrando conexión SSE...");
      eventSource.close();
    };
  }, [token]);
}
