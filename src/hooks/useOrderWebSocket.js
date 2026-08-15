import { useEffect, useRef } from "react";
import { API_URL } from "../api/client";

/**
 * Obtiene la URL completa del endpoint WebSocket.
 * Si VITE_WS_URL está definida, la usa directamente.
 * De lo contrario, convierte VITE_API_URL (http -> ws, https -> wss) añadiendo el path /ws.
 */
export function getWebSocketUrl() {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl) return envWsUrl;

  const baseUrl = API_URL || "http://localhost:3000";
  const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws";
  const host = baseUrl.replace(/^https?:\/\//, "");

  return `${wsProtocol}://${host}/ws`;
}

/**
 * Custom Hook para conectarse al servidor WebSocket nativo de Restaurante Pablito
 * y recibir notificaciones instantáneas de pedidos y delivery en tiempo real.
 *
 * @param {string} token - Token JWT del usuario autenticado.
 * @param {function} onOrderUpdate - Callback invocado con los datos del evento recibido.
 */
export function useOrderWebSocket(token, onOrderUpdate) {
  const callbackRef = useRef(onOrderUpdate);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isUnmountedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    callbackRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  useEffect(() => {
    isUnmountedRef.current = false;
    const wsUrl = getWebSocketUrl();

    function connect() {
      if (isUnmountedRef.current) return;

      console.log(`🔌 Conectando a WebSocket en: ${wsUrl}`);
      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          console.log("⚡ WebSocket: Conectado con éxito.");
          reconnectAttemptsRef.current = 0;
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);

            if (parsed.event === "pedido_actualizado" && parsed.data) {
              console.log("⚡ WebSocket Evento Recibido (pedido_actualizado):", parsed.data);

              // Disparar eventos globales para sincronización de vistas
              window.dispatchEvent(new CustomEvent("order_status_update", { detail: parsed.data }));
              window.dispatchEvent(new CustomEvent("sse_order_update", { detail: parsed.data }));

              if (callbackRef.current) {
                callbackRef.current(parsed.data);
              }
            } else if (parsed.event === "conexion") {
              console.log("⚡ WebSocket Handshake:", parsed.data?.message);
            }
          } catch (err) {
            console.error("❌ Error parseando mensaje de WebSocket:", err);
          }
        };

        socket.onerror = (err) => {
          console.warn("⚠️ WebSocket: Error en la conexión:", err);
        };

        socket.onclose = (event) => {
          if (isUnmountedRef.current) return;

          console.warn(`⚠️ WebSocket: Conexión cerrada (código ${event.code}). Reintentando...`);
          
          // Cálculo de reconexión con retardo incremental (2s, 4s, 8s... máx 30s)
          const delay = Math.min(30000, Math.pow(2, reconnectAttemptsRef.current) * 2000);
          reconnectAttemptsRef.current++;

          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, delay);
        };
      } catch (err) {
        console.error("❌ Error inicializando WebSocket:", err.message);
      }
    }

    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        try {
          socketRef.current.close();
          console.log("🔌 WebSocket: Desconectado limpiamente.");
        } catch (e) {
          // Ignorar errores al cerrar
        }
      }
    };
  }, [token]);
}
