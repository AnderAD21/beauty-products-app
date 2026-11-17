# Beauty Products — Plataforma Full-Stack de Gestión Comercial y Cobranzas por Campañas

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_4.21-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Backend_API-Render-46E3B7?logo=render&logoColor=black)

## Descripción Ejecutiva

**Beauty Products** es una plataforma web Full-Stack de comercio electrónico B2C/venta directa y gestión operativa diseñada para administrar el ciclo comercial completo de ventas por campañas mensuales, catálogo dinámico de productos, cartera de clientes, facturación mediante notas de venta y control transaccional de cuentas por cobrar.

El sistema está construido bajo una **arquitectura cloud desacoplada** en tres capas: un cliente SPA reactivo servido globalmente mediante CDN en **Vercel**, una API RESTful sin estado (*stateless*) en **Node.js + Express** desplegada en **Render**, y persistencia relacional transaccional sobre **PostgreSQL en Supabase** bajo el esquema dedicado `beautyproductsdb`.

---

## Arquitectura del Sistema

```mermaid
flowchart LR
    subgraph Cliente["Cliente Web"]
        Browser["Navegador Web<br/>(Desktop / Mobile)"]
    end

    subgraph Vercel["Vercel (Edge CDN)"]
        SPA["Frontend SPA<br/>React 18 + Vite 6 + TypeScript<br/>Tailwind CSS + Radix UI"]
    end

    subgraph Render["Render (Cloud Compute)"]
        API["API RESTful<br/>Node.js + Express + TypeScript<br/>Validación con Zod"]
        Pool["Connection Pool (pg)<br/>Transacciones ACID"]
    end

    subgraph Supabase["Supabase (Managed PostgreSQL)"]
        DB[("PostgreSQL<br/>Esquema: beautyproductsdb<br/>Tablas: cliente, campana, producto,<br/>productocampana, venta, detalleventa,<br/>notaventa, cuentaporcobrar, pago")]
    end

    Browser -->|"HTTPS (Assets & SPA Routing)"| SPA
    SPA -->|"REST JSON (VITE_API_URL)<br/>CORS Validado"| API
    API --> Pool
    Pool -->|"SSL/TLS (TCP 5432)<br/>SET search_path TO beautyproductsdb"| DB
```

---

## Stack Tecnológico

| Capa | Tecnologías y Librerías | Propósito en la Arquitectura |
| :--- | :--- | :--- |
| **Frontend** | React 18.3, TypeScript 5.7, Vite 6.0, React Router DOM 6.28 | SPA declarativa con enrutamiento cliente, hooks asíncronos personalizados (`useAsync`, `usePagination`) y tipado estricto de dominio. |
| **UI y Diseño** | Tailwind CSS 3.4, Primitivas Radix UI (`dialog`, `select`, `tabs`, `label`, `slot`), Lucide React, Sonner | Sistema de componentes accesibles estilo *shadcn/ui*, notificaciones *toast* en tiempo real y diseño responsivo. |
| **Backend API** | Node.js (ESM), Express 4.21, TypeScript 5.7, `tsx` | Servidor HTTP RESTful con *middlewares* centralizados de manejo de errores (`HttpError`, `ZodError`), `asyncHandler` y política CORS configurable. |
| **Validación y Datos** | Zod 3.24, `pg` (node-postgres 8.13), `dotenv` | Validación de esquemas de entrada en cada endpoint, *connection pooling* a PostgreSQL y soporte nativo para transacciones SQL (`BEGIN` / `COMMIT` / `ROLLBACK`). |
| **Base de Datos** | PostgreSQL (alojada en **Supabase**) | Almacenamiento relacional en el esquema `beautyproductsdb` con integridad referencial para ventas, notas de venta, cuentas por cobrar y pagos. |
| **Infraestructura Cloud** | **Vercel** (Frontend) + **Render** (Backend) + **Supabase** (DB) | Despliegue continuo (CI/CD) desacoplado con variables de entorno aisladas por servicio y conexión SSL/TLS. |

---

## Características Principales y Módulos

### 1. Dashboard Ejecutivo (`/`)
- Indicadores clave de rendimiento (KPIs) en tiempo real: **Total vendido**, **Total cobrado**, **Total por cobrar** y **Clientes con deuda activa**.
- Visualización de la campaña activa en curso, listado de últimas ventas registradas y ranking de mayores cuentas por cobrar.

