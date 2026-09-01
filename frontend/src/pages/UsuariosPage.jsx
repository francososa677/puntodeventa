import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Plus, Shield, UserCheck, Key, AlertCircle } from 'lucide-react';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    rol: 'EMPLEADO',
    password: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

  const cargarUsuarios = async () => {
    try {
      const res = await api.get('/usuarios');
      if (res.data.success) setUsuarios(res.data.usuarios);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleOpenModal = (u = null) => {
    setErrorMsg('');
    if (u) {
      setEditingUser(u);
      setFormData({ username: u.username, nombre: u.nombre, rol: u.rol, password: '' });
    } else {
      setEditingUser(null);
      setFormData({ username: '', nombre: '', rol: 'EMPLEADO', password: '' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, formData);
      } else {
        await api.post('/usuarios', formData);
      }
      setShowModal(false);
      cargarUsuarios();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar usuario');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <span>Gestión de Usuarios y Roles</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Administración de credenciales y niveles de permiso</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider font-mono border-b border-zinc-800">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Usuario</th>
              <th className="p-3.5">Nombre Completo</th>
              <th className="p-3.5">Rol</th>
              <th className="p-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-zinc-800/40">
                <td className="p-3.5 text-zinc-500">#{u.id}</td>
                <td className="p-3.5 font-bold text-zinc-100">{u.username}</td>
                <td className="p-3.5 text-zinc-300 font-sans">{u.nombre}</td>
                <td className="p-3.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    u.rol === 'ADMIN' ? 'bg-purple-950 text-purple-400 border border-purple-500/30' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {u.rol}
                  </span>
                </td>
                <td className="p-3.5 text-center">
                  <button
                    onClick={() => handleOpenModal(u)}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md font-sans text-xs"
                  >
                    Editar / Reset Clave
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-zinc-100 mb-4">
              {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
            </h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs input-focus"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Username (Login)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-mono text-xs input-focus disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs input-focus"
                >
                  <option value="EMPLEADO">EMPLEADO (Operador de venta y caja)</option>
                  <option value="ADMIN">ADMIN (Acceso total y configuración)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Contraseña {editingUser && '(Dejar en blanco para mantener actual)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-xs input-focus"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
