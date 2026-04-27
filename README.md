# GeoPatitas - Frontend

Plataforma web para reportar mascotas perdidas y encontradas con georreferenciación en tiempo real.

## Proyecto Final - DuocUC
**Ramo:** Taller Aplicado de Programación (TPY1101)
**Integrantes:** Simón Villar (Frontend/QA) & Carlos Muñoz (Backend)
**Región:** Valparaíso, Viña del Mar, Quilpué (V Región, Chile)

---

## Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **Estilos:** Tailwind CSS
- **Mapas:** Leaflet.js + React Leaflet
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Estado Global:** Context API
- **Backend:** Spring Boot (Java) - Repositorio separado
- **Base de datos:** PostgreSQL + pgvector + PostGIS
- **IA:** Hugging Face API (matching semántico)
- **Infraestructura:** AWS EC2 + Nginx

---

## Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- Git

---

## Instalación

1. Clonar el repositorio:
```bash
git clone <URL_DEL_REPO>
cd geopatitas-frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

4. Configurar variables de entorno en `.env`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_MAP_DEFAULT_LAT=-33.0472
VITE_MAP_DEFAULT_LNG=-71.6127
VITE_MAP_DEFAULT_ZOOM=12
```

---

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

---

## Estructura del Proyecto

```
src/
├── assets/          # Imágenes, logos, iconos
├── components/      # Componentes reutilizables
├── contexts/        # Context API (AuthContext, etc.)
├── hooks/           # Custom hooks
├── pages/           # Páginas/Vistas principales
├── services/        # API calls, axios config
├── types/           # TypeScript types/interfaces
├── utils/           # Funciones auxiliares
├── App.tsx          # Componente raíz
├── main.tsx         # Entry point
└── index.css        # Estilos globales + Tailwind
```

---

## Funcionalidades Core

1. **Autenticación**
   - Registro de usuarios
   - Login
   - Modo invitado

2. **Reportes**
   - Crear reporte de mascota perdida
   - Crear reporte de mascota encontrada
   - Subir foto y descripción

3. **Mapa Interactivo**
   - Visualización georreferenciada con Leaflet.js
   - Filtros por tipo de reporte
   - Clusters de marcadores

4. **Matching IA**
   - Cruce automático por zona (PostGIS)
   - Similitud semántica con vectores (pgvector + Hugging Face)
   - Alertas por email cuando similitud > 85%

5. **Responsive Design**
   - Mobile-first con Tailwind CSS
   - Compatible con dispositivos móviles y escritorio

---

## Tecnologías Utilizadas

| Tecnología | Propósito |
|------------|-----------|
| React 18 | Framework UI |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS | Estilos utility-first |
| Leaflet.js | Mapas interactivos |
| Axios | HTTP client |
| React Router | SPA routing |
| Context API | Estado global |

---

## Estado del Proyecto

- **Fase actual:** Fase 1 (Planificación - Semanas 1-4)
- **Próxima fase:** Fase 2 (Desarrollo - Semanas 5-12)
- **Plazo final:** Fines de junio 2026

---

## Contacto

- **Simón Villar** - Frontend/QA
- **Carlos Muñoz** - Backend/Líder Técnico

---

## Licencia

Proyecto académico - DuocUC 2026
