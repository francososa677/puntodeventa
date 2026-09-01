const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Producto, MedioPago, Promocion, PromocionProducto } = require('../models');

async function seed() {
  try {
    await sequelize.query('ALTER TABLE productos ADD COLUMN stock_maximo DECIMAL(10,3) DEFAULT 100;');
  } catch (e) {
    // Column already exists
  }
  await sequelize.sync({ force: false });

  // 1. Usuarios
  const adminPassHash = await bcrypt.hash('admin123', 10);
  const adminExists = await Usuario.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    await Usuario.create({
      nombre: 'Administrador Principal',
      username: 'admin',
      password_hash: adminPassHash,
      rol: 'ADMIN',
      activo: true
    });
    console.log('✔ Usuario admin creado (admin / admin123)');
  } else {
    adminExists.password_hash = adminPassHash;
    adminExists.activo = true;
    await adminExists.save();
    console.log('✔ Usuario admin actualizado (admin / admin123)');
  }

  const empleadoPassHash = await bcrypt.hash('empleado123', 10);
  const empleadoExists = await Usuario.findOne({ where: { username: 'empleado' } });
  if (!empleadoExists) {
    await Usuario.create({
      nombre: 'Empleado Mostrador',
      username: 'empleado',
      password_hash: empleadoPassHash,
      rol: 'EMPLEADO',
      activo: true
    });
    console.log('✔ Usuario empleado creado (empleado / empleado123)');
  } else {
    empleadoExists.password_hash = empleadoPassHash;
    empleadoExists.activo = true;
    await empleadoExists.save();
    console.log('✔ Usuario empleado actualizado (empleado / empleado123)');
  }

  // 2. Medios de Pago
  const countMedios = await MedioPago.count();
  if (countMedios === 0) {
    await MedioPago.bulkCreate([
      { nombre: 'Efectivo', es_efectivo: true, activo: true },
      { nombre: 'Tarjeta Débito', es_efectivo: false, activo: true },
      { nombre: 'Tarjeta Crédito', es_efectivo: false, activo: true },
      { nombre: 'Transferencia', es_efectivo: false, activo: true }
    ]);
    console.log('✔ Medios de pago iniciales creados');
  }

  // 3. Productos Semilla (Unitarios y Pesables)
  const countProductos = await Producto.count();
  if (countProductos === 0) {
    const p1 = await Producto.create({
      codigo_barras: '7791234567890',
      nombre: 'Coca Cola 1.5L',
      tipo_venta: 'UNITARIO',
      precio: 1800.00,
      stock_actual: 50,
      stock_minimo: 10,
      stock_maximo: 100,
      activo: true
    });

    const p2 = await Producto.create({
      codigo_barras: '7799876543210',
      nombre: 'Galletitas Chocolinas 250g',
      tipo_venta: 'UNITARIO',
      precio: 950.00,
      stock_actual: 40,
      stock_minimo: 5,
      stock_maximo: 80,
      activo: true
    });

    const p3 = await Producto.create({
      codigo_barras: '20',
      nombre: 'Jamón Crudo (Fiambre)',
      tipo_venta: 'PESABLE',
      precio: 14500.00, // Precio por kilo
      stock_actual: 5.500, // 5.5 kg
      stock_minimo: 1.000,
      stock_maximo: 20.000,
      activo: true
    });

    const p4 = await Producto.create({
      codigo_barras: '21',
      nombre: 'Queso Cremoso (Fiambre)',
      tipo_venta: 'PESABLE',
      precio: 8900.00, // Precio por kilo
      stock_actual: 10.200, // 10.2 kg
      stock_minimo: 2.000,
      stock_maximo: 30.000,
      activo: true
    });

    console.log('✔ Productos semilla creados');

    // 4. Promoción Semilla
    const promo = await Promocion.create({
      nombre: 'Combo Merienda (Coca + Chocolinas)',
      codigo_barras: '999000111',
      precio_promocional: 2400.00,
      activa: true
    });

    await PromocionProducto.create({
      promocion_id: promo.id,
      producto_id: p1.id,
      cantidad: 1
    });

    await PromocionProducto.create({
      promocion_id: promo.id,
      producto_id: p2.id,
      cantidad: 1
    });

    console.log('✔ Promoción semilla creada');
  }

  console.log('Database seed completed!');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
