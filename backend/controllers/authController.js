const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos' });
    }
    const result = await authService.login(username, password);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout(req.usuario.id);
    return res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res) {
  return res.json({
    success: true,
    usuario: {
      id: req.usuario.id,
      nombre: req.usuario.nombre,
      username: req.usuario.username,
      rol: req.usuario.rol
    }
  });
}

module.exports = {
  login,
  logout,
  getMe
};
