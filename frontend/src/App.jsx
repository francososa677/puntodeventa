import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CajaProvider } from './context/CajaContext';

import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import VentasPage from './pages/VentasPage';
import StockPage from './pages/StockPage';
import ReportesPage from './pages/ReportesPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import DevolucionesPage from './pages/DevolucionesPage';
import UsuariosPage from './pages/UsuariosPage';
import AuditoriaPage from './pages/AuditoriaPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono text-xs">
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/ventas" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CajaProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={<Navigate to="/ventas" replace />} />

            <Route
              path="/ventas"
              element={
                <ProtectedRoute>
                  <VentasPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/stock"
              element={
                <ProtectedRoute>
                  <StockPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reportes"
              element={
                <ProtectedRoute>
                  <ReportesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuracion"
              element={
                <ProtectedRoute adminOnly={true}>
                  <ConfiguracionPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/devoluciones"
              element={
                <ProtectedRoute>
                  <DevolucionesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute adminOnly={true}>
                  <UsuariosPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/auditoria"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AuditoriaPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/ventas" replace />} />
          </Routes>
        </CajaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
