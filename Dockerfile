# Etapa 1: Compilación de la aplicación con Node.js
FROM node:20-alpine AS build
WORKDIR /app

# Argumentos de construcción para Coolify (Variables VITE_*)
ARG VITE_API_URL
ARG VITE_WS_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Copiar paquetes e instalar dependencias
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fuente y construir bundle estático
COPY . .
RUN npm run build

# Etapa 2: Servidor web con Nginx ultra liviano
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
