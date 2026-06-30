import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { DashboardPage } from '@/routes/DashboardPage'
import { CatalogoPage } from '@/routes/CatalogoPage'
import { ClientesPage } from '@/routes/ClientesPage'
import { ClienteDetallePage } from '@/routes/ClienteDetallePage'
import { VentasPage } from '@/routes/VentasPage'
import { VentaNuevaPage } from '@/routes/VentaNuevaPage'
import { VentaDetallePage } from '@/routes/VentaDetallePage'
import { PagosPage } from '@/routes/PagosPage'
import { SaldosPage } from '@/routes/SaldosPage'
import { NotFoundPage } from '@/routes/NotFoundPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="catalogo" element={<CatalogoPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/:id" element={<ClienteDetallePage />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="ventas/nueva" element={<VentaNuevaPage />} />
          <Route path="ventas/:id" element={<VentaDetallePage />} />
          <Route path="pagos" element={<PagosPage />} />
          <Route path="saldos" element={<SaldosPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
