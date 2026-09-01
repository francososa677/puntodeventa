import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const CajaContext = createContext();

export function CajaProvider({ children }) {
  const [estadoCaja, setEstadoCaja] = useState(null);
  const [loadingCaja, setLoadingCaja] = useState(true);

  const refrescarEstadoCaja = useCallback(async () => {
    try {
      const res = await api.get('/caja/estado');
      if (res.data.success) {
        setEstadoCaja(res.data);
      }
    } catch (e) {
      console.error('Error al cargar estado de caja:', e);
    } finally {
      setLoadingCaja(false);
    }
  }, []);

  useEffect(() => {
    refrescarEstadoCaja();
  }, [refrescarEstadoCaja]);

  const abrirCaja = async (montoInicial) => {
    const res = await api.post('/caja/aperturar', { montoInicial });
    await refrescarEstadoCaja();
    return res.data;
  };

  const cerrarCaja = async (montoDeclarado, observaciones) => {
    const res = await api.post('/caja/cerrar', { montoDeclarado, observaciones });
    await refrescarEstadoCaja();
    return res.data;
  };

  return (
    <CajaContext.Provider value={{
      estadoCaja,
      cajaAbierta: estadoCaja ? estadoCaja.cajaAbierta : false,
      loadingCaja,
      refrescarEstadoCaja,
      abrirCaja,
      cerrarCaja
    }}>
      {children}
    </CajaContext.Provider>
  );
}

export function useCaja() {
  return useContext(CajaContext);
}
