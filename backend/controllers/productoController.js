const productoService = require('../services/productoService');

async function getAll(req, res, next) {
  try {
    const productos = await productoService.getAllProductos(req.query);
    return res.json({ success: true, productos });
  } catch (error) {
    next(error);
  }
}

async function getByCodigo(req, res, next) {
  try {
    const producto = await productoService.getProductoByCodigoBarras(req.params.codigo);
    if (!producto) {
      return res.status(404).json({ success: false, error: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado' });
    }
    return res.json({ success: true, producto });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const producto = await productoService.createProducto(req.body, req.usuario.id);
    return res.status(201).json({ success: true, producto });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const producto = await productoService.updateProducto(req.params.id, req.body, req.usuario.id);
    return res.json({ success: true, producto });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getByCodigo,
  create,
  update
};
