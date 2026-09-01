const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Producto, MedioPago, Promocion, PromocionProducto } = require('../models');

const productosArgentina = [
  // Gaseosas y Bebidas
  { codigo_barras: '7790895000997', nombre: 'Coca Cola Original 1.5L', tipo_venta: 'UNITARIO', precio: 2200.00, stock_actual: 45, stock_minimo: 10, stock_maximo: 120 },
  { codigo_barras: '7790895000027', nombre: 'Coca Cola Sin Azúcar 1.5L', tipo_venta: 'UNITARIO', precio: 2200.00, stock_actual: 30, stock_minimo: 8, stock_maximo: 100 },
  { codigo_barras: '7790895007002', nombre: 'Coca Cola Original 2.25L', tipo_venta: 'UNITARIO', precio: 2900.00, stock_actual: 60, stock_minimo: 12, stock_maximo: 150 },
  { codigo_barras: '7790895060014', nombre: 'Sprite Lima Limón 1.5L', tipo_venta: 'UNITARIO', precio: 2100.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 80 },
  { codigo_barras: '7790895010019', nombre: 'Fanta Naranja 1.5L', tipo_venta: 'UNITARIO', precio: 2100.00, stock_actual: 20, stock_minimo: 5, stock_maximo: 80 },
  { codigo_barras: '7791813000527', nombre: 'Manaos Cola 2.25L', tipo_venta: 'UNITARIO', precio: 1200.00, stock_actual: 80, stock_minimo: 15, stock_maximo: 200 },
  { codigo_barras: '7791813000602', nombre: 'Manaos Naranja 2.25L', tipo_venta: 'UNITARIO', precio: 1200.00, stock_actual: 50, stock_minimo: 10, stock_maximo: 150 },
  { codigo_barras: '7791813000725', nombre: 'Manaos Pomelo Blanco 2.25L', tipo_venta: 'UNITARIO', precio: 1200.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 120 },
  { codigo_barras: '7790070318626', nombre: 'Agua Mineral Villavicencio Sin Gas 1.5L', tipo_venta: 'UNITARIO', precio: 950.00, stock_actual: 90, stock_minimo: 20, stock_maximo: 200 },
  { codigo_barras: '7790070318657', nombre: 'Agua Mineral Villavicencio Con Gas 1.5L', tipo_venta: 'UNITARIO', precio: 950.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790070411808', nombre: 'Agua Mineral Villa del Sur Sin Gas 2L', tipo_venta: 'UNITARIO', precio: 1100.00, stock_actual: 70, stock_minimo: 15, stock_maximo: 180 },
  { codigo_barras: '7790070509017', nombre: 'Levité Manzana 1.5L', tipo_venta: 'UNITARIO', precio: 1400.00, stock_actual: 35, stock_minimo: 8, stock_maximo: 90 },
  { codigo_barras: '7790070509055', nombre: 'Levité Naranja 1.5L', tipo_venta: 'UNITARIO', precio: 1400.00, stock_actual: 30, stock_minimo: 8, stock_maximo: 90 },
  { codigo_barras: '7790895000000', nombre: 'Powerade Ion4 Naranja 500ml', tipo_venta: 'UNITARIO', precio: 1300.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 60 },
  
  // Cervezas y Bebidas Alcohólicas
  { codigo_barras: '7790400000010', nombre: 'Cerveza Quilmes Clásica 1L Retornable', tipo_venta: 'UNITARIO', precio: 2300.00, stock_actual: 100, stock_minimo: 20, stock_maximo: 250 },
  { codigo_barras: '7790400000218', nombre: 'Cerveza Quilmes Stout 473ml Lata', tipo_venta: 'UNITARIO', precio: 1450.00, stock_actual: 48, stock_minimo: 12, stock_maximo: 120 },
  { codigo_barras: '7790400205217', nombre: 'Cerveza Brahma Chopp 473ml Lata', tipo_venta: 'UNITARIO', precio: 1350.00, stock_actual: 72, stock_minimo: 24, stock_maximo: 200 },
  { codigo_barras: '7790400060014', nombre: 'Cerveza Stella Artois 473ml Lata', tipo_venta: 'UNITARIO', precio: 1850.00, stock_actual: 36, stock_minimo: 12, stock_maximo: 96 },
  { codigo_barras: '7790400070013', nombre: 'Cerveza Corona Extra 330ml Botella', tipo_venta: 'UNITARIO', precio: 1950.00, stock_actual: 24, stock_minimo: 6, stock_maximo: 72 },
  { codigo_barras: '7790045000014', nombre: 'Fernet Branca 750ml', tipo_venta: 'UNITARIO', precio: 11500.00, stock_actual: 18, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790045000021', nombre: 'Fernet Branca 450ml', tipo_venta: 'UNITARIO', precio: 7800.00, stock_actual: 12, stock_minimo: 4, stock_maximo: 30 },
  { codigo_barras: '7790045000502', nombre: 'Aperitivo Gancia Americano 950ml', tipo_venta: 'UNITARIO', precio: 4500.00, stock_actual: 15, stock_minimo: 4, stock_maximo: 40 },
  { codigo_barras: '7790045000601', nombre: 'Campari Aperitivo 750ml', tipo_venta: 'UNITARIO', precio: 6200.00, stock_actual: 10, stock_minimo: 3, stock_maximo: 30 },

  // Galletitas y Golosinas
  { codigo_barras: '7790040000010', nombre: 'Galletitas Chocolinas 250g', tipo_venta: 'UNITARIO', precio: 1100.00, stock_actual: 50, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790040001208', nombre: 'Galletitas Criollitas Clásicas 3x100g', tipo_venta: 'UNITARIO', precio: 1350.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 90 },
  { codigo_barras: '7790040002106', nombre: 'Galletitas Rumba 112g', tipo_venta: 'UNITARIO', precio: 750.00, stock_actual: 35, stock_minimo: 8, stock_maximo: 80 },
  { codigo_barras: '7790040003103', nombre: 'Galletitas Amor 112g', tipo_venta: 'UNITARIO', precio: 750.00, stock_actual: 30, stock_minimo: 8, stock_maximo: 80 },
  { codigo_barras: '7790040004100', nombre: 'Galletitas Mellizas 112g', tipo_venta: 'UNITARIO', precio: 750.00, stock_actual: 25, stock_minimo: 8, stock_maximo: 80 },
  { codigo_barras: '7790040005015', nombre: 'Bizcochos Don Satur Salados 200g', tipo_venta: 'UNITARIO', precio: 850.00, stock_actual: 65, stock_minimo: 15, stock_maximo: 150 },
  { codigo_barras: '7790040005022', nombre: 'Bizcochos Don Satur Dulces 200g', tipo_venta: 'UNITARIO', precio: 850.00, stock_actual: 60, stock_minimo: 15, stock_maximo: 150 },
  { codigo_barras: '7790040006012', nombre: 'Galletitas Traviata 3x101g', tipo_venta: 'UNITARIO', precio: 1250.00, stock_actual: 30, stock_minimo: 8, stock_maximo: 70 },
  { codigo_barras: '7790040007019', nombre: 'Galletitas Sonrisas Frambuesa 118g', tipo_venta: 'UNITARIO', precio: 820.00, stock_actual: 28, stock_minimo: 6, stock_maximo: 60 },
  { codigo_barras: '7790040008016', nombre: 'Galletitas Oreo Original 117g', tipo_venta: 'UNITARIO', precio: 1050.00, stock_actual: 45, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790040009013', nombre: 'Alfajor Jorgito Chocolate 6g', tipo_venta: 'UNITARIO', precio: 650.00, stock_actual: 90, stock_minimo: 20, stock_maximo: 200 },
  { codigo_barras: '7790040009020', nombre: 'Alfajor Jorgito Dulce de Leche 6g', tipo_venta: 'UNITARIO', precio: 650.00, stock_actual: 85, stock_minimo: 20, stock_maximo: 200 },
  { codigo_barras: '7790040009501', nombre: 'Alfajor Guaymallén Chocolate 38g', tipo_venta: 'UNITARIO', precio: 400.00, stock_actual: 120, stock_minimo: 30, stock_maximo: 300 },
  { codigo_barras: '7790040009518', nombre: 'Alfajor Guaymallén Dulce de Leche 38g', tipo_venta: 'UNITARIO', precio: 400.00, stock_actual: 110, stock_minimo: 30, stock_maximo: 300 },
  { codigo_barras: '7790040009525', nombre: 'Alfajor Havanna Mixto 60g', tipo_venta: 'UNITARIO', precio: 1500.00, stock_actual: 20, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790040009600', nombre: 'Chocolate Tofi Leche 28g', tipo_venta: 'UNITARIO', precio: 700.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 80 },
  { codigo_barras: '7790040009709', nombre: 'Oblea Bon o Bon Leche 15g', tipo_venta: 'UNITARIO', precio: 450.00, stock_actual: 100, stock_minimo: 20, stock_maximo: 200 },
  { codigo_barras: '7790040009808', nombre: 'Caramelos Butter Toffes Arcor 100g', tipo_venta: 'UNITARIO', precio: 980.00, stock_actual: 30, stock_minimo: 5, stock_maximo: 60 },

  // Almacén y Comestibles
  { codigo_barras: '7790070000019', nombre: 'Fideos Lucchetti Tallarín 500g', tipo_venta: 'UNITARIO', precio: 1200.00, stock_actual: 50, stock_minimo: 10, stock_maximo: 120 },
  { codigo_barras: '7790070000026', nombre: 'Fideos Lucchetti Mostachol 500g', tipo_venta: 'UNITARIO', precio: 1200.00, stock_actual: 45, stock_minimo: 10, stock_maximo: 120 },
  { codigo_barras: '7790070000101', nombre: 'Fideos Matarazzo Spaghetti 500g', tipo_venta: 'UNITARIO', precio: 1450.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790070000200', nombre: 'Fideos Marolio Guiseros 500g', tipo_venta: 'UNITARIO', precio: 890.00, stock_actual: 70, stock_minimo: 15, stock_maximo: 150 },
  { codigo_barras: '7790070001016', nombre: 'Arroz Lucchetti Parboil 1kg', tipo_venta: 'UNITARIO', precio: 2100.00, stock_actual: 35, stock_minimo: 8, stock_maximo: 80 },
  { codigo_barras: '7790070001023', nombre: 'Arroz Gallo Oro Parboil 1kg', tipo_venta: 'UNITARIO', precio: 2600.00, stock_actual: 30, stock_minimo: 8, stock_maximo: 80 },
  { codigo_barras: '7790070001030', nombre: 'Arroz Dos Hermanos Blanco 1kg', tipo_venta: 'UNITARIO', precio: 1950.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 90 },
  { codigo_barras: '7790070002013', nombre: 'Aceite de Girasol Natura 900ml', tipo_venta: 'UNITARIO', precio: 2400.00, stock_actual: 60, stock_minimo: 12, stock_maximo: 150 },
  { codigo_barras: '7790070002020', nombre: 'Aceite de Girasol Cocinero 900ml', tipo_venta: 'UNITARIO', precio: 2250.00, stock_actual: 50, stock_minimo: 10, stock_maximo: 120 },
  { codigo_barras: '7790070002037', nombre: 'Aceite de Oliva Cañuelas 500ml', tipo_venta: 'UNITARIO', precio: 6800.00, stock_actual: 15, stock_minimo: 4, stock_maximo: 40 },
  { codigo_barras: '7790070003010', nombre: 'Pure de Tomate Arcor tetra 520g', tipo_venta: 'UNITARIO', precio: 780.00, stock_actual: 80, stock_minimo: 20, stock_maximo: 200 },
  { codigo_barras: '7790070003027', nombre: 'Pure de Tomate Marolio tetra 520g', tipo_venta: 'UNITARIO', precio: 620.00, stock_actual: 90, stock_minimo: 20, stock_maximo: 220 },
  { codigo_barras: '7790070004017', nombre: 'Mayonesa Natura Doypack 500g', tipo_venta: 'UNITARIO', precio: 1750.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 90 },
  { codigo_barras: '7790070004024', nombre: 'Mayonesa Hellmanns Doypack 475g', tipo_venta: 'UNITARIO', precio: 2100.00, stock_actual: 35, stock_minimo: 8, stock_maximo: 80 },
  { codigo_barras: '7790070004109', nombre: 'Ketchup Natura Doypack 250g', tipo_venta: 'UNITARIO', precio: 1100.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 60 },
  { codigo_barras: '7790070004208', nombre: 'Mostaza Savora Doypack 250g', tipo_venta: 'UNITARIO', precio: 1250.00, stock_actual: 30, stock_minimo: 6, stock_maximo: 70 },
  { codigo_barras: '7790070005014', nombre: 'Yerba Mate Playadito 500g', tipo_venta: 'UNITARIO', precio: 2350.00, stock_actual: 70, stock_minimo: 15, stock_maximo: 180 },
  { codigo_barras: '7790070005021', nombre: 'Yerba Mate Taragüí Con Palo 500g', tipo_venta: 'UNITARIO', precio: 2150.00, stock_actual: 65, stock_minimo: 15, stock_maximo: 160 },
  { codigo_barras: '7790070005038', nombre: 'Yerba Mate Rosamonte Especial 500g', tipo_venta: 'UNITARIO', precio: 2450.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790070005045', nombre: 'Yerba Mate Mañanita 500g', tipo_venta: 'UNITARIO', precio: 1950.00, stock_actual: 45, stock_minimo: 10, stock_maximo: 110 },
  { codigo_barras: '7790070005052', nombre: 'Yerba Mate CBSé Hierbas Serranas 500g', tipo_venta: 'UNITARIO', precio: 2100.00, stock_actual: 50, stock_minimo: 10, stock_maximo: 120 },
  { codigo_barras: '7790070006011', nombre: 'Azúcar Ledesma Superior 1kg', tipo_venta: 'UNITARIO', precio: 1150.00, stock_actual: 100, stock_minimo: 25, stock_maximo: 250 },
  { codigo_barras: '7790070006028', nombre: 'Azúcar Chango 1kg', tipo_venta: 'UNITARIO', precio: 1100.00, stock_actual: 80, stock_minimo: 20, stock_maximo: 200 },
  { codigo_barras: '7790070007018', nombre: 'Sal Fina Celusal 500g Botella', tipo_venta: 'UNITARIO', precio: 920.00, stock_actual: 45, stock_minimo: 10, stock_maximo: 90 },
  { codigo_barras: '7790070007025', nombre: 'Sal Entrefina Dos Anclas 500g', tipo_venta: 'UNITARIO', precio: 880.00, stock_actual: 35, stock_minimo: 8, stock_maximo: 80 },

  // Lácteos y Refrigerados
  { codigo_barras: '7790080000010', nombre: 'Leche Entera La Serenísima sachet 1L', tipo_venta: 'UNITARIO', precio: 1350.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790080000027', nombre: 'Leche Descremada La Serenísima sachet 1L', tipo_venta: 'UNITARIO', precio: 1350.00, stock_actual: 35, stock_minimo: 8, stock_maximo: 90 },
  { codigo_barras: '7790080000102', nombre: 'Leche Larga Vida Ilolay Entera 1L', tipo_venta: 'UNITARIO', precio: 1450.00, stock_actual: 60, stock_minimo: 12, stock_maximo: 120 },
  { codigo_barras: '7790080001017', nombre: 'Yogur Entero Tregar Frutilla 160g', tipo_venta: 'UNITARIO', precio: 720.00, stock_actual: 30, stock_minimo: 6, stock_maximo: 60 },
  { codigo_barras: '7790080001024', nombre: 'Yogur Firmable La Serenísima Vainilla 120g', tipo_venta: 'UNITARIO', precio: 680.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790080002014', nombre: 'Manteca La Serenísima 200g', tipo_venta: 'UNITARIO', precio: 2400.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 60 },
  { codigo_barras: '7790080002021', nombre: 'Manteca Sancor 200g', tipo_venta: 'UNITARIO', precio: 2300.00, stock_actual: 20, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790080003011', nombre: 'Dulce de Leche La Serenísima Estilo Colonial 400g', tipo_venta: 'UNITARIO', precio: 2200.00, stock_actual: 30, stock_minimo: 6, stock_maximo: 70 },
  { codigo_barras: '7790080003028', nombre: 'Dulce de Leche Sancor Tradicional 400g', tipo_venta: 'UNITARIO', precio: 1980.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 60 },
  { codigo_barras: '7790080003035', nombre: 'Dulce de Leche Milkaut 400g', tipo_venta: 'UNITARIO', precio: 2100.00, stock_actual: 20, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790080004018', nombre: 'Queso Casancrem Clásico 290g pot', tipo_venta: 'UNITARIO', precio: 2550.00, stock_actual: 22, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790080004025', nombre: 'Queso Finlandia Clásico 200g pot', tipo_venta: 'UNITARIO', precio: 2300.00, stock_actual: 18, stock_minimo: 4, stock_maximo: 40 },

  // Fiambres y Pesables por Kilo
  { codigo_barras: '201', nombre: 'Queso Tybo Muzzarella (Fiambre en barra)', tipo_venta: 'PESABLE', precio: 7900.00, stock_actual: 12.4, stock_minimo: 2.0, stock_maximo: 30.0 },
  { codigo_barras: '202', nombre: 'Queso Sardo Estacionado (Horma)', tipo_venta: 'PESABLE', precio: 11200.00, stock_actual: 8.5, stock_minimo: 1.5, stock_maximo: 20.0 },
  { codigo_barras: '203', nombre: 'Queso Roquefort / Azul (Kilo)', tipo_venta: 'PESABLE', precio: 13800.00, stock_actual: 4.2, stock_minimo: 1.0, stock_maximo: 15.0 },
  { codigo_barras: '204', nombre: 'Jamón Cocido de Primera (Paladini)', tipo_venta: 'PESABLE', precio: 9800.00, stock_actual: 15.0, stock_minimo: 3.0, stock_maximo: 35.0 },
  { codigo_barras: '205', nombre: 'Paleta Sanguchera Especial (Caldense)', tipo_venta: 'PESABLE', precio: 5400.00, stock_actual: 18.2, stock_minimo: 4.0, stock_maximo: 40.0 },
  { codigo_barras: '206', nombre: 'Salamín Picado Fino (Candeal)', tipo_venta: 'PESABLE', precio: 12500.00, stock_actual: 6.8, stock_minimo: 1.5, stock_maximo: 25.0 },
  { codigo_barras: '207', nombre: 'Salchichón con Jamón (Friboi)', tipo_venta: 'PESABLE', precio: 4900.00, stock_actual: 9.0, stock_minimo: 2.0, stock_maximo: 25.0 },
  { codigo_barras: '208', nombre: 'Mortadela Tapalqué Especial', tipo_venta: 'PESABLE', precio: 5100.00, stock_actual: 11.5, stock_minimo: 2.5, stock_maximo: 30.0 },
  { codigo_barras: '209', nombre: 'Bondiola Estacionada Artesanal', tipo_venta: 'PESABLE', precio: 16200.00, stock_actual: 5.1, stock_minimo: 1.0, stock_maximo: 18.0 },
  { codigo_barras: '210', nombre: 'Panceta Ahumada Laminada', tipo_venta: 'PESABLE', precio: 14800.00, stock_actual: 7.3, stock_minimo: 1.5, stock_maximo: 20.0 },

  // Limpieza del Hogar
  { codigo_barras: '7790090000010', nombre: 'Detergente Magistral Multiuso Limón 500ml', tipo_venta: 'UNITARIO', precio: 1950.00, stock_actual: 40, stock_minimo: 8, stock_maximo: 90 },
  { codigo_barras: '7790090000027', nombre: 'Detergente Ala Limón Concentrado 500ml', tipo_venta: 'UNITARIO', precio: 1650.00, stock_actual: 35, stock_minimo: 8, stock_maximo: 80 },
  { codigo_barras: '7790090001017', nombre: 'Jabón en Polvo Ala Multiacción 800g', tipo_venta: 'UNITARIO', precio: 2800.00, stock_actual: 30, stock_minimo: 6, stock_maximo: 70 },
  { codigo_barras: '7790090001024', nombre: 'Jabón Líquido Skip Inteligente Doypack 800ml', tipo_venta: 'UNITARIO', precio: 3400.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 60 },
  { codigo_barras: '7790090001031', nombre: 'Jabón Líquido Ariel Doypack 800ml', tipo_venta: 'UNITARIO', precio: 3300.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 60 },
  { codigo_barras: '7790090002014', nombre: 'Suavizante Vivere Clásico Doypack 900ml', tipo_venta: 'UNITARIO', precio: 2200.00, stock_actual: 28, stock_minimo: 6, stock_maximo: 70 },
  { codigo_barras: '7790090003011', nombre: 'Lavandina Ayudín Clásica 1L', tipo_venta: 'UNITARIO', precio: 950.00, stock_actual: 60, stock_minimo: 15, stock_maximo: 150 },
  { codigo_barras: '7790090003028', nombre: 'Lavandina Querubín Máxima Pureza 1L', tipo_venta: 'UNITARIO', precio: 890.00, stock_actual: 50, stock_minimo: 12, stock_maximo: 120 },
  { codigo_barras: '7790090004018', nombre: 'Limpiador de Pisos Poett Primavera 900ml', tipo_venta: 'UNITARIO', precio: 1250.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 90 },
  { codigo_barras: '7790090004025', nombre: 'Limpiador de Pisos Procenex Lavanda 900ml', tipo_venta: 'UNITARIO', precio: 1180.00, stock_actual: 35, stock_minimo: 8, stock_maximo: 80 },
  { codigo_barras: '7790090005015', nombre: 'Rollo de Cocina Sussex 3x50 paños', tipo_venta: 'UNITARIO', precio: 1650.00, stock_actual: 45, stock_minimo: 10, stock_maximo: 100 },
  { codigo_barras: '7790090005022', nombre: 'Papel Higiénico Higienol Rinde Más 4x30m', tipo_venta: 'UNITARIO', precio: 2100.00, stock_actual: 50, stock_minimo: 12, stock_maximo: 120 },

  // Cuidado Personal y Perfumería
  { codigo_barras: '7790100000010', nombre: 'Shampoo Sedal Ceramidas 340ml', tipo_venta: 'UNITARIO', precio: 2400.00, stock_actual: 20, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790100000027', nombre: 'Acondicionador Sedal Ceramidas 340ml', tipo_venta: 'UNITARIO', precio: 2400.00, stock_actual: 18, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790100000102', nombre: 'Shampoo Dove Reconstrucción Completa 400ml', tipo_venta: 'UNITARIO', precio: 3200.00, stock_actual: 15, stock_minimo: 4, stock_maximo: 40 },
  { codigo_barras: '7790100001017', nombre: 'Jabón de Tocador Rexona Odorono 3x90g', tipo_venta: 'UNITARIO', precio: 1850.00, stock_actual: 30, stock_minimo: 6, stock_maximo: 70 },
  { codigo_barras: '7790100001024', nombre: 'Jabón de Tocador Lux Suavidad 3x125g', tipo_venta: 'UNITARIO', precio: 1950.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 60 },
  { codigo_barras: '7790100002014', nombre: 'Desodorante Axe Aerosol Black 150ml', tipo_venta: 'UNITARIO', precio: 2900.00, stock_actual: 25, stock_minimo: 5, stock_maximo: 60 },
  { codigo_barras: '7790100002021', nombre: 'Desodorante Rexona Men Aerosol V8 150ml', tipo_venta: 'UNITARIO', precio: 2950.00, stock_actual: 22, stock_minimo: 5, stock_maximo: 50 },
  { codigo_barras: '7790100003011', nombre: 'Crema Dental Colgate Total 12 90g', tipo_venta: 'UNITARIO', precio: 1950.00, stock_actual: 40, stock_minimo: 10, stock_maximo: 90 },
  { codigo_barras: '7790100003028', nombre: 'Crema Dental Odolito Infantil 50g', tipo_venta: 'UNITARIO', precio: 1200.00, stock_actual: 20, stock_minimo: 4, stock_maximo: 50 }
];

async function seedMasivo() {
  try {
    try {
      await sequelize.query('ALTER TABLE productos ADD COLUMN stock_maximo DECIMAL(10,3) DEFAULT 100;');
    } catch (e) {
      // Column exists
    }
    await sequelize.sync({ force: false });

    console.log('🔄 Importando catálogo masivo de productos de Argentina...');

    let creados = 0;
    let actualizados = 0;

    for (const prodData of productosArgentina) {
      const [prod, created] = await Producto.findOrCreate({
        where: { codigo_barras: prodData.codigo_barras },
        defaults: {
          ...prodData,
          activo: true
        }
      });

      if (!created) {
        prod.nombre = prodData.nombre;
        prod.precio = prodData.precio;
        prod.tipo_venta = prodData.tipo_venta;
        prod.stock_actual = prodData.stock_actual;
        prod.stock_minimo = prodData.stock_minimo;
        prod.stock_maximo = prodData.stock_maximo;
        prod.activo = true;
        await prod.save();
        actualizados++;
      } else {
        creados++;
      }
    }

    console.log(`✅ Carga masiva completada exitosamente:`);
    console.log(`   - Productos nuevos creados: ${creados}`);
    console.log(`   - Productos existentes actualizados: ${actualizados}`);
    console.log(`   - Total productos en catálogo: ${productosArgentina.length}`);

  } catch (error) {
    console.error('❌ Error durante la carga masiva:', error);
  }
}

if (require.main === module) {
  seedMasivo().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seedMasivo;
