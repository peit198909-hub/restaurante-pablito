# Restaurante Pablito - Frontend Web

Interfaz de usuario web responsiva para el Restaurante Pablito. Construida con React, Vite, Bootstrap, Lucide Icons y CSS Personalizado de alta estetica.

## Caracteristicas Visuales y Funcionales

- **Diseño Premium**: Paleta gastronómica cálida, bordes suaves, efectos de vidrio (glassmorphism), y microanimaciones interactivas.
- **Flujo Autoadaptable**: Barra de navegación y accesos que cambian según el estado de la sesión y el rol del usuario (cliente o administrador).
- **Autenticacion Persistente**: Almacenamiento seguro en sesión local para mantener el inicio de sesión.
- **Notificaciones Flotantes**: Sistema interactivo de alertas animadas para informar éxitos y errores en tiempo real.

## Instalacion y Ejecucion

1. Instalar las dependencias del frontend:
   ```bash
   bun install
   ```

2. Crear y configurar las variables de entorno en un archivo `.env`:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

3. Correr el servidor de desarrollo de Vite:
   ```bash
   bun run dev
   ```
   La aplicacion estara abierta en: `http://localhost:5173`.

## Estructura de Vistas (SPA)

- **Inicio / Home**: Bienvenida personalizada a clientes o administradores.
- **Iniciar Sesion**: Acceso con credenciales seguras.
- **Registrarse**: Auto-registro público para clientes.
- **Mi Perfil**: Visualización y edición de datos del usuario autenticado, además del cambio de contraseña.
- **Crear Admin**: Panel administrativo exclusivo (solo accesible para administradores) para registrar otros administradores de forma segura.
