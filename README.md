# GeoPatitas — Frontend

Plataforma web para reportar mascotas perdidas y encontradas con georreferenciación en tiempo real.

---

## Descripción

GeoPatitas resuelve el problema de la desconexión entre dueños de mascotas perdidas y personas que las encuentran. Permite publicar reportes geolocalizados en un mapa interactivo, aplicar filtros por especie, tipo y sexo, y recibir alertas automáticas cuando el sistema de IA detecta similitud entre un reporte perdido y uno encontrado en la misma zona. Dirigido a ciudadanos de la V Región (Valparaíso, Viña del Mar, Quilpué).

---

## Tecnologías utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19 | Framework UI |
| TypeScript | ~6.0 | Type safety |
| Vite | 8 | Build tool y dev server |
| Tailwind CSS | 4 | Estilos utility-first |
| Leaflet.js + React Leaflet | 1.9 / 5.0 | Mapas interactivos |
| Axios | 1.15 | HTTP client con interceptors |
| React Router | 7 | SPA routing |
| Context API | — | Estado global de autenticación |
| React Joyride | 3 | Tour guiado de onboarding |
| Lucide React | 1.16 | Iconografía |
| **Backend** | Spring Boot (Java) | REST API — repositorio separado |
| **Base de datos** | PostgreSQL + pgvector + PostGIS | Búsqueda vectorial y geoespacial |
| **IA** | Hugging Face API | Matching semántico de descripciones |
| **Infraestructura** | AWS EC2 + Nginx | Despliegue cloud |

---

## Requisitos previos

- Node.js >= 18.x
- npm >= 9.x
- Git

---

## Instalación

```bash
git clone https://github.com/SimonVC89/geopatitas-frontend.git
cd geopatitas-frontend
npm install
```

---

## Configuración

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_MAP_DEFAULT_LAT=-33.0472
VITE_MAP_DEFAULT_LNG=-71.6127
VITE_MAP_DEFAULT_ZOOM=12
```

Para apuntar al servidor de producción cambiar `VITE_API_URL` a la URL del EC2.

---

## Uso / Ejecución

```bash
# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build de producción
npm run preview

# Linting
npm run lint
```

El servidor de desarrollo inicia en `http://localhost:5173`.

---

## Arquitectura del proyecto

```
geopatitas-frontend/
├── public/                  # Assets estáticos
└── src/
    ├── assets/              # Imágenes y logos
    ├── components/          # Componentes reutilizables (Navbar, Footer)
    ├── contexts/            # AuthContext — estado global de sesión
    ├── pages/               # Vistas principales
    │   ├── Home.tsx         # Landing page
    │   ├── Login.tsx        # Autenticación
    │   ├── Register.tsx     # Registro + T&C
    │   ├── Map.tsx          # Mapa interactivo + reporte rápido
    │   ├── MyReports.tsx    # Dashboard: mis reportes, edición, match IA
    │   └── CreateReport.tsx # Formulario de reporte extendido
    ├── services/
    │   └── api.ts           # Instancia Axios con interceptors de token
    ├── App.tsx              # Rutas y layout raíz
    └── main.tsx             # Entry point
```

**Flujo principal:**
1. Usuario se registra aceptando T&C de privacidad de datos
2. Publica reporte (perdido/encontrado) con foto y pin en el mapa
3. El backend cruza automáticamente por zona (PostGIS) y por similitud semántica (pgvector + Hugging Face)
4. Si similitud > 85%, ambos usuarios reciben una notificación
5. Desde "Mis Reportes" se puede ver el match, ver la ruta en mapa y contactar al reportante

---

## Base de datos

El backend gestiona la base de datos. Modelo principal:

| Entidad | Campos relevantes | Notas |
|---------|-------------------|-------|
| `users` | id, nombre, email, telefono, password_hash | Autenticación JWT |
| `pets` | id, nombre, especie, raza, color, tamano, sexo, descripcion, tipo_reporte, estado, latitud, longitud, fotos[], fecha_reporte, user_id | ACTIVO / RESUELTO |
| `notifications` | id, user_id, pet_id, mensaje, leida, fecha_creacion | Match IA o acciones del sistema |

- **pgvector**: columna `embedding` en `pets` para búsqueda semántica por similitud de descripción
- **PostGIS**: columna `geom` en `pets` para consultas por radio geográfico

---

## Documentación de la API

Base URL: `VITE_API_URL` (dev: `http://localhost:8080/api/v1`)

### Autenticación
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Registrar usuario. Body: `{ nombre, email, password, telefono? }` |
| POST | `/auth/login` | No | Iniciar sesión. Body: `{ email, password }`. Retorna `{ token }` |
| GET | `/users/me` | JWT | Perfil del usuario autenticado |

### Mascotas
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/pets/nearby` | No | Mascotas por radio geográfico. Params: `lat, lng, radius, especie, tipoReporte, sexo` |
| GET | `/pets/match` | JWT | Matching IA para un reporte. Params: `q, especie, tipoReporte` |
| GET | `/pets/{id}` | No | Detalle de una mascota (incluye datos de contacto del reportante) |
| POST | `/pets` | JWT | Crear reporte. Body: `{ nombre, descripcion, especie, raza, sexo, fotos[], latitud, longitud, tipoReporte }` |
| POST | `/pets/guest` | No | Reporte como invitado. Agrega campo `contactoEmail` |
| POST | `/pets/upload-image` | JWT | Subir foto. multipart/form-data, clave `file`. Retorna `{ url }` |
| PUT | `/pets/{id}` | JWT | Editar reporte o cambiar estado a `RESUELTO` |

### Notificaciones
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/notifications` | JWT | Listar notificaciones (paginado: `page, size`) |
| GET | `/notifications/unread-count` | JWT | Cantidad de notificaciones no leídas |
| PUT | `/notifications/{id}/read` | JWT | Marcar notificación como leída |

### Usuarios
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/users/me/pets` | JWT | Reportes del usuario autenticado |

---

## Estructura del equipo / Autores

| Nombre | Rol | GitHub |
|--------|-----|--------|
| Simón Villar | Frontend / QA | [@SimonVC89](https://github.com/SimonVC89) |
| Carlos Muñoz | Backend / Líder Técnico | — |

**Asignatura:** TPY1101 — Taller Aplicado de Programación  
**Institución:** DuocUC — Sede Viña del Mar  
**Año:** 2026

---

## Tests / Pruebas

Las pruebas se ejecutan de forma manual siguiendo el Plan de Pruebas documentado en el informe EP3. Se cubren los siguientes módulos:

- **Autenticación:** registro (con/sin T&C), login (credenciales válidas/inválidas)
- **Reportes:** creación, edición, cambio de estado, subida de imagen
- **Mapa:** carga, filtros, modo invitado, reporte rápido desde mapa
- **Match IA:** consulta, visualización de porcentaje, contacto con reportante
- **Notificaciones:** conteo, listado, marcar como leída
- **Seguridad:** token inválido, acceso sin autenticar a rutas protegidas

> Para ejecutar el linter de código:
> ```bash
> npm run lint
> ```

---

## Licencia

Proyecto académico — DuocUC 2026. Sin licencia comercial.
