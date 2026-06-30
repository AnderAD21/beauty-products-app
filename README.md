# Beauty Products

Proyecto full-stack para ventas por campanias.

## Estructura

```txt
frontend/  React + Vite
backend/   API Node + Express + PostgreSQL
```

## PostgreSQL

Las tablas estan en el esquema `beautyproductsdb`, dentro de la base `postgres`.
En `psql`, para verlas:

```sql
\dt beautyproductsdb.*
SET search_path TO beautyproductsdb;
\dt
```

## Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Completa `backend/.env` con tu password local de PostgreSQL antes de iniciar.

Ejemplo:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password
DB_SSL=false
DB_SCHEMA=beautyproductsdb
CORS_ORIGIN=http://localhost:5173
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Deploy rapido

### Supabase

1. Crea un proyecto en Supabase.
2. En SQL Editor, ejecuta el script de tablas y datos.
3. Copia los datos de conexion de Project Settings > Database.

### Render

Servicio Web:

```txt
Root Directory: backend
Build Command: npm install && npm run build
Start Command: npm start
```

Variables:

```env
DB_HOST=...
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres...
DB_PASSWORD=...
DB_SSL=true
DB_SCHEMA=beautyproductsdb
CORS_ORIGIN=https://tu-frontend.vercel.app
```

### Vercel

Proyecto:

```txt
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Variable:

```env
VITE_API_URL=https://tu-backend.onrender.com/api
```
