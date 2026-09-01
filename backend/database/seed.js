const bcrypt = require('bcryptjs');
const { sequelize, Usuario, MedioPago } = require('../models');

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

  console.log('Database seed completed!');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
