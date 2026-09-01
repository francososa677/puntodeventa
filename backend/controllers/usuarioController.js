const usuarioService = require('../services/usuarioService');

async function getAll(req, res, next) {
  try {
    const usuarios = await usuarioService.getAllUsuarios();
    return res.json({ success: true, usuarios });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const usuario = await usuarioService.createUsuario(req.body, req.usuario.id);
    return res.status(201).json({ success: true, usuario });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const usuario = await usuarioService.updateUsuario(req.params.id, req.body, req.usuario.id);
    return res.json({ success: true, usuario });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  create,
  update
};
