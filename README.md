# Restaurante Pablito - Aplicación Web Frontend

Interfaz web moderna, dinámica y responsiva para la plataforma del **Restaurante Pablito**. Diseñada para ofrecer una experiencia de usuario interactiva en la navegación del menú, geolocalización de entregas por mapa, seguimiento de pedidos en tiempo real y administración del restaurante.

---

## 🛠️ Tecnologías Utilizadas

- **Framework Frontend**: [React](https://react.dev/) + [Vite](https://vitejs.dev/) (Build tool ultrarrápido).
- **Estilos y UI**: Bootstrap 5, Vanilla CSS personalizado (Diseño Glassmorphism, Dark Mode y paleta dorada premium).
- **Mapas y Geolocalización**: [Leaflet](https://leafletjs.com/) + OpenStreetMap (Búsqueda de direcciones, geocodificación inversa y GPS).
- **Iconografía**: [Lucide React](https://lucide.dev/).
- **Notificaciones**: Audio en tiempo real y componentes de alerta flotantes.
- **Comunicación en Tiempo Real**: Server-Sent Events (SSE) para el estado de los pedidos.

---

## 🚀 Configuración e Instalación Local

### 1. Clonar e Instalar Dependencias

```bash
bun install
# o con npm:
npm install
```

### 2. Configuración de Variables de Entorno

Copia el archivo `.env.example` para generar tu archivo de configuración `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` para especificar la URL base de la API backend:

```env
VITE_API_URL=http://localhost:3000
```
*(Para producción en Vercel: `VITE_API_URL=https://tu-api.vercel.app`)*.

### 3. Iniciar Servidor de Desarrollo

```bash
bun run dev
# o con npm:
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## 💻 Características y Módulos de la Aplicación

### 🌐 Módulos para Clientes e Invitados

- **Inicio**: Bienvenida personalizada, accesos rápidos al menú y estado operativo del local.
- **Menú Interactivo**: Catálogo con paginación, filtros dinámicos por categoría, buscador en tiempo real e indicadores de disponibilidad.
- **Carrito y Checkout**:
  - Selección de dirección mediante mapa interactivo Leaflet / GPS.
  - Cálculo automático de distancia en kilómetros desde las coordenadas del local (Fórmula de Haversine).
  - Desglose financiero transparente: Subtotal (Platos) + IVA (15%) + Envío Delivery (KM) = Total Final.
  - Validación del horario de atención del local (impide compras si el restaurante se encuentra cerrado).
- **Seguimiento de Pedidos en Tiempo Real (SSE)**: Conexión constante para visualizar el avance del pedido (Pendiente → Confirmado → En Preparación → Listo → En Camino → Entregado) con tonos de notificación suave.
- **Mis Pedidos**: Historial ordenado de transacciones anteriores.
- **Mi Perfil**: Edición de datos personales, teléfono, dirección preferida y actualización de contraseña.

---

### 🛡️ Módulos de Administración (Solo Administradores)

- **Dashboard Analítico de Ventas**: Visualización de KPIs (Ingresos totales, ventas del día, ticket promedio, total de pedidos por estado y ranking de platos más vendidos).
- **Gestión de Menú**: Formulario modal para crear, editar, ocultar o eliminar platos y bebidas.
- **Gestión de Pedidos & Repartidores por WhatsApp**:
  - Cambio de estados de pedidos.
  - Asignación de motorizados/repartidores y generación automática de mensajes para WhatsApp Web con los detalles del cliente y dirección.
- **Configuración del Negocio**:
  - Ajuste de horario de atención (Hora de apertura y cierre, días operativos).
  - Interruptor manual de servicio (Abierto / Cerrado temporalmente).
  - Tarifas por kilómetro de delivery (Costo base $, recargo por km adicional $, cobertura máxima en km y coordenadas del local).
- **Gestión de Administradores**: Alta de cuentas administrativas de forma segura.

---

## 🎨 Diseño y Experiencia de Usuario (UX/UI)

- **Estética Glassmorphism**: Tarjetas translúcidas con efectos de desenfoque de fondo y bordes pulidos.
- **Formularios Adaptables**: Validación interactiva e integración con el mapa.
- **Alertas Flotantes**: Sistema de notificaciones integradas para acciones exitosas y mensajes informativos.
- **Diseño 100% Responsivo**: Optimizado para dispositivos móviles, tablets y computadoras de escritorio.

---

## ☁️ Despliegue en Vercel

1. Subir el código al repositorio de GitHub.
2. Conectar el repositorio en [Vercel](https://vercel.com).
3. Agregar la variable de entorno `VITE_API_URL` apuntando a la URL del backend desplegado.
