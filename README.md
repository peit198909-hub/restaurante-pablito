# Frontend de Restaurante Pablito - Paulina Iza

Este es el frontend de React para el sistema del Restaurante Pablito. Es la interfaz grafica para que los clientes se registren, inicien sesion y gestionen su perfil de entrega, y para que los administradores den de alta a otros administradores.

## Como hacer funcionar el frontend

1. Instala los paquetes y librerias necesarios con bun:
   ```bash
   bun install
   ```

2. Configura tu archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
   (Abre el archivo .env y pon el URL de tu backend en VITE_API_URL. Por ejemplo: `VITE_API_URL=https://restaurante-pablito-api.vercel.app`).

3. Lanza el servidor de Vite en desarrollo:
   ```bash
   bun run dev
   ```
   La aplicacion se ejecutara en la direccion local: http://localhost:5173.

---

## Modulos y vistas principales de la web

- **Inicio**: Muestra una bienvenida personalizada con tu nombre y apellido si estas logueado. Si eres invitado, te muestra botones rapidos para registrarte o iniciar sesion.
- **Iniciar Sesion**: Pantalla para ingresar con tu correo y clave. Guarda la sesion en el navegador para que no tengas que loguearte cada vez.
- **Registrarse**: Formulario publico para clientes nuevos, con ejemplos locales de Ecuador (nombres, telefonos de 10 digitos y calles conocidas).
- **Mi Perfil**: Te permite cambiar tu nombre, apellido, telefono y direccion de entrega, y tambien actualizar tu clave verificando primero tu contraseña actual.
- **Crear Admin**: Una pestaña oculta que solo aparece si tu cuenta tiene rol de administrador, para registrar de forma segura otros administradores del local.
