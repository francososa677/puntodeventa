const { sequelize, Producto } = require('../models');

const productosReales = [
  // Gaseosas y Bebidas
  { codigo_barras: '7790895000997', nombre: 'Gaseosa Coca Cola 1.5L', tipo_venta: 'UNITARIO', precio: 2200, stock_actual: 45, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790895006760', nombre: 'Gaseosa Coca Cola 2.25L', tipo_venta: 'UNITARIO', precio: 2900, stock_actual: 60, stock_minimo: 10, stock_maximo: 120 },
  { codigo_barras: '7790895064166', nombre: 'Gaseosa Coca Cola Zero 1.5L', tipo_venta: 'UNITARIO', precio: 2200, stock_actual: 30, stock_minimo: 5, stock_maximo: 80 },
  { codigo_barras: '7790895000218', nombre: 'Gaseosa Sprite 1.5L', tipo_venta: 'UNITARIO', precio: 2100, stock_actual: 35, stock_minimo: 8, stock_maximo: 90 },
  { codigo_barras: '7790895000317', nombre: 'Gaseosa Fanta Naranja 1.5L', tipo_venta: 'UNITARIO', precio: 2100, stock_actual: 25, stock_minimo: 5, stock_maximo: 80 },
  { codigo_barras: '7798132430032', nombre: 'Gaseosa Manaos Cola 2.25L', tipo_venta: 'UNITARIO', precio: 1200, stock_actual: 80, stock_minimo: 15, stock_maximo: 150 },
  { codigo_barras: '7798132430070', nombre: 'Gaseosa Manaos Guaraná 2.25L', tipo_venta: 'UNITARIO', precio: 1200, stock_actual: 50, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790150000207', nombre: 'Gaseosa Cunnington Cola 2.25L', tipo_venta: 'UNITARIO', precio: 1350, stock_actual: 40, stock_minimo: 10, stock_maximo: 100 },

  // Aguas y Jugos
  { codigo_barras: '7790315000059', nombre: 'Agua Villavicencio Sin Gas 1.5L', tipo_venta: 'UNITARIO', precio: 950, stock_actual: 70, stock_minimo: 15, stock_maximo: 150 },
  { codigo_barras: '7790315000103', nombre: 'Agua Villa del Sur Sin Gas 1.5L', tipo_venta: 'UNITARIO', precio: 900, stock_actual: 65, stock_minimo: 15, stock_maximo: 150 },
  { codigo_barras: '7790315001551', nombre: 'Agua Saborizada Levité Manzana 1.5L', tipo_venta: 'UNITARIO', precio: 1100, stock_actual: 40, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790315001568', nombre: 'Agua Saborizada Levité Naranja 1.5L', tipo_venta: 'UNITARIO', precio: 1100, stock_actual: 35, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790895007019', nombre: 'Agua Saborizada Aquarius Pomelo 1.5L', tipo_venta: 'UNITARIO', precio: 1150, stock_actual: 45, stock_minimo: 10, stock_maximo: 100 },

  // Cervezas y Bebidas Alcohólicas
  { codigo_barras: '7790070411510', nombre: 'Cerveza Quilmes Clásica 1L Retornable', tipo_venta: 'UNITARIO', precio: 1800, stock_actual: 50, stock_minimo: 12, stock_maximo: 120 },
  { codigo_barras: '7790070411541', nombre: 'Cerveza Quilmes Clásica 473ml Lata', tipo_venta: 'UNITARIO', precio: 1200, stock_actual: 90, stock_minimo: 24, stock_maximo: 200 },
  { codigo_barras: '7790070411602', nombre: 'Cerveza Brahma 1L Retornable', tipo_venta: 'UNITARIO', precio: 1750, stock_actual: 40, stock_minimo: 12, stock_maximo: 100 },
  { codigo_barras: '7790070411640', nombre: 'Cerveza Brahma 473ml Lata', tipo_venta: 'UNITARIO', precio: 1150, stock_actual: 85, stock_minimo: 24, stock_maximo: 180 },
  { codigo_barras: '7790070411701', nombre: 'Cerveza Stella Artois 730ml', tipo_venta: 'UNITARIO', precio: 2400, stock_actual: 30, stock_minimo: 6, stock_maximo: 60 },
  { codigo_barras: '7790790000108', nombre: 'Cerveza Heineken 1L', tipo_venta: 'UNITARIO', precio: 2700, stock_actual: 35, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7790100000011', nombre: 'Fernet Branca 750ml', tipo_venta: 'UNITARIO', precio: 8500, stock_actual: 25, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790100000028', nombre: 'Fernet Branca 450ml', tipo_venta: 'UNITARIO', precio: 5400, stock_actual: 15, stock_minimo: 4, stock_maximo: 40 },
  { codigo_barras: '7790100000059', nombre: 'Aperitivo Gancia Americano 950ml', tipo_venta: 'UNITARIO', precio: 3200, stock_actual: 20, stock_minimo: 5, stock_maximo: 40 },
  { codigo_barras: '7790100000097', nombre: 'Aperitivo Aperol 750ml', tipo_venta: 'UNITARIO', precio: 4500, stock_actual: 12, stock_minimo: 3, stock_maximo: 30 },
  { codigo_barras: '7790100000110', nombre: 'Aperitivo Campari 750ml', tipo_venta: 'UNITARIO', precio: 4800, stock_actual: 14, stock_minimo: 3, stock_maximo: 30 },

  // Galletitas, Alfajores y Snacks
  { codigo_barras: '7790040000010', nombre: 'Galletitas Chocolinas 250g', tipo_venta: 'UNITARIO', precio: 1100, stock_actual: 40, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7790040000027', nombre: 'Galletitas Criollitas 100g', tipo_venta: 'UNITARIO', precio: 650, stock_actual: 60, stock_minimo: 15, stock_maximo: 120 },
  { codigo_barras: '7790040000034', nombre: 'Galletitas Traviata 101g', tipo_venta: 'UNITARIO', precio: 650, stock_actual: 50, stock_minimo: 15, stock_maximo: 100 },
  { codigo_barras: '7790040000041', nombre: 'Galletitas Express 108g', tipo_venta: 'UNITARIO', precio: 700, stock_actual: 55, stock_minimo: 15, stock_maximo: 110 },
  { codigo_barras: '7790040000058', nombre: 'Galletitas Cerealitas 200g', tipo_venta: 'UNITARIO', precio: 950, stock_actual: 35, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7622300746056', nombre: 'Galletitas Oreo 118g', tipo_venta: 'UNITARIO', precio: 1050, stock_actual: 45, stock_minimo: 10, stock_maximo: 90 },
  { codigo_barras: '7622300746100', nombre: 'Galletitas Pepitos 119g', tipo_venta: 'UNITARIO', precio: 1050, stock_actual: 40, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7790040000065', nombre: 'Galletitas Sonrisas 108g', tipo_venta: 'UNITARIO', precio: 850, stock_actual: 30, stock_minimo: 8, stock_maximo: 70 },
  { codigo_barras: '7791230000015', nombre: 'Bizcochos Don Satur Grasa 200g', tipo_venta: 'UNITARIO', precio: 750, stock_actual: 70, stock_minimo: 20, stock_maximo: 150 },
  { codigo_barras: '7791230000022', nombre: 'Bizcochos Don Satur Salados 200g', tipo_venta: 'UNITARIO', precio: 750, stock_actual: 65, stock_minimo: 20, stock_maximo: 140 },
  { codigo_barras: '7790570000016', nombre: 'Bizcochos 9 de Oro Grasa 200g', tipo_venta: 'UNITARIO', precio: 800, stock_actual: 50, stock_minimo: 15, stock_maximo: 120 },
  { codigo_barras: '7790670000015', nombre: 'Alfajor Jorgito Chocolate 55g', tipo_venta: 'UNITARIO', precio: 600, stock_actual: 80, stock_minimo: 20, stock_maximo: 160 },
  { codigo_barras: '7790870000016', nombre: 'Alfajor Guaymallén Chocolate 38g', tipo_venta: 'UNITARIO', precio: 400, stock_actual: 100, stock_minimo: 30, stock_maximo: 200 },
  { codigo_barras: '7791000000015', nombre: 'Alfajor Capitán del Espacio Negro', tipo_venta: 'UNITARIO', precio: 750, stock_actual: 50, stock_minimo: 15, stock_maximo: 100 },
  { codigo_barras: '7790040000102', nombre: 'Chocolate Block Cofler 38g', tipo_venta: 'UNITARIO', precio: 900, stock_actual: 40, stock_minimo: 10, stock_maximo: 80 },

  // Almacén, Fideos y Arroz
  { codigo_barras: '7790070000011', nombre: 'Fideos Lucchetti Tallarín 500g', tipo_venta: 'UNITARIO', precio: 1100, stock_actual: 50, stock_minimo: 15, stock_maximo: 100 },
  { codigo_barras: '7790070000028', nombre: 'Fideos Matarazzo Spaghetti 500g', tipo_venta: 'UNITARIO', precio: 1300, stock_actual: 60, stock_minimo: 15, stock_maximo: 120 },
  { codigo_barras: '7790070000035', nombre: 'Fideos Matarazzo Mostachol 500g', tipo_venta: 'UNITARIO', precio: 1300, stock_actual: 45, stock_minimo: 12, stock_maximo: 100 },
  { codigo_barras: '7790070000042', nombre: 'Arroz Gallo Oro Parboil 1kg', tipo_venta: 'UNITARIO', precio: 2200, stock_actual: 40, stock_minimo: 10, stock_maximo: 90 },
  { codigo_barras: '7790272000011', nombre: 'Aceite Natura Girasol 900ml', tipo_venta: 'UNITARIO', precio: 2100, stock_actual: 50, stock_minimo: 12, stock_maximo: 100 },
  { codigo_barras: '7790272000028', nombre: 'Aceite Cocinero Girasol 900ml', tipo_venta: 'UNITARIO', precio: 1950, stock_actual: 40, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7790520000011', nombre: 'Mayonesa Hellmanns Doypack 475g', tipo_venta: 'UNITARIO', precio: 1650, stock_actual: 35, stock_minimo: 10, stock_maximo: 70 },
  { codigo_barras: '7790520000028', nombre: 'Ketchup Hellmanns Doypack 250g', tipo_venta: 'UNITARIO', precio: 1250, stock_actual: 25, stock_minimo: 8, stock_maximo: 60 },
  { codigo_barras: '7790520000035', nombre: 'Puré de Tomate Knorr Tetrabrik 520g', tipo_venta: 'UNITARIO', precio: 850, stock_actual: 70, stock_minimo: 20, stock_maximo: 140 },

  // Yerba y Lácteos
  { codigo_barras: '7790710000012', nombre: 'Yerba Mate Playadito 500g', tipo_venta: 'UNITARIO', precio: 2300, stock_actual: 50, stock_minimo: 15, stock_maximo: 100 },
  { codigo_barras: '7790710000029', nombre: 'Yerba Mate Playadito 1kg', tipo_venta: 'UNITARIO', precio: 4300, stock_actual: 35, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7790380000015', nombre: 'Yerba Mate Taragüí Con Palo 500g', tipo_venta: 'UNITARIO', precio: 2100, stock_actual: 40, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7798000000015', nombre: 'Yerba Mate CBSé Hierbas Serranas 500g', tipo_venta: 'UNITARIO', precio: 2000, stock_actual: 45, stock_minimo: 12, stock_maximo: 90 },
  { codigo_barras: '7790150001013', nombre: 'Leche La Serenísima Entera 1L', tipo_venta: 'UNITARIO', precio: 1450, stock_actual: 60, stock_minimo: 20, stock_maximo: 120 },
  { codigo_barras: '7790150001020', nombre: 'Leche La Serenísima Descremada 1L', tipo_venta: 'UNITARIO', precio: 1450, stock_actual: 40, stock_minimo: 15, stock_maximo: 100 },
  { codigo_barras: '7790150001037', nombre: 'Manteca La Serenísima 200g', tipo_venta: 'UNITARIO', precio: 2100, stock_actual: 30, stock_minimo: 8, stock_maximo: 60 },
  { codigo_barras: '7790150001044', nombre: 'Dulce de Leche La Serenísima Colonial 400g', tipo_venta: 'UNITARIO', precio: 1950, stock_actual: 35, stock_minimo: 10, stock_maximo: 70 },
  { codigo_barras: '7790150001051', nombre: 'Queso Crema Casancrem 290g', tipo_venta: 'UNITARIO', precio: 2200, stock_actual: 25, stock_minimo: 8, stock_maximo: 50 },

  // Limpieza e Higiene
  { codigo_barras: '7790010000011', nombre: 'Detergente Magistral Limón 500ml', tipo_venta: 'UNITARIO', precio: 1850, stock_actual: 40, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7790010000028', nombre: 'Jabón en Polvo Ala Ecológico 800g', tipo_venta: 'UNITARIO', precio: 2400, stock_actual: 30, stock_minimo: 8, stock_maximo: 60 },
  { codigo_barras: '7790010000035', nombre: 'Suavizante Vivere Clásico 900ml', tipo_venta: 'UNITARIO', precio: 1900, stock_actual: 25, stock_minimo: 6, stock_maximo: 50 },
  { codigo_barras: '7790010000042', nombre: 'Desinfectante Lysoform Aerosol 360ml', tipo_venta: 'UNITARIO', precio: 2300, stock_actual: 35, stock_minimo: 10, stock_maximo: 70 },
  { codigo_barras: '7790080000012', nombre: 'Papel Higiénico Higienol Export 4x30m', tipo_venta: 'UNITARIO', precio: 1750, stock_actual: 50, stock_minimo: 15, stock_maximo: 100 },
  { codigo_barras: '7790080000029', nombre: 'Rollo de Cocina Sussex 3x50', tipo_venta: 'UNITARIO', precio: 1600, stock_actual: 45, stock_minimo: 12, stock_maximo: 90 },
  { codigo_barras: '7790010000059', nombre: 'Shampoo Sedal Cerámidas 340ml', tipo_venta: 'UNITARIO', precio: 2200, stock_actual: 25, stock_minimo: 8, stock_maximo: 50 },
  { codigo_barras: '7790010000066', nombre: 'Desodorante Rexona Odorono Aerosol 150ml', tipo_venta: 'UNITARIO', precio: 2100, stock_actual: 30, stock_minimo: 10, stock_maximo: 60 },
  { codigo_barras: '7790010000073', nombre: 'Desodorante Axe Apollo Aerosol 150ml', tipo_venta: 'UNITARIO', precio: 2200, stock_actual: 28, stock_minimo: 8, stock_maximo: 55 },
  { codigo_barras: '7891030000015', nombre: 'Crema Dental Colgate Triple Acción 90g', tipo_venta: 'UNITARIO', precio: 1350, stock_actual: 40, stock_minimo: 10, stock_maximo: 80 },

  // Productos Pesables (por Kilo)
  { codigo_barras: '201', nombre: 'Jamón Cocido Paladini (x kg)', tipo_venta: 'PESABLE', precio: 8900, stock_actual: 12.5, stock_minimo: 2.0, stock_maximo: 30.0 },
  { codigo_barras: '202', nombre: 'Queso Muzzarella Barraza (x kg)', tipo_venta: 'PESABLE', precio: 7800, stock_actual: 18.0, stock_minimo: 3.0, stock_maximo: 40.0 },
  { codigo_barras: '203', nombre: 'Queso Tybo La Serenísima (x kg)', tipo_venta: 'PESABLE', precio: 8500, stock_actual: 15.0, stock_minimo: 2.5, stock_maximo: 35.0 },
  { codigo_barras: '204', nombre: 'Paleta Sanguchera Caldense (x kg)', tipo_venta: 'PESABLE', precio: 5600, stock_actual: 10.0, stock_minimo: 2.0, stock_maximo: 25.0 },
  { codigo_barras: '205', nombre: 'Salamín Picado Fino Paladini (x kg)', tipo_venta: 'PESABLE', precio: 11200, stock_actual: 8.5, stock_minimo: 1.5, stock_maximo: 20.0 },
  { codigo_barras: '206', nombre: 'Pan Francés (x kg)', tipo_venta: 'PESABLE', precio: 1800, stock_actual: 25.0, stock_minimo: 5.0, stock_maximo: 50.0 },
  { codigo_barras: '207', nombre: 'Facturas Surtidas (x Docena)', tipo_venta: 'UNITARIO', precio: 3800, stock_actual: 15, stock_minimo: 3, stock_maximo: 30 }
];

async function cargarSoloProductosReales() {
  try {
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await Producto.destroy({ where: {}, truncate: false });
    await sequelize.query('PRAGMA foreign_keys = ON;');
    console.log('🧹 Todos los productos sintéticos fueron eliminados de la base de datos.');

    let creados = 0;
    for (const prodData of productosReales) {
      await Producto.create({
        ...prodData,
        activo: true
      });
      creados++;
    }

    console.log(`=================================================`);
    console.log(`✨ ¡ÉXITO! Se cargaron únicamente ${creados} productos REALES en Stockio.`);
    console.log(`=================================================`);
  } catch (error) {
    console.error('❌ Error al cargar productos reales:', error);
  }
}

if (require.main === module) {
  cargarSoloProductosReales().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = cargarSoloProductosReales;
