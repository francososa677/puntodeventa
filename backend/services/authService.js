const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { JWT_SECRET } = require('../middlewares/auth');
const { registrarAuditoria } = require('./auditoriaService');

async function login(username, password) {
  const usuario = await Usuario.findOne({ where: { username, activo: true } });
  if (!usuario) {
    const error = new Error('Usuario o contraseña incorrectos');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, usuario.password_hash);
  if (!isMatch) {
    const error = new Error('Usuario o contraseña incorrectos');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  await registrarAuditoria(usuario.id, 'LOGIN', 'USUARIO', `Inicio de sesión exitoso de ${usuario.username}`);

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      username: usuario.username,
      rol: usuario.rol
    }
  };
}

async function logout(usuarioId) {
  await registrarAuditoria(usuarioId, 'LOGOUT', 'USUARIO', 'Cierre de sesión');
  return { message: 'Sesión cerrada correctamente' };
}

module.exports = {
  login,
  logout
};
