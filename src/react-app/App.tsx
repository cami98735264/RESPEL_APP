import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from './features/dashboard';
import { ResiduosPage } from './features/residuos';
import { ReportesPage } from './features/reportes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/residuos" element={<ResiduosPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
