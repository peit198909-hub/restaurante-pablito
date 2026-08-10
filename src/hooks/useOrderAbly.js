import { useEffect, useRef } from "react";
import Pusher from "pusher-js";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || "us2";

/**
 * Custom Hook para conectarse a Pusher Channels y recibir notificaciones
 * instantáneas de pedidos y delivery en tiempo real.
 *
 * @param {string} token - Token JWT del usuario autenticado (se usa para re-conectar cuando cambia sesión).
 * @param {function} onOrderUpdate - Callback que se invoca con los datos del evento recibido.
 */
export function useOrderAbly(token, onOrderUpdate) {
  const callbackRef = useRef(onOrderUpdate);

  useEffect(() => {
    callbackRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  useEffect(() => {
    if (!PUSHER_KEY) {
      console.warn("⚠️ VITE_PUSHER_KEY no está definida. Las notificaciones en tiempo real no funcionarán.");
      return;
    }

    // Habilitar logging solo en desarrollo
    if (import.meta.env.DEV) {
      Pusher.logToConsole = true;
    }

    let pusherClient = null;

    try {
      pusherClient = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
      });

      const channel = pusherClient.subscribe("restaurante-pablito-pedidos");

      pusherClient.connection.bind("connected", () => {
        console.log("⚡ Pusher Channels: Conectado con éxito al canal de notificaciones en vivo.");
      });

      pusherClient.connection.bind("error", (err) => {
        console.error("❌ Pusher Channels: Error de conexión:", err);
      });

      channel.bind("pedido_actualizado", (data) => {
        console.log("⚡ Pusher Evento Recibido:", data);

        // Disparar eventos de ventana para actualizar vistas (Delivery, Admin, Cliente) en tiempo real
        window.dispatchEvent(new CustomEvent("order_status_update", { detail: data }));
        window.dispatchEvent(new CustomEvent("sse_order_update", { detail: data }));

        if (callbackRef.current) {
          callbackRef.current(data);
        }
      });
    } catch (err) {
      console.error("❌ Error conectando a Pusher Channels:", err.message);
    }

    return () => {
      if (pusherClient) {
        try {
          pusherClient.unsubscribe("restaurante-pablito-pedidos");
          pusherClient.disconnect();
        } catch (e) {
          // Ignorar errores al desmontar
        }
      }
    };
  }, [token]);
}
