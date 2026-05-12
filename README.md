# Volco

Bienvenido al repositorio oficial de **Volco**. Este proyecto es una aplicación web integral (Full-Stack) diseñada para la gestión institucional, facturación, generación de reportes y administración de datos. Cuenta con una arquitectura moderna basada en un backend robusto con FastAPI (Python) y un frontend dinámico e interactivo construido con React y Vite (JavaScript).

---

## 🏗 Arquitectura y Servicios

El proyecto está diseñado bajo una arquitectura Cliente-Servidor. Para organizar su despliegue en entornos de desarrollo o producción, utiliza **Docker Compose**, orquestando la base de datos junto con el backend y el frontend.

**Los servicios en `docker-compose.yml` son:**
- `postgres`: Base de datos PostgreSQL (v15-alpine).
- `backend`: API REST de alto rendimiento (FastAPI).
- `frontend`: Interfaz de usuario (React + Vite).

---

## 🛠 Stack Tecnológico

La plataforma aprovecha tecnologías modernas para asegurar escalabilidad y alto rendimiento:

### 🖥 Frontend (React + Vite)
- **Framework Core:** React 19 + Vite
- **Estilos:** Tailwind CSS v4 para una estilización rápida y responsiva.
- **Enrutamiento:** React Router DOM v7
- **Consumo de API:** Axios + TanStack React Query para la sincronización asíncrona y caché de datos.
- **Visualización de Datos:** Recharts para gráficas interactivas y estadísticas.
- **Iconografía:** Lucide React
- **Exportación de Documentos:** `@react-pdf/renderer` para creación directa de PDFs y `xlsx` / `xlsx-js-style` para reportes de Excel desde el cliente.

### ⚙️ Backend (Python + FastAPI)
- **Framework API:** FastAPI (Async)
- **Base de Datos y ORM:** PostgreSQL + SQLAlchemy + SQLModel
- **Migraciones:** Alembic
- **Autenticación (JWT):** Passlib (Argon2 / Bcrypt) y `python-jose`
- **Servicios Externos e Integraciones:**
  - Supabase (Almacenamiento de archivos y medios en buckets).
  - SMTP (`smtplib`, `fastapi-mail`) para notificaciones de correos y plantillas.
- **Procesamiento de Archivos:**
  - Weasyprint, Pdf2docx (Generación de PDFs robustos y conversiones a Word).
  - Openpyxl (Lectura y manipulación completa de hojas de cálculo).

---

## 🚀 Despliegue e Instalación (Docker)

La forma recomendada de inicializar y levantar **Volco** en tu máquina de desarrollo es a través de Docker y Docker Compose.

### Requisitos Previos
- Instalar [Docker](https://docs.docker.com/get-docker/) y Docker Compose.
- Clonar el proyecto localmente.
- Configurar el archivo de variables de entorno (puedes basarte en los requirements de `docker-compose.yml`).

### Pasos

1. **Clona y navega al repositorio:**
   ```bash
   git clone <REPO_URL>
   cd Volco
   ```

2. **Configura las variables de entorno:**
   Copia el archivo de ejemplo y ajusta los valores necesarios:
   ```bash
   cp .env.example .env
   ```
   *(Asegúrate de proporcionar variables esenciales requeridas para la base de datos, Supabase, JWT y servidor de correos SMTP)*

3. **Construye y levanta los servicios:**
   ```bash
   docker compose up --build
   ```

4. **Acceso a la plataforma web:**
   - **Interfaz gráfica (Frontend):** [http://localhost:5173](http://localhost:5173)
   - **API (Backend):** [http://localhost:8000](http://localhost:8000)
   - **Documentación Interactiva (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Base de Datos Local (Postgres):** Puerto `5432`

---

## 📂 Organización del Directorio

El repositorio está estructurado modularmente para separar preocupaciones entre el Cliente y el Servidor:

### 📁 `backend/`
- `.env` / `requirements.txt`: Variables secretas y dependencias en Python, incluyendo FastAPI, Alembic y conectores de base de datos.
- `Dockerfile`: Especificación de empaquetamiento e imagen Docker del backend.
- `alembic/`: Contiene los scripts y revisiones de migración para las tablas de la base de datos PostgreSQL.
- `app/` (Núcleo de la API):
  - `api/`: Controladores, Endpoints y definición de rutas de red.
  - `models/`: Definiciones SQLModel y tablas de bases de datos.
  - `repositories/`: Capa de abstracción para la interacción y consultas SQL con la DB.
  - `schemas/`: Modelos de Pydantic para validación de Payloads y respuestas API.
  - `services/`: Lógica de negocio intrínseca.
  - `templates/`: Plantillas HTML para el envío de notificaciones y correos.
  - `core/` y `utils/`: Configuraciones centrales y utilidades reusables.

### 📁 `frontend/`
- `package.json` / `vite.config.js`: Declaración de módulos Node / configuración de empaquetado.
- `Dockerfile`: Receta para el servidor web/cliente.
- `src/` (Interfaz visual e Interacciones):
  - `App.jsx` y `main.jsx`: Puntos de entrada y jerarquía de Rutas de la aplicación web React.
  - `api/`: Proveedores y llamadas asíncronas de red hacia el backend.
  - `components/`: Componentes compartidos, representativos e independientes visualmente.
  - `pages/`: Vistas de nivel superior como Paneles de Control (Dashboard), listados integrales o formularios.
  - `assets/` / `public/`: Gráficos, estilos CSS core (`index.css`), SVGs y media estática.
  - `hooks/`: Hooks dinámicos personalizados.

---

## 🤝 Flujo de Contribución

1. Crea una rama temporal desde `main` o `develop`: `git checkout -b feature/mi-nueva-caracteristica`.
2. Realiza tus cambios y guarda el historial de confirmaciones (commits) detallando concisamente el porqué.
3. Asegúrese de que el linter del código React/Javascript se aprueba (en el dir de `frontend` ejecute `npm run lint`).
4. Abre un *Pull Request* referenciando los objetivos asociados y documente sus anexos.

### 🐛 Notas del Desarrollador
- Revisa el sistema de logs para los contenedores Docker en caso de presentar trabas de red u operaciones usando `docker compose logs -f`.
- Todos los componentes, validaciones inter-capas y rutas novedosas en backend deben registrarse y mantener compatibilidad con las validaciones de tipo en Python (modelos Pydantic).
