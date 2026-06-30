# BeautyProducts — Demo frontend

Demo funcional para una consultora que vende productos de belleza por **campañas
mensuales**. Permite gestionar catálogo, clientes, ventas (contado/crédito), pagos y
cuentas por cobrar. **Sin backend**: los datos son mock y persisten en `localStorage`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + componentes estilo shadcn/ui
- React Router
- lucide-react · sonner (toasts)

## Cómo ejecutar

```bash
cd app
npm install
npm run dev
```

Abrir la URL que muestra Vite (por defecto `http://localhost:5173`).

> Si `npm install` falla con `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (interceptación SSL),
> ejecuta con la CA del sistema: `NODE_OPTIONS=--use-system-ca npm install`.

Scripts: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint` (typecheck).

## Reglas de negocio

- Al confirmar, la **Venta** queda `REGISTRADA`.
- **Crédito** → genera una **CuentaPorCobrar** `VIGENTE` con `saldoPendiente = total`.
  - Pago parcial → sigue `VIGENTE`, baja el saldo.
  - Saldo 0 → pasa a `CANCELADA` (pagada).
- **Contado** → registra el **Pago** por el total, sin cuenta por cobrar.

## Estructura

```
src/
  routes/      Pantallas (Dashboard, Catálogo, Clientes, Ventas, Pagos, Saldos)
  components/  ui/ (base), layout/ (AppShell, Sidebar, Topbar), common/ (reutilizables)
  features/    Formularios por dominio (catalogo, clientes, ventas, pagos)
  services/    Repositorios mock async sobre localStorage (swappables a API)
  data/        Datos semilla
  types/       Modelos de dominio
  lib/ hooks/  Utilidades y hooks
```

## Reemplazar mocks por API

Cada repositorio en `src/services/*` expone `getAll / getById / create / update / remove`
devolviendo `Promise`. Para conectar una API real basta con reescribir el cuerpo de esos
métodos con `fetch` (o un cliente HTTP) **sin tocar las pantallas**. La capa `storage.ts`
y `repository.ts` aíslan completamente el acceso a `localStorage`.

Para reiniciar los datos de la demo: borra las claves `beautyproducts:*` de `localStorage`
(DevTools → Application → Local Storage) y recarga.
