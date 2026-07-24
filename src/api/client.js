const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Cliente HTTP unificado para consumir la API de Restaurante Pablito
 * @param {string} endpoint - Ruta del endpoint (ej. '/api/productos')
 * @param {object} options - Opciones de fetch (method, body, headers, token)
 */
export async function apiFetch(endpoint, options = {}) {
  const { token, body, headers = {}, ...customConfig } = options;

  const config = {
    method: options.method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...customConfig,
  };

  // Obtener token guardado si no se envio explicitamente
  const activeToken = token || localStorage.getItem("token");
  if (activeToken) {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }

  if (body) {
    config.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}
