import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './shared/layout/AppShell';
import { EntradaPage, ResiduosPage, SalidaPage } from './features/residuos';
import { DashboardPage } from './features/dashboard';
import { ReportesPage } from './features/reportes';
import { GestoresPage } from './features/gestores';
import { AlertasPage } from './features/alertas';
import { RealtimeProvider } from './shared/realtime';
import { RealtimeToaster } from './shared/realtime/RealtimeToaster';
import { Toaster } from './shared/ui/toaster';

export default function App() {
  return (
    <BrowserRouter>
      <RealtimeProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/entrada" element={<EntradaPage />} />
            <Route path="/salida" element={<SalidaPage />} />
            <Route path="/residuos" element={<ResiduosPage />} />
            <Route path="/gestores" element={<GestoresPage />} />
            <Route path="/alertas" element={<AlertasPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>
        </Routes>
        <RealtimeToaster />
        <Toaster />
      </RealtimeProvider>
    </BrowserRouter>
  );
}
