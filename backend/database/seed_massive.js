const cargarSoloProductosReales = require('./seed_real_only');

if (require.main === module) {
  cargarSoloProductosReales().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = cargarSoloProductosReales;
