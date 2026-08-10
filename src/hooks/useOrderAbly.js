import { useEffect, useRef } from "react";
import Pusher from "pusher-js";

/**
 * Custom Hook para conectarse a Pusher Channels y recibir notificaciones
 * instantáneas de pedidos y delivery en tiempo real.
 *
 * @param {string} token - Token JWT del usuario autenticado.
 * @param {function} onOrderUpdate - Callback que se invoca con los datos del evento recibido.
 */
export function useOrderAbly(token, onOrderUpdate) {
  const callbackRef = useRef(onOrderUpdate);

  useEffect(() => {
    callbackRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  useEffect(() => {
    const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
    const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || "us2";

    if (!PUSHER_KEY) {
      console.warn("⚠️ VITE_PUSHER_KEY no está definida. Las notificaciones en tiempo real no funcionarán.");
      return;
    }

    // Habilitar logging en desarrollo para debug
    Pusher.logToConsole = import.meta.env.DEV;

    let pusherClient = null;

    try {
      pusherClient = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
      });

      pusherClient.connection.bind("connected", () => {
        console.log("⚡ Pusher Channels: Conectado con éxito.");
      });

      pusherClient.connection.bind("error", (err) => {
        console.error("❌ Pusher: Error de conexión:", err);
      });

      pusherClient.connection.bind("disconnected", () => {
        console.warn("⚠️ Pusher: Desconectado del canal en tiempo real.");
      });

      const channel = pusherClient.subscribe("restaurante-pablito-pedidos");

      channel.bind("pusher:subscription_succeeded", () => {
        console.log("✅ Pusher: Suscripción exitosa al canal restaurante-pablito-pedidos");
      });

      channel.bind("pusher:subscription_error", (err) => {
        console.error("❌ Pusher: Error al suscribirse al canal:", err);
      });

      channel.bind("pedido_actualizado", (data) => {
        console.log("⚡ Pusher Evento Recibido (pedido_actualizado):", data);

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
          console.log("🔌 Pusher: Desconectado limpiamente.");
        } catch (e) {
          // Ignorar errores al desmontar
        }
      }
    };
  }, [token]);
}
