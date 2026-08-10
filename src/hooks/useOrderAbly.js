import { useEffect, useRef } from "react";
import Ably from "ably";

const ABLY_KEY = import.meta.env.VITE_ABLY_API_KEY;

/**
 * Custom Hook para conectarse a Ably Realtime y recibir notificaciones instantáneas de pedidos y delivery.
 * @param {string} token - Token JWT del usuario o repartidor autenticado.
 * @param {function} onOrderUpdate - Callback para alertas flotantes y notificaciones sonoras.
 */
export function useOrderAbly(token, onOrderUpdate) {
  const callbackRef = useRef(onOrderUpdate);

  useEffect(() => {
    callbackRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  useEffect(() => {
    if (!ABLY_KEY) {
      console.warn("⚠️ Advertencia: VITE_ABLY_API_KEY no está definida en las variables de entorno del frontend.");
      return;
    }

    let ablyClient = null;

    try {
      ablyClient = new Ably.Realtime({ key: ABLY_KEY });
      const channel = ablyClient.channels.get("restaurante-pablito-pedidos");

      ablyClient.connection.on("connected", () => {
        console.log("⚡ Ably Realtime: Conectado con éxito al canal de notificaciones en vivo.");
      });

      channel.subscribe("pedido_actualizado", (message) => {
        const data = message.data || {};
        console.log("⚡ Ably Realtime Evento Recibido:", data);

        // Disparar eventos de ventana para actualizar vistas (Delivery, Admin, Cliente) en tiempo real
        window.dispatchEvent(new CustomEvent("order_status_update", { detail: data }));
        window.dispatchEvent(new CustomEvent("sse_order_update", { detail: data }));

        if (callbackRef.current) {
          callbackRef.current(data);
        }
      });
    } catch (err) {
      console.error("❌ Error conectando a Ably Realtime:", err.message);
    }

    return () => {
      if (ablyClient) {
        try {
          ablyClient.close();
        } catch (e) {
          // Ignorar advertencia al cerrar conexión en desmontaje
        }
      }
    };
  }, []);
}