### 2. Gestión de Catálogo Maestro y Campañas (`/catalogo`)
- Separación arquitectónica entre el **Catálogo Maestro de Productos** (`producto`: código, nombre/descripción, marca) y la **Oferta por Campaña** (`productocampana`: precio específico por campaña y estado de disponibilidad).
- Creación de campañas mensuales (`campana`) y activación exclusiva (al activar una campaña se cierran automáticamente las anteriores para garantizar una única campaña activa de venta).
- Búsqueda instantánea por código, nombre o marca y asignación/actualización (*upsert*) de precios y disponibilidad por campaña.

### 3. Directorio y Perfil Crediticio de Clientes (`/clientes` y `/clientes/:id`)
- CRUD completo de clientes con validación de DNI de 8 dígitos numéricos, verificación de duplicados, teléfono, correo y dirección.
- Filtros por estado financiero (`Todos`, `Con deuda`, `Sin deuda`), búsqueda multicriterio y paginación.
- Vista detallada por cliente con métricas individuales (saldo pendiente, total histórico comprado, número de transacciones), historial de compras y desglose de abonos realizados.

### 4. Motor Transaccional de Ventas (`/ventas`, `/ventas/nueva`, `/ventas/:id`)
- Flujo guiado en 2 pasos:
  1. **Selección de productos vendibles** de la campaña activa y construcción interactiva del carrito con cálculo automático de subtotales.
  2. **Asignación de cliente** (con creación rápida en línea) y selección de modalidad de pago (`CONTADO` o `CREDITO`).
- **Transacción atómica en PostgreSQL (`POST /api/ventas`)**:
  - Verifica automáticamente el **límite de crédito por cliente (`S/ 100.00`)** sumando el saldo vigente en `cuentaporcobrar` antes de autorizar una venta a crédito.
  - Congela el precio unitario de campaña en `detalleventa` (`precio_aplicado`) para preservar la inmutabilidad histórica.
  - Emite automáticamente la **Nota de Venta** (`notaventa` con correlativo `NV-XXXX`).
  - Si es **Contado**, registra el desembolso inmediato en `pago`. Si es **Crédito**, apertura una `cuentaporcobrar` en estado `Vigente` con vencimiento a **30 días**.

### 5. Gestión de Cobranzas y Pagos (`/pagos` y `/saldos`)
- Registro transaccional de abonos parciales o totales (`POST /api/pagos/registrar`) sobre cuentas por cobrar vigentes.
- Validación de tope de pago (impide abonar un monto superior al saldo pendiente), actualización automática de `saldo_pendiente` y transición automática de la cuenta al estado `Cancelada` cuando el saldo llega a `0`.
- Reporte consolidado de saldos y antigüedad de deuda por cliente (`/saldos`), con clasificación automática de cuentas en **Al día**, **Por vencer** (≤ 7 días) y **Vencidas**.

---

## Especificación de Endpoints de la API REST

Todos los endpoints se exponen bajo el prefijo `/api`:

