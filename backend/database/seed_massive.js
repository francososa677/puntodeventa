const { sequelize, Producto } = require('../models');

// Helper to compute valid EAN-13 check digit
function generateEAN13(seqNumber) {
  const base = '779' + String(seqNumber).padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
}

// Categories & Variants generator
const catalogTemplates = [
  // 1. Gaseosas (Soda)
  {
    brands: ['Coca Cola', 'Sprite', 'Fanta', 'Manaos', 'Secco', 'Pritty', 'Cunnington', 'Seven Up', 'Pepsi', 'Mirinda', 'Paso de los Toros'],
    flavors: ['Original', 'Sin Azúcar', 'Zero', 'Light', 'Lima Limón', 'Naranja', 'Pomelo', 'Manzana', 'Tónica'],
    sizes: ['354ml Lata', '500ml Botella', '1.5L Botella', '2.25L Botella', '3L Botella'],
    basePrice: 1200,
    tipo: 'UNITARIO'
  },
  // 2. Aguas y Jugos
  {
    brands: ['Villavicencio', 'Villa del Sur', 'Glaciar', 'Kin', 'Brio', 'Levité', 'Aquarius', 'Terma', 'Baggio', 'BC La Campagnola', 'Cepita'],
    flavors: ['Sin Gas', 'Con Gas', 'Manzana', 'Naranja', 'Pomelo', 'Pera', 'Durazno', 'Multifruta', 'Ananá'],
    sizes: ['500ml', '1.5L', '2L', '6L Bidón'],
    basePrice: 850,
    tipo: 'UNITARIO'
  },
  // 3. Cervezas
  {
    brands: ['Quilmes', 'Brahma', 'Schneider', 'Imperial', 'Stella Artois', 'Heineken', 'Corona', 'Andes Origen', 'Patagonia', 'Amstel', 'Isenbeck'],
    flavors: ['Clásica', 'Stout', 'Red Lager', 'IPA', 'Golden', 'Amber Lager', 'Sin Alcohol', 'Rubia', 'Negra'],
    sizes: ['473ml Lata', '710ml Botella', '1L Retornable', '330ml Porrón'],
    basePrice: 1600,
    tipo: 'UNITARIO'
  },
  // 4. Vinos y Espumantes
  {
    brands: ['Novecento', 'Benjamin', 'Dadá', 'Emilia', 'Nieto Senetiner', 'Trumpeter', 'Rutini', 'Uvita', 'Termidor', 'Finca Las Moras', 'Norton'],
    flavors: ['Malbec', 'Cabernet Sauvignon', 'Chardonnay', 'Torrontés', 'Syrah', 'Rosado', 'Tinto Dulce', 'Tetra 1L'],
    sizes: ['750ml', '1.125L', '1L Tetra'],
    basePrice: 2800,
    tipo: 'UNITARIO'
  },
  // 5. Bebidas Espirituosas
  {
    brands: ['Fernet Branca', 'Fernet 1882', 'Gancia Americano', 'Campari', 'Aperol', 'Smirnoff', 'Absolut', 'Jägermeister', 'Skyy', 'Bols'],
    flavors: ['Tradicional', 'Menta', 'Citrus', 'Manzana', 'Raspberry', 'Maracuyá'],
    sizes: ['450ml', '750ml', '1L'],
    basePrice: 7500,
    tipo: 'UNITARIO'
  },
  // 6. Galletitas Dulces y Saladas
  {
    brands: ['Chocolinas', 'Criollitas', 'Traviata', 'Express', 'Cerealitas', 'Oreo', 'Pepitos', 'Rumba', 'Amor', 'Mellizas', 'Sonrisas', 'Formis', 'Maná', 'Don Satur', '9 de Oro', 'Sol Serrano', 'Lincoln', 'Opera', 'Rhodesia', 'Tita'],
    flavors: ['Clásicas', 'Chocolate', 'Saladas', 'Dulces', 'Frutilla', 'Vainilla', 'Sin Sal', 'Integrales', 'Rellenas'],
    sizes: ['100g', '150g', '200g', '250g', '3x100g Pack'],
    basePrice: 900,
    tipo: 'UNITARIO'
  },
  // 7. Alfajores y Chocolates
  {
    brands: ['Jorgito', 'Guaymallén', 'Fantoche', 'Capitán del Espacio', 'Havanna', 'Terrabusi', 'Tofi', 'Bon o Bon', 'Suchard', 'Shot', 'Cadbury', 'Milka', 'Cofler', 'Block', 'Aguila', 'Hamlet'],
    flavors: ['Chocolate', 'Dulce de Leche', 'Blanco', 'Triple', 'Glaseado', 'Nuez', 'Mousse', 'Maní', 'Semi Amargo'],
    sizes: ['38g', '50g', '60g', '75g Triple', '100g Tableta'],
    basePrice: 700,
    tipo: 'UNITARIO'
  },
  // 8. Fideos y Pastas Secas
  {
    brands: ['Lucchetti', 'Matarazzo', 'Don Vicente', 'Favorita', 'Knorr', 'Marolio', 'Canale', 'Terrabusi', 'Giacomo'],
    flavors: ['Tallarín', 'Spaghetti', 'Mostachol', 'Fusilli', 'Tirabuzón', 'Moñito', 'Nido', 'Cabello de Ángel', 'Lasagna'],
    sizes: ['500g', '1kg'],
    basePrice: 1150,
    tipo: 'UNITARIO'
  },
  // 9. Arroz y Legumbres
  {
    brands: ['Gallo Oro', 'Lucchetti', 'Dos Hermanos', 'Gallo', 'Supremo', 'Marolio', 'Ala'],
    flavors: ['Parboil', 'Largo Fino', 'Doble Carolina', 'Koshihikari', 'Lentejas 400g', 'Garbanzos 400g', 'Porotos 400g'],
    sizes: ['500g', '1kg'],
    basePrice: 1800,
    tipo: 'UNITARIO'
  },
  // 10. Aceites y Vinagres
  {
    brands: ['Natura', 'Cocinero', 'Cañuelas', 'Marolio', 'Sojola', 'Dánica', 'Mazola', 'Lira', 'Oliovita'],
    flavors: ['Girasol', 'Mezcla', 'Oliva Extra Virgen', 'Maíz', 'Vinagre de Vino', 'Vinagre de Manzana', 'Aceto Balsámico'],
    sizes: ['500ml', '900ml', '1.5L', '5L Bidón'],
    basePrice: 2400,
    tipo: 'UNITARIO'
  },
  // 11. Condimentos, Salsas y Aderezos
  {
    brands: ['Hellmanns', 'Natura', 'Savora', 'Danica', 'Heinz', 'Knorr', 'Alicante', 'Dos Anclas', 'Celusal', 'Arcor', 'Marolio'],
    flavors: ['Mayonesa', 'Ketchup', 'Mostaza', 'Salsa de Tomate', 'Puré de Tomate', 'Salsa Golf', 'Chimichurri', 'Provenzal', 'Orégano 25g', 'Pimentón 25g', 'Ají Molido 25g', 'Sal Fina 500g', 'Sal Entrefina 500g', 'Sal Gruesa 1kg'],
    sizes: ['250g', '500g', '1kg', 'Doypack 475g'],
    basePrice: 1100,
    tipo: 'UNITARIO'
  },
  // 12. Yerbas, Cafés y Tés
  {
    brands: ['Playadito', 'Taragüí', 'Rosamonte', 'Mañanita', 'CBSé', 'La Merced', 'Cruz de Malta', 'Amanda', 'Union', 'Nescafé', 'La Virginia', 'Cabrales', 'Dolca', 'Taragüí Té'],
    flavors: ['Con Palo', 'Sin Palo', 'Hierbas Serranas', 'Menta y Limón', 'Naranja', 'Despalada', 'Suave', 'Selección Especial', 'Instantáneo 100g', 'Molido 250g', 'Saquitos x50'],
    sizes: ['250g', '500g', '1kg'],
    basePrice: 2200,
    tipo: 'UNITARIO'
  },
  // 13. Lácteos y Yogures
  {
    brands: ['La Serenísima', 'Sancor', 'Ilolay', 'Milkaut', 'Tregar', 'Barraza', 'Santa Rosa', 'Veronica', 'Casancrem', 'Finlandia', 'Mendicrim', 'Activia', 'Danonino'],
    flavors: ['Entera 1L', 'Descremada 1L', 'Larga Vida 1L', 'Chocolatada 1L', 'Manteca 200g', 'Dulce de Leche Colonial 400g', 'Dulce de Leche Repostero 400g', 'Yogur Frutilla 160g', 'Yogur Vainilla 160g', 'Queso Crema 290g', 'Queso Untable 200g'],
    sizes: ['160g', '200g', '290g', '400g', '1L'],
    basePrice: 1650,
    tipo: 'UNITARIO'
  },
  // 14. Limpieza del Hogar
  {
    brands: ['Magistral', 'Ala', 'Skip', 'Ariel', 'Drive', 'Gigante', 'Querubín', 'Ayudín', 'Zorro', 'Vivere', 'Downy', 'Poett', 'Procenex', 'Lysoform', 'Raid', 'Fuyi', 'Cif', 'Mr. Músculo'],
    flavors: ['Limón 500ml', 'Marina 500ml', 'Lavanda 900ml', 'Primavera 900ml', 'Jabón Polvo 800g', 'Jabón Líquido 800ml', 'Suavizante 900ml', 'Lavandina 1L', 'Desinfectante Aerosol 360ml', 'Insecticida 360ml', 'Crema Limpiadora 500g'],
    sizes: ['360ml', '500ml', '800g', '900ml', '1L', '3L'],
    basePrice: 1900,
    tipo: 'UNITARIO'
  },
  // 15. Papelería y Descartables
  {
    brands: ['Higienol', 'Elite', 'Sussex', 'Campanita', 'Felpita', 'Cottonelle', 'Pampers', 'Huggies', 'Babysec', 'Nosotras', 'Siempre Libre', 'Ladysoft'],
    flavors: ['Rollo Cocina 3x50', 'Papel Higiénico 4x30m', 'Papel Higiénico 4x80m', 'Pañales M x20', 'Pañales G x18', 'Pañales XG x16', 'Toallitas Femeninas x8', 'Protectores Diarios x20'],
    sizes: ['Pack x3', 'Pack x4', 'Pack x8', 'Pack x20'],
    basePrice: 2300,
    tipo: 'UNITARIO'
  },
  // 16. Cuidado Personal
  {
    brands: ['Sedal', 'Dove', 'Pantene', 'Head & Shoulders', 'Tresemmé', 'Garnier Fructis', 'Lux', 'Rexona', 'Axe', 'Old Spice', 'Nivea', 'Colgate', 'Odol', 'Oral-B', 'Listerine', 'Gillette', 'Bic'],
    flavors: ['Shampoo 340ml', 'Acondicionador 340ml', 'Jabón Tocador x3', 'Desodorante Aerosol 150ml', 'Desodorante Roll-on 50ml', 'Crema Dental 90g', 'Enjuague Bucal 500ml', 'Máquina de Afeitar x2'],
    sizes: ['50ml', '90g', '150ml', '340ml', '500ml'],
    basePrice: 2100,
    tipo: 'UNITARIO'
  },
  // 17. Fiambres y Quesos (Pesables por Kilo)
  {
    brands: ['Paladini', 'Caldense', 'Candeal', 'Tapalqué', 'Friboi', 'Bologna', 'La Serenísima', 'Sancor', 'Santa Rosa', 'Tregar'],
    flavors: ['Jamón Cocido Especial', 'Jamón Crudo Serrano', 'Paleta Sanguchera', 'Queso Muzzarella', 'Queso Tybo', 'Queso Gouda', 'Queso Sardo', 'Queso Roquefort', 'Salamín Picado Fino', 'Salamín Picado Grueso', 'Bondiola Ahumada', 'Panceta Salada', 'Salchichón con Jamón', 'Mortadela Tapalqué', 'Lomito Horneado'],
    sizes: ['x Kilo (Fraccionado)'],
    basePrice: 8500,
    tipo: 'PESABLE'
  }
];

