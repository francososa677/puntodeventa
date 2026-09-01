const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'puntoventa_secret_key_2026';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'NO_TOKEN_PROVIDED', message: 'Acceso no autorizado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.activo) {
      return res.status(403).json({ success: false, error: 'USUARIO_INACTIVO', message: 'Usuario inactivo o no encontrado' });
    }

    req.usuario = usuario;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'TOKEN_INVALIDO', message: 'Sesión inválida o expirada' });
  }
}

function requireAdmin(req, res, next) {
  if (req.usuario && req.usuario.rol === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ success: false, error: 'ACCESO_DENEGADO', message: 'Permiso denegado: Se requiere rol ADMINISTRADOR' });
}

module.exports = {
  authenticateToken,
  requireAdmin,
  JWT_SECRET
};