| Recurso | Método | Endpoint | Descripción Funcional |
| :--- | :---: | :--- | :--- |
| **Healthcheck** | `GET` | `/api/health` | Verifica la disponibilidad del servicio y conectividad activa con PostgreSQL (`SELECT 1`). |
| **Campañas** | `GET` | `/api/campanias` | Lista todas las campañas registradas ordenadas por año e identificador. |
| | `GET` | `/api/campanias/activa` | Obtiene la campaña actualmente activa. |
| | `POST` | `/api/campanias` | Crea una nueva campaña mensual (`mes`, `anio`, `estado`). |
| | `PATCH` | `/api/campanias/:id/activar` | Activa la campaña indicada y marca las demás como cerradas. |
| **Productos** | `GET` | `/api/productos` | Lista el catálogo maestro de productos. |
| | `POST` | `/api/productos` | Registra un nuevo producto maestro (`codigo`, `nombre`, `descripcion`, `marca`). |
| | `PUT` | `/api/productos/:id` | Actualiza los datos de un producto maestro existente. |
| | `DELETE` | `/api/productos/:id` | Elimina un producto del catálogo maestro. |
| **Productos por Campaña** | `GET` | `/api/productos-campania/campania/:campaniaId` | Obtiene las asignaciones de precio y disponibilidad de una campaña. |
| | `GET` | `/api/productos-campania/campania/:campaniaId/vendibles` | Lista los productos con disponibilidad activa y su precio para el carrito de ventas. |
| | `POST` | `/api/productos-campania/upsert` | Inserta o actualiza el precio y disponibilidad de un producto en una campaña. |
| | `DELETE` | `/api/productos-campania/:id` | Desvincula un producto de una campaña específica. |
| **Clientes** | `GET` | `/api/clientes` | Lista todos los clientes ordenados alfabéticamente. |
| | `GET` | `/api/clientes/:id` | Obtiene el detalle de un cliente por ID. |
| | `POST` | `/api/clientes` | Registra un nuevo cliente (`dni`, `nombre`, `telefono`, `direccion`). |
| | `PUT` | `/api/clientes/:id` | Actualiza la información de contacto o documento de un cliente. |
| | `DELETE` | `/api/clientes/:id` | Elimina el registro de un cliente. |
| **Ventas** | `GET` | `/api/ventas` | Lista todas las ventas con sus ítems y totales desde `notaventa` y `detalleventa`. |
| | `GET` | `/api/ventas/cliente/:clienteId` | Historial de ventas asociadas a un cliente específico. |
| | `GET` | `/api/ventas/:id` | Obtiene el detalle completo de una venta y sus líneas de producto. |
| | `POST` | `/api/ventas` | Ejecuta la transacción de venta (valida crédito, crea venta, detalle, nota de venta y pago/CxC). |
| **Cuentas por Cobrar** | `GET` | `/api/cuentas` | Lista todas las cuentas por cobrar ordenadas por fecha de vencimiento. |
| | `GET` | `/api/cuentas/vigentes` | Lista únicamente las cuentas en estado `Vigente` con saldo mayor a cero. |
| | `GET` | `/api/cuentas/venta/:ventaId` | Obtiene la cuenta por cobrar asociada a una venta a crédito. |
| | `GET` | `/api/cuentas/cliente/:clienteId` | Lista las cuentas por cobrar de un cliente específico. |
| | `PUT` | `/api/cuentas/:id` | Actualiza manualmente el saldo pendiente y estado de una cuenta. |
| **Pagos** | `GET` | `/api/pagos` | Historial completo de pagos al contado y abonos de crédito. |
| | `GET` | `/api/pagos/venta/:ventaId` | Lista los pagos asociados a una venta específica. |
| | `POST` | `/api/pagos/registrar` | Registra transaccionalmente un abono, descuenta el saldo de la CxC y actualiza su estado. |
| **Saldos y Reportes** | `GET` | `/api/saldos/resumen` | KPIs globales: total vendido, total cobrado, total por cobrar, N° de ventas y clientes con deuda. |
| | `GET` | `/api/saldos/clientes` | Agregación de deuda vigente, cuentas vencidas y próximo vencimiento por cliente. |
| | `GET` | `/api/saldos/clientes/:clienteId` | Obtiene el saldo total pendiente de un cliente específico. |

---

## Estructura del Proyecto

