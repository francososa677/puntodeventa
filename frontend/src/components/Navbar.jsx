import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCaja } from '../context/CajaContext';
import {
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Vault,
  RotateCcw,
  Users,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import AbrirCajaModal from './AbrirCajaModal';
import CerrarCajaModal from './CerrarCajaModal';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { cajaAbierta, estadoCaja } = useCaja();
  const navigate = useNavigate();

  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-inner text-sm font-mono">
              ST
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight leading-none text-emerald-400">
                Stockio
              </h1>
              <p className="text-[10px] text-zinc-400 mt-0.5">Gestión de Stock & POS</p>
            </div>
          </div>

          {/* Cash Register Discreet Badge (Section 22.1) */}
          <div className="flex items-center">
            {cajaAbierta ? (
              <button
                onClick={() => setShowCerrarModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-900/60 transition-colors shadow-sm"
                title="Haga clic para ver el estado o cerrar la caja"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Vault className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">Caja Abierta</span>
                <span className="text-emerald-400/80 hidden sm:inline">
                  • Inicial: ${estadoCaja?.montoInicial?.toLocaleString('es-AR')}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowAbrirModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-900/60 transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <Vault className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Sin Caja Abierta</span>
                <span className="underline ml-1 font-semibold">Abrir turno</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink
              to="/ventas"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`
              }
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Ventas</span>
            </NavLink>

            <NavLink
              to="/stock"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`
              }
            >
              <Package className="w-4 h-4" />
              <span>Stock</span>
            </NavLink>

            <NavLink
              to="/devoluciones"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`
              }
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Devoluciones</span>
            </NavLink>

            <NavLink
              to="/reportes"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`
              }
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reportes</span>
            </NavLink>

            {/* Admin Exclusive: CONFIGURACIÓN */}
            {isAdmin && (
              <NavLink
                to="/configuracion"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`
                }
              >
                <Settings className="w-4 h-4" />
                <span>Configuración</span>
              </NavLink>
            )}

            {/* Admin Menu Dropdown (Usuarios, Auditoría) */}
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                  onBlur={() => setTimeout(() => setShowAdminMenu(false), 200)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all border border-transparent"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline font-medium">Más</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showAdminMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <NavLink
                      to="/usuarios"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Users className="w-4 h-4 text-sky-400" />
                      <span>Usuarios</span>
                    </NavLink>
                    <NavLink
                      to="/auditoria"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Auditoría</span>
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3 border-l border-zinc-800 pl-4">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-semibold text-zinc-200">{user?.nombre}</div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                {user?.rol}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Modales de caja */}
      {showAbrirModal && (
        <AbrirCajaModal onClose={() => setShowAbrirModal(false)} />
      )}
      {showCerrarModal && (
        <CerrarCajaModal onClose={() => setShowCerrarModal(false)} />
      )}
    </>
  );
}