async function generarBaseDatosGigante() {
  try {
    try {
      await sequelize.query('ALTER TABLE productos ADD COLUMN stock_maximo DECIMAL(10,3) DEFAULT 100;');
    } catch (e) {}

    await sequelize.sync({ force: false });

    console.log('🚀 Generando catálogo masivo de miles de productos argentinos...');

    const productosAAgregar = [];
    let seq = 1000;

    for (const category of catalogTemplates) {
      for (const brand of category.brands) {
        for (const flavor of category.flavors) {
          for (const size of category.sizes) {
            seq++;
            const ean = generateEAN13(seq);
            const nombre = `${brand} ${flavor} ${size}`;
            
            // Random variation in price & stock for realistic look
            const priceVariation = 0.85 + Math.random() * 0.4;
            const precio = Math.round((category.basePrice * priceVariation) / 10) * 10;
            
            const isPesable = category.tipo === 'PESABLE';
            const stock_actual = isPesable ? Math.round((2 + Math.random() * 25) * 10) / 10 : Math.floor(10 + Math.random() * 120);
            const stock_minimo = isPesable ? 2.0 : 5;
            const stock_maximo = isPesable ? 30.0 : 100;

            productosAAgregar.push({
              codigo_barras: ean,
              nombre,
              tipo_venta: category.tipo,
              precio,
              stock_actual,
              stock_minimo,
              stock_maximo,
              activo: true
            });
          }
        }
      }
    }

    console.log(`📦 Preparando para insertar ${productosAAgregar.length} productos en la base de datos...`);

    // Insert in chunks of 500
    const chunkSize = 500;
    let creadosTotal = 0;

    for (let i = 0; i < productosAAgregar.length; i += chunkSize) {
      const chunk = productosAAgregar.slice(i, i + chunkSize);
      
      for (const prodData of chunk) {
        const [prod, created] = await Producto.findOrCreate({
          where: { codigo_barras: prodData.codigo_barras },
          defaults: prodData
        });
        if (created) creadosTotal++;
      }
      console.log(`   ⏳ Procesados ${Math.min(i + chunkSize, productosAAgregar.length)} de ${productosAAgregar.length} productos...`);
    }

    const totalEnBD = await Producto.count();

    console.log(`=================================================`);
    console.log(`🎉 ¡ÉXITO TOTAL! Base de datos de productos cargada.`);
    console.log(`   - Nuevos productos insertados: ${creadosTotal}`);
    console.log(`   - Total acumulado en catálogo Stockio: ${totalEnBD} productos`);
    console.log(`=================================================`);

  } catch (error) {
    console.error('❌ Error al generar dataset gigante:', error);
  }
}

if (require.main === module) {
  generarBaseDatosGigante().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = generarBaseDatosGigante;