```text
beauty-products-app/
├── backend/                          # API REST (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts                # Carga y validación de variables de entorno y DB_SCHEMA
│   │   ├── db/
│   │   │   ├── pool.ts               # Pool de conexiones PostgreSQL y helper transaction()
│   │   │   └── query.ts              # Helpers tipados query() y queryOne()
│   │   ├── routes/
│   │   │   ├── campanias.ts          # Endpoints de campañas mensuales
│   │   │   ├── clientes.ts           # Endpoints CRUD de clientes
│   │   │   ├── cuentas.ts            # Endpoints de cuentas por cobrar
│   │   │   ├── health.ts             # Endpoint de monitoreo de salud y BD
│   │   │   ├── pagos.ts              # Endpoints de pagos y amortización transaccional
│   │   │   ├── productos.ts          # Endpoints del catálogo maestro
│   │   │   ├── productosCampania.ts  # Endpoints de precios y disponibilidad por campaña
│   │   │   ├── saldos.ts             # Endpoints de reportes ejecutivos y saldos por cliente
│   │   │   └── ventas.ts             # Endpoints transaccionales de ventas y notas de venta
│   │   ├── utils/
│   │   │   ├── asyncHandler.ts       # Wrapper para captura de promesas en Express
│   │   │   └── httpError.ts          # Clase de error HTTP con código de estado
│   │   ├── app.ts                    # Configuración de middlewares, rutas y manejador global de errores
│   │   ├── mappers.ts                # Transformadores de filas SQL al modelo de dominio JSON
│   │   └── server.ts                 # Punto de entrada del servidor HTTP
│   ├── .env.example                  # Plantilla de variables de entorno del backend
│   ├── package.json
│   └── tsconfig.json
├── frontend/                         # Cliente Web SPA (React 18 + Vite 6 + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/               # Componentes transversales (StatCard, DataToolbar, PeriodFilter, etc.)
│   │   │   ├── layout/               # Estructura principal (AppShell, Sidebar, Topbar)
│   │   │   └── ui/                   # Sistema de diseño base con Radix UI y Tailwind CSS
│   │   ├── features/                 # Diálogos, formularios y selectores modulares por dominio
│   │   │   ├── catalogo/
│   │   │   ├── clientes/
│   │   │   ├── pagos/
│   │   │   └── ventas/
│   │   ├── hooks/                    # Hooks reutilizables (useAsync, usePagination)
│   │   ├── lib/                      # Utilidades de formato monetario, fechas y periodos
│   │   ├── routes/                   # Vistas de página conectadas a React Router
│   │   ├── services/                 # Cliente HTTP (api.ts) y servicios por entidad de dominio
│   │   ├── types/                    # Definiciones de tipos e interfaces TypeScript
│   │   ├── App.tsx                   # Definición de rutas de la SPA
│   │   └── main.tsx                  # Punto de montaje de React
│   ├── .env.example                  # Plantilla de variables de entorno del frontend
│   ├── vercel.json                   # Reglas de rewrite para enrutamiento SPA en Vercel
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── .gitignore                        # Reglas de exclusión de Git y protección de secretos
└── README.md                         # Documentación técnica y de arquitectura
```

---

## Configuración y Ejecución en Entorno Local

### Prerrequisitos
- **Node.js** `>= 20.x` y **npm** `>= 10.x`
- Instancia de **PostgreSQL** (`>= 14`) local o proyecto en **Supabase** con el esquema `beautyproductsdb` inicializado.

### 1. Clonar el repositorio

```bash
git clone https://github.com/AnderAD21/beauty-products-app.git
cd beauty-products-app
```

### 2. Configurar y levantar el Backend (`http://localhost:4000`)

```bash
cd backend
cp .env.example .env
```

Edita el archivo `backend/.env` con las credenciales de tu instancia de PostgreSQL o Supabase:

```env
PORT=4000

# Opción A: Cadena de conexión directa (ej. Supabase)
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Opción B: Parámetros discretos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false
DB_SCHEMA=beautyproductsdb

CORS_ORIGIN=http://localhost:5173
```

Instala las dependencias e inicia el servidor en modo desarrollo:

```bash
npm install
npm run dev
```

Verifica el estado de la API y la conexión a la base de datos en:
`GET http://localhost:4000/api/health` → `{"ok":true,"db":true}`

### 3. Configurar y levantar el Frontend (`http://localhost:5173`)

En una nueva terminal:

```bash
cd frontend
cp .env.example .env
```

Verifica la variable en `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
```

Instala las dependencias y levanta el servidor de desarrollo de Vite:

```bash
npm install
npm run dev
```

---

## Despliegue en la Nube (Producción)

1. **Base de Datos (Supabase):**
   - Aprovisionar proyecto PostgreSQL en Supabase y asegurarse de que las tablas residan bajo el esquema `beautyproductsdb`.
2. **Backend API (Render):**
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Variables de Entorno:** Configurar `DATABASE_URL` (o `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), `DB_SSL=true`, `DB_SCHEMA=beautyproductsdb` y `CORS_ORIGIN=https://<tu-dominio-frontend>.vercel.app`.
3. **Frontend SPA (Vercel):**
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Variables de Entorno:** Configurar `VITE_API_URL=https://<tu-servicio-backend>.onrender.com/api`.
   - El archivo `frontend/vercel.json` gestiona automáticamente los *rewrites* hacia `/index.html` para soportar navegación directa en rutas de React Router.
