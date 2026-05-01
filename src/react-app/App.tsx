import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './shared/layout/AppShell';
import { EntradaPage, ResiduosPage, SalidaPage } from './features/residuos';
import { DashboardPage } from './features/dashboard';
import { ReportesPage } from './features/reportes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/entrada" element={<EntradaPage />} />
          <Route path="/salida" element={<SalidaPage />} />
          <Route path="/residuos" element={<ResiduosPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
