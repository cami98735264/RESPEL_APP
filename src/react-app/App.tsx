import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EntradaPage, ResiduosPage } from './features/residuos';
import { DashboardPage } from './features/dashboard';
import { ReportesPage } from './features/reportes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/entrada" replace />} />
        <Route path="/entrada" element={<EntradaPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/residuos" element={<ResiduosPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
