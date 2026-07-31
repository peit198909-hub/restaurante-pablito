/**
 * Utilidad unificada para formateo de fechas y horas locales en Restaurante Pablito.
 * Normaliza cadenas de fecha SQLite sin indicador de zona horaria (UTC) agregando 'Z',
 * asegurando la conversión precisa a la hora y zona horaria local del cliente.
 */

export function parseFechaUTC(dateStr) {
  if (!dateStr) return null;
  let str = String(dateStr).trim();

  // Si la fecha de la base de datos viene como "YYYY-MM-DD HH:MM:SS" (sin T ni Z),
  // convertir a formato ISO UTC: "YYYY-MM-DDTHH:MM:SSZ"
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace(" ", "T") + "Z";
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    str = str + "Z";
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formatea una fecha a cadena con fecha y hora local del usuario.
 */
export function formatFecha(dateStr, options = {}) {
  const d = parseFechaUTC(dateStr);
  if (!d) return dateStr || "N/A";

  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  });
}

/**
 * Formatea una fecha a solo la fecha local (día/mes/año).
 */
export function formatSoloFecha(dateStr) {
  const d = parseFechaUTC(dateStr);
  if (!d) return dateStr || "N/A";

  return d.toLocaleDateString();
}
