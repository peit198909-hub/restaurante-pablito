/**
 * Reproduce el tono de notificación suave y brillante de ElevenLabs
 * cada vez que se crea un pedido o cambia el estado en tiempo real.
 */
export function playNotificationSound() {
  try {
    const audioPath = "/notificacion/ElevenLabs_Aviso_de_nuevo_mensaje_con_un_tono_suave_y_brillante.mp3";
    const audio = new Audio(audioPath);
    audio.volume = 0.85;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("El navegador requiere interacción previa del usuario para reproducir audio:", error);
      });
    }
  } catch (err) {
    console.error("Error al intentar reproducir el audio de notificación:", err);
  }
}
