const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');
const { registrarAuditoria } = require('./auditoriaService');

async function getAllUsuarios() {
  return await Usuario.findAll({
    attributes: { exclude: ['password_hash'] },
    order: [['id', 'ASC']]
  });
}

async function createUsuario({ nombre, username, password, rol }, adminUserId) {
  const existing = await Usuario.findOne({ where: { username } });
  if (existing) {
    const err = new Error('El nombre de usuario ya está en uso');
    err.status = 400;
    err.code = 'USERNAME_TAKEN';
    throw err;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const nuevoUsuario = await Usuario.create({
    nombre,
    username,
    password_hash,
    rol: rol || 'EMPLEADO',
    activo: true
  });

  await registrarAuditoria(
    adminUserId,
    'CREAR_USUARIO',
    'USUARIO',
    `Usuario creado: ${nuevoUsuario.username} (${nuevoUsuario.rol})`
  );

  return {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    username: nuevoUsuario.username,
    rol: nuevoUsuario.rol,
    activo: nuevoUsuario.activo
  };
}

async function updateUsuario(id, { nombre, username, password, rol, activo }, adminUserId) {
  const usuario = await Usuario.findByPk(id);
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  if (username && username !== usuario.username) {
    const existing = await Usuario.findOne({ where: { username } });
    if (existing) {
      const err = new Error('El nombre de usuario ya está en uso');
      err.status = 400;
      err.code = 'USERNAME_TAKEN';
      throw err;
    }
    usuario.username = username;
  }

  if (nombre) usuario.nombre = nombre;
  if (rol) usuario.rol = rol;
  if (typeof activo === 'boolean') usuario.activo = activo;

  if (password && password.trim().length > 0) {
    usuario.password_hash = await bcrypt.hash(password, 10);
  }

  usuario.updated_at = new Date();
  await usuario.save();

  await registrarAuditoria(
    adminUserId,
    'MODIFICAR_USUARIO',
    'USUARIO',
    `Usuario modificado: ${usuario.username}`
  );

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    username: usuario.username,
    rol: usuario.rol,
    activo: usuario.activo
  };
}

module.exports = {
  getAllUsuarios,
  createUsuario,
  updateUsuario
};
