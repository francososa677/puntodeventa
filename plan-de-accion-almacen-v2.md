# Plan de Acción v2 — Sistema de Gestión de Almacén y Punto de Venta

Este documento reemplaza y extiende al Plan de Acción original y al documento de Flujo Transaccional de Venta. Es autocontenido: un agente puede construir el sistema completo usando únicamente este documento.

## Resumen de cambios respecto a la v1

**Agregado (apartados nuevos):**
- Devoluciones y anulaciones de venta.
- Apertura y cierre de caja (arqueo).
- Productos por peso/fracción (con código interno y cálculo importe ↔ kg).
- Promociones (combos de varios productos a un precio fijo).
- Módulo de Configuración, con Medios de Pago como su primer contenido activable/desactivable.

**Modificado:**
- Modelo de datos: `Producto`, `Venta`, `DetalleVenta`, `MovimientoStock`, `Auditoria`.
- Flujo transaccional de venta: ahora contempla productos por peso, promociones, medio de pago y caja abierta.
- Roles: se agregan permisos para las funcionalidades nuevas.
- Interfaz: se define un estilo visual concreto (shadcn/ui + estética Linear) y un principio de ocultamiento de complejidad.

**Fuera de alcance (decisión explícita, no implementar):**
- Tipo de dato específico para dinero, zona horaria, categorías/proveedor de producto, backups de base de datos, recuperación de acceso admin, expiración de sesión. Ver sección 26.

---

# 1. Objetivo del proyecto

Desarrollar una aplicación local de gestión para un pequeño almacén/kiosco.

El sistema será **monousuario** y estará diseñado para ejecutarse en una única computadora con Windows.

La aplicación debe permitir:

* Registrar ventas rápidamente mediante lector de códigos de barras.
* Vender productos por unidad y productos por peso/fracción.
* Vender promociones (combos de productos a un precio fijo).
* Buscar productos manualmente.
* Administrar productos y existencias.
* Abrir y cerrar caja (arqueo).
* Registrar devoluciones y anulaciones de venta.
* Consultar movimientos de stock.
* Consultar reportes de ventas.
* Exportar información de reportes a Excel.
* Administrar usuarios mediante roles.
* Administrar medios de pago (activar/desactivar) desde una sección de Configuración.
* Registrar una auditoría de las operaciones realizadas.

La aplicación debe priorizar:

1. Rapidez de uso.
2. Simplicidad.
3. Fiabilidad de los datos.
4. Facilidad de mantenimiento.
5. Funcionamiento local sin depender de Internet.

Las funcionalidades descriptas en el Plan de Acción original (venta por unidad, stock, reportes, auditoría) son **más fundamentales** que las agregadas en esta versión. Ante cualquier conflicto de prioridad de desarrollo o de diseño visual, las funcionalidades originales deben mantenerse simples y en primer plano; las nuevas deben integrarse sin agregar fricción a ellas (ver sección 22).

---

# 2. Arquitectura general

Arquitectura cliente-servidor local, sin cambios respecto a la v1.

```text
                    COMPUTADORA LOCAL
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Navegador                                         │
│      │                                              │
│      │ HTTP                                         │
│      ▼                                              │
│   React + Vite                                      │
│      │                                              │
│      │ REST API                                     │
│      ▼                                              │
│   Node.js + Express                                 │
│      │                                              │
│      ▼                                              │
│   Sequelize                                         │
│      │                                              │
│      ▼                                              │
│   SQLite                                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

# 3. Stack tecnológico

## Backend

* Node.js
* Express
* Sequelize
* SQLite

API REST con JSON.

```text
backend/
├── controllers/
├── services/
├── routes/
├── models/
├── middlewares/
├── validators/
├── database/
└── utils/
```

Evitar lógica de negocio dentro de las rutas.

## Frontend

* React
* Vite
* React Router
* **shadcn/ui** como sistema de componentes base (ver sección 22).

```text
frontend/
├── components/
├── pages/
├── layouts/
├── services/
├── hooks/
├── context/
└── utils/
```

---

# 4. Base de datos — entidades

```text
Usuario
Producto
Venta
DetalleVenta
MovimientoStock
Auditoria
Devolucion
DetalleDevolucion
Caja
MedioPago
Promocion
PromocionProducto
```

No se agrega una tabla genérica de "Configuración" por ahora (ver sección 12): las funcionalidades configurables se modelan cada una con su propia tabla (por ejemplo `MedioPago`). Si en el futuro se necesitan más banderas simples, evaluar en ese momento si conviene una tabla genérica clave/valor — no anticipar esa decisión.

---

# 5. Modelo de datos

## 5.1. Usuario

Sin cambios respecto a la v1.

```text
id
nombre
username
password_hash
rol           # ADMIN | EMPLEADO
activo
created_at
updated_at
```

Las contraseñas nunca deben almacenarse en texto plano. Utilizar un algoritmo de hashing apropiado.

---

## 5.2. Producto

```text
id
codigo_barras
nombre
tipo_venta       # UNITARIO | PESABLE
precio
stock_actual
stock_minimo
activo
created_at
updated_at
```

Reglas:

* `codigo_barras` es único, y su unicidad debe validarse también contra `Promocion.codigo_barras` (ver 5.11): un mismo código no puede pertenecer a un producto y a una promoción simultáneamente.
* El significado de `precio` depende de `tipo_venta`:
  * `UNITARIO` → precio por unidad.
  * `PESABLE` → precio por kilogramo.
* El significado de `stock_actual` y `stock_minimo` depende de `tipo_venta`:
  * `UNITARIO` → cantidad de unidades (entero).
  * `PESABLE` → cantidad de kilogramos (decimal, hasta 3 decimales de precisión).
* Un producto puede marcarse como inactivo, nunca eliminarse físicamente, para conservar el historial de ventas.

---

## 5.3. Venta

```text
id
usuario_id
caja_id
medio_pago_id
fecha
total
created_at
```

Cambios respecto a v1: se agregan `caja_id` y `medio_pago_id`, ambos obligatorios. Una venta no puede existir sin una caja abierta ni sin un medio de pago activo (ver secciones 11, 12 y 14).

---

## 5.4. DetalleVenta

```text
id
venta_id
producto_id      # nullable
promocion_id     # nullable
cantidad
precio_unitario
subtotal
```

Reglas:

* Exactamente uno entre `producto_id` y `promocion_id` debe estar definido; nunca ambos, nunca ninguno.
* `cantidad` es decimal. Debe ser un número entero cuando el producto es `UNITARIO` o cuando la línea es una promoción (cantidad de combos); puede tener decimales (hasta 3) cuando el producto es `PESABLE` (cantidad en kg).
* `precio_unitario` es siempre el precio histórico al momento de la venta: precio por unidad, precio por kg, o precio del combo, según corresponda. Nunca se reconstruye con el precio actual.

Ejemplo (sin cambios de fondo respecto a v1):

```text
Producto:
Coca Cola

Precio actual:
$1500

Venta histórica:
Precio unitario = $1200
Cantidad = 2
Subtotal = $2400
```

---

## 5.5. MovimientoStock

```text
id
producto_id
usuario_id
tipo          # INGRESO | VENTA | AJUSTE | DEVOLUCION
cantidad
fecha
```

Cambios respecto a v1:

* Se agrega el tipo `DEVOLUCION`.
* `cantidad` pasa a ser decimal, para poder registrar movimientos en kilogramos de productos `PESABLE`.
* Una línea de venta o devolución que sea una **promoción** nunca genera un movimiento agregado sobre la promoción: genera un `MovimientoStock` independiente **por cada producto componente**, con la cantidad correspondiente (cantidad de combos × cantidad del componente en la promoción).

---

## 5.6. Auditoria

```text
id
usuario_id
accion
entidad
detalle
fecha
```

Acciones mínimas a registrar (se agregan las últimas seis respecto a v1):

```text
LOGIN
LOGOUT
CREAR_PRODUCTO
MODIFICAR_PRODUCTO
CAMBIAR_PRECIO
CREAR_USUARIO
MODIFICAR_USUARIO
AJUSTE_STOCK
INGRESO_STOCK
REGISTRAR_VENTA
REGISTRAR_DEVOLUCION
ABRIR_CAJA
CERRAR_CAJA
CREAR_PROMOCION
MODIFICAR_PROMOCION
ACTIVAR_MEDIO_PAGO
DESACTIVAR_MEDIO_PAGO
```

Para `REGISTRAR_DEVOLUCION`, el campo `detalle` debe indicar si la devolución fue total (equivale a una anulación de la venta) o parcial.

---

## 5.7. Devolucion

```text
id
venta_id
usuario_id
fecha
motivo        # opcional
total
```

`usuario_id` identifica a quién autorizó/registró la devolución (ver permisos en sección 10).

---

## 5.8. DetalleDevolucion

```text
id
devolucion_id
producto_id      # nullable
promocion_id     # nullable
cantidad
precio_unitario   # tomado del DetalleVenta original, nunca el precio actual
subtotal
```

Misma regla de exclusividad mutua que `DetalleVenta`: exactamente uno entre `producto_id` y `promocion_id`.

Una promoción se devuelve siempre como unidad completa (no se permite devolver parcialmente los componentes de un combo vendido); si el cliente quiere devolver solo parte de lo que vino en una promoción, esa decisión queda fuera de alcance de este sistema.

---

## 5.9. Caja

```text
id
usuario_apertura_id
fecha_apertura
monto_inicial
usuario_cierre_id            # nullable hasta el cierre
fecha_cierre                 # nullable hasta el cierre
monto_esperado_efectivo      # nullable hasta el cierre, calculado por el sistema
monto_declarado_efectivo     # nullable hasta el cierre, ingresado por el usuario
diferencia                   # nullable hasta el cierre
estado                       # ABIERTA | CERRADA
observaciones                # opcional
```

Solo puede existir una caja en estado `ABIERTA` a la vez (el sistema es monousuario, una sola computadora). No se puede abrir una nueva caja mientras haya una abierta.

---

## 5.10. MedioPago

```text
id
nombre
es_efectivo    # boolean
activo
```

`es_efectivo` marca cuál(es) medio(s) cuentan como efectivo físico a los fines del arqueo de caja (sección 11). Debe existir siempre al menos un medio de pago activo; el sistema no debe permitir desactivar el último medio activo.

Conjunto inicial sugerido (cargado como datos semilla, editable por el admin salvo el flag `es_efectivo`):

```text
Efectivo         (es_efectivo = true)
Tarjeta Débito
Tarjeta Crédito
Transferencia
```

Agregar medios de pago personalizados nuevos, más allá de activar/desactivar los existentes, queda fuera de alcance salvo que se solicite explícitamente.

---

## 5.11. Promocion

```text
id
nombre
codigo_barras       # único, también respecto a Producto.codigo_barras
precio_promocional
activa
created_at
updated_at
```

No se maneja vigencia por fecha (sin fecha de inicio/fin): activar/desactivar manualmente es suficiente para este sistema.

---

## 5.12. PromocionProducto

```text
id
promocion_id
producto_id
cantidad     # unidades de este producto que componen la promoción
```

Una promoción está compuesta por uno o más `PromocionProducto`. Solo se admiten productos `UNITARIO` como componentes de una promoción (los productos `PESABLE` quedan fuera de alcance para promociones, para no combinar dos mecanismos de cálculo distintos en una misma operación).

---

# 6. Productos por peso/fracción

## 6.1. Alta del producto

Al crear un producto, el admin elige `tipo_venta`:

* `UNITARIO`: comportamiento igual al de la v1 (código de barras real de fábrica, precio por unidad, stock entero).
* `PESABLE`: pensado para productos que se cortan/pesan al momento de la venta (fiambres, quesos, etc.), que normalmente no tienen un código de barras de fábrica legible. El admin asigna un **código interno corto** (ej: `20`) en el campo `codigo_barras`, y carga el **precio por kilogramo** en el campo `precio`.

## 6.2. Listado de códigos para el mostrador

El sistema debe permitir visualizar (e idealmente imprimir) un listado simple de los productos `PESABLE` activos con su código interno y nombre, para que el vendedor lo tenga físicamente a mano junto al lector de códigos:

```text
Código | Producto
─────────────────────────
20     | Jamón Crudo
21     | Queso Cremoso
22     | Salame Milán
```

## 6.3. Flujo de venta de un producto pesable

1. El vendedor escribe o escanea el código interno (ej: `20`) en el mismo campo de búsqueda/código de barras que usan los productos `UNITARIO`.
2. El sistema identifica que el producto es `PESABLE` y abre un panel/modal con dos campos vinculados:
   * **Importe** ($)
   * **Cantidad** (kg)
3. Al completar cualquiera de los dos, el sistema calcula el otro automáticamente usando el precio por kilo del producto:

```text
importe = cantidad_kg × precio_por_kg
cantidad_kg = importe / precio_por_kg
```

4. Al confirmar, se agrega la línea al detalle de venta mostrando: nombre del producto, cantidad en kg (hasta 3 decimales), precio por kg, subtotal.
5. Incrementar/reducir la línea reabre el mismo panel importe ↔ kg (no se suma/resta una unidad entera como en los productos `UNITARIO`).

El resto del flujo (buscar, agregar, eliminar, calcular total, cobrar) es el mismo que para productos `UNITARIO`, cambiando únicamente la forma de cargar la cantidad.

---

# 7. Promociones

## 7.1. Concepto

Una promoción agrupa varios productos `UNITARIO` bajo un precio fijo total (ej: "Combo Asado: 1kg Bife + 1 Carbón + 1 Sifón" a $9000, independientemente de la suma de precios individuales).

Se descartó el mecanismo de detección automática de combos en el carrito (más complejo y propenso a errores) a favor de un mecanismo simple y consistente con el resto del sistema: **la promoción tiene su propio código de barras**.

## 7.2. Alta de una promoción (ADMIN)

1. Nombre de la promoción.
2. Código de barras propio (validado como único contra `Producto.codigo_barras` y `Promocion.codigo_barras`).
3. Selección de los productos componentes y la cantidad de cada uno.
4. Precio promocional (precio fijo total del combo).
5. Estado activa/inactiva.

## 7.3. Venta de una promoción

1. El vendedor escanea o escribe el código de barras de la promoción, igual que con un producto.
2. El sistema busca primero en `Producto`; si no encuentra coincidencia, busca en `Promocion`.
3. Si existe y está activa, agrega una línea al detalle de venta: nombre de la promoción, cantidad de combos, precio promocional, subtotal = `precio_promocional × cantidad`.
4. Al confirmar la venta (ver sección 14), por cada línea de promoción el backend debe:
   * Validar stock de **cada producto componente** (`cantidad_de_combos × cantidad_por_combo <= stock_actual` del componente).
   * Generar un `MovimientoStock` de tipo `VENTA` **por cada producto componente** (no un movimiento agregado sobre la promoción).
   * Descontar el stock de cada componente correspondientemente.

El `DetalleVenta` de una línea de promoción referencia `promocion_id` (no `producto_id`) y guarda el precio histórico del combo, siguiendo el mismo principio de precio histórico que el resto del sistema.

---

# 8. Reglas generales de movimientos de stock

Sin cambios de fondo respecto a v1, con las siguientes precisiones:

* No modificar `stock_actual` sin registrar el `MovimientoStock` correspondiente.
* Una venta o devolución de una promoción se descompone siempre en movimientos individuales por producto componente (sección 7.3).
* Los movimientos sobre productos `PESABLE` se expresan en kilogramos (decimal).

---

# 9. Reglas generales de auditoría

Sin cambios de fondo respecto a v1: registrar quién, qué, sobre qué entidad, cuándo, y qué cambió. Ver el listado completo de acciones en la sección 5.6.

---

# 10. Autenticación y autorización

Pantalla de login con usuario y contraseña, dos roles: `ADMIN` y `EMPLEADO`. El frontend debe ocultar lo no permitido, pero la autorización debe verificarse también en el backend.

## ADMIN puede (agregado respecto a v1 en **negrita**):

* Realizar ventas.
* Consultar stock.
* Crear productos (unitarios y pesables).
* Modificar productos.
* Cambiar precios.
* Modificar existencias.
* Consultar reportes.
* Exportar reportes.
* Crear usuarios.
* Administrar usuarios.
* Consultar auditoría.
* **Abrir y cerrar caja.**
* **Registrar devoluciones y anulaciones de venta.**
* **Crear y administrar promociones.**
* **Activar y desactivar medios de pago.**

## EMPLEADO puede (agregado respecto a v1 en **negrita**):

* Realizar ventas (incluye productos unitarios, pesables y promociones).
* Consultar productos.
* Consultar stock.
* **Abrir y cerrar su propia caja** (es un requisito operativo diario, no una operación administrativa).

## EMPLEADO no puede:

* Cambiar precios.
* Crear usuarios.
* Administrar usuarios.
* Realizar operaciones administrativas.
* **Registrar devoluciones ni anulaciones de venta.**
* **Crear ni administrar promociones.**
* **Activar ni desactivar medios de pago.**

Decisión: se optó por permitir que `EMPLEADO` abra/cierre su propia caja (uso diario habitual), pero se restringió devoluciones/promociones/medios de pago a `ADMIN`, por tratarse de operaciones que revierten dinero/stock ya confirmado o afectan precios — mismo criterio de sensibilidad que ya aplicaba a "cambiar precios" en la v1.

---

# 11. Módulo de Caja (Apertura y Cierre / Arqueo)

## 11.1. Apertura

* Disponible para `ADMIN` y `EMPLEADO`.
* Precondición: no debe existir ya una caja en estado `ABIERTA`.
* El usuario ingresa `monto_inicial` (efectivo con el que arranca el turno).
* Se crea el registro `Caja` (`estado = ABIERTA`) y se registra auditoría `ABRIR_CAJA`.
* **No se puede registrar ninguna venta si no existe una caja abierta** (ver sección 14, Paso 1).

## 11.2. Cierre

1. El sistema calcula:

```text
monto_esperado_efectivo =
    monto_inicial
    + (suma de ventas cuyo medio de pago tiene es_efectivo = true, de esta caja)
    − (suma de devoluciones de ventas con medio de pago efectivo, de esta caja)
```

2. Las ventas con medios de pago no efectivos (tarjeta, transferencia) se muestran solo de forma informativa, agrupadas por medio, sin afectar el cálculo anterior.
3. El usuario cuenta el efectivo físico e ingresa `monto_declarado_efectivo`.
4. El sistema calcula `diferencia = monto_declarado_efectivo − monto_esperado_efectivo` y la muestra.
5. Al confirmar, se actualiza `Caja` (`fecha_cierre`, los tres montos, `estado = CERRADA`) y se registra auditoría `CERRAR_CAJA`.

---

# 12. Módulo de Configuración

Acceso exclusivo para `ADMIN`. Es el lugar de la interfaz donde viven las funcionalidades activables/desactivables, para no mezclarlas con el flujo operativo diario.

## 12.1. Medios de Pago

* Listado de medios de pago existentes con su estado (activo/inactivo).
* Permitir activar/desactivar cada uno, excepto que quedaría el sistema sin ningún medio de pago activo (bloquear esa acción).
* No se permite crear medios de pago personalizados nuevos en esta versión (ver 5.10).
* Cada cambio de estado registra auditoría (`ACTIVAR_MEDIO_PAGO` / `DESACTIVAR_MEDIO_PAGO`).

Este módulo está pensado para ser el punto de extensión de futuras banderas de configuración: si más adelante se agrega una nueva funcionalidad opcional, el patrón a seguir es "agregar su propio flag/entidad y exponerlo en Configuración", en vez de modificar el flujo principal de Ventas.

## 12.2. Promociones

La gestión de Promociones (alta, edición, activar/desactivar — sección 7.2) vive dentro del módulo de **Stock**, como una pestaña adicional visible solo para `ADMIN`, junto a la gestión de productos — conceptualmente es una extensión del catálogo, no una bandera de configuración.

---

# 13. Módulo de Ventas

Sigue siendo el módulo optimizado para el uso cotidiano. La pantalla debe mostrar claramente:

```text
Buscar producto

Detalle de venta
────────────────────────────────────────
Producto/Promo | Precio | Cant. | Subtotal
────────────────────────────────────────

Total: $XXXX

Medio de pago: [ Efectivo ▾ ]

[ COBRAR ]
```

## 13.1. Incorporar productos

Existe una búsqueda por nombre y un campo preparado para recibir códigos de un lector de código de barras USB (funciona como entrada de teclado).

Al recibir un código, el sistema debe distinguir tres casos:

1. **Coincide con un `Producto` `UNITARIO`**: agregarlo directamente a la venta (o incrementar cantidad si ya está).
2. **Coincide con un `Producto` `PESABLE`**: abrir el panel importe ↔ kg (sección 6.3).
3. **Coincide con una `Promocion` activa**: agregar una línea de combo (sección 7.3).

Si el código no coincide con ningún producto ni promoción, mostrar un mensaje claro indicando que no está registrado.

## 13.2. Gestión del detalle

Cada línea agregada debe permitir incrementar, reducir o eliminar (con el comportamiento específico de cada tipo, ver 6.3 para pesables). Mostrar siempre nombre, precio/precio por kg/precio del combo, cantidad y subtotal, y el total general de la venta.

## 13.3. Selección de medio de pago

Antes de cobrar, el vendedor selecciona el medio de pago entre los que están **activos** (sección 12.1). El sistema no debe permitir cobrar sin un medio de pago seleccionado, ni con uno inactivo.

## 13.4. Cobro

Ver flujo transaccional completo en la sección 14.

---

# 14. Flujo transaccional para registrar una venta

El registro de una venta es una operación crítica y debe implementarse como **una única transacción de base de datos**: se confirma completamente o se revierte completamente.

## 14.1. Principio fundamental

El backend es el único responsable de confirmar una venta. El frontend solamente envía la selección de productos/promociones, cantidades y el medio de pago elegido.

No confiar en los cálculos del frontend para: precios, subtotales, total, ni stock disponible. Tampoco confiar en la caja que el frontend "cree" que está abierta: el backend la determina consultando la base de datos.

## 14.2. Datos recibidos desde el frontend

```json
{
  "medioPagoId": 1,
  "items": [
    { "tipo": "PRODUCTO", "productoId": 15, "cantidad": 2 },
    { "tipo": "PRODUCTO_PESABLE", "productoId": 42, "cantidadKg": 0.350 },
    { "tipo": "PROMOCION", "promocionId": 3, "cantidad": 1 }
  ]
}
```

No se envía `cajaId`: el backend determina la caja abierta vigente automáticamente. No se envían `precio`, `subtotal`, `total` ni `stock`: son determinados por el backend.

## 14.3. Paso 1 — Validación inicial

Antes de iniciar la transacción, verificar:

* Que exista un usuario autenticado.
* Que exista una caja en estado `ABIERTA` (si no existe, rechazar indicando que debe abrirse una caja antes de vender).
* Que `medioPagoId` corresponda a un medio de pago existente y activo.
* Que la venta contenga al menos un ítem.
* Que las cantidades sean válidas: enteras positivas para `PRODUCTO` y `PROMOCION`; positivas (pueden tener decimales) para `PRODUCTO_PESABLE`.
* Que no existan ítems duplicados del mismo producto o promoción en la solicitud.

Si alguna validación falla, rechazar sin modificar la base de datos.

## 14.4. Paso 2 — Iniciar transacción

Crear una transacción con Sequelize. Todas las operaciones de escritura relacionadas con la venta deben usar esa misma transacción.

## 14.5. Paso 3 — Obtener productos y promociones desde la base de datos

Para cada ítem recibido:

* **`PRODUCTO`**: buscar por ID, verificar que exista, esté activo y sea `tipo_venta = UNITARIO`. Tomar precio y stock actual desde la base de datos.
* **`PRODUCTO_PESABLE`**: buscar por ID, verificar que exista, esté activo y sea `tipo_venta = PESABLE`. Tomar precio por kg y stock actual (kg) desde la base de datos.
* **`PROMOCION`**: buscar por ID, verificar que exista y esté activa. Obtener `precio_promocional` y expandir sus `PromocionProducto` para conocer cada componente, su cantidad requerida y su stock actual.

Nunca usar precio ni stock enviados por el frontend.

## 14.6. Paso 4 — Validar stock

* `PRODUCTO`: `cantidad solicitada <= stock_actual`.
* `PRODUCTO_PESABLE`: `cantidad_kg solicitada <= stock_actual (kg)`.
* `PROMOCION`: para cada componente, `cantidad_de_combos × cantidad_por_combo <= stock_actual del componente`.

Si algo no tiene stock suficiente: rechazar toda la venta, no modificar ningún registro, e indicar al usuario qué producto específico falla (incluyendo, si corresponde, qué componente de qué promoción).

## 14.7. Paso 5 — Calcular precios

```text
PRODUCTO:         subtotal = precio × cantidad
PRODUCTO_PESABLE:  subtotal = precio_por_kg × cantidad_kg
PROMOCION:         subtotal = precio_promocional × cantidad_de_combos

total = suma de todos los subtotales
```

Nunca usar valores enviados por el frontend para estos cálculos.

## 14.8. Paso 6 — Crear la Venta

Crear el registro `Venta` con `usuario_id`, `caja_id` (la caja abierta detectada en el Paso 1), `medio_pago_id`, `fecha` (generada por el backend) y `total`.

## 14.9. Paso 7 — Crear los Detalles de Venta

Por cada ítem, crear un `DetalleVenta` con `venta_id`, `producto_id` **o** `promocion_id` (nunca ambos), `cantidad`, `precio_unitario` histórico y `subtotal`.

## 14.10. Paso 8 — Actualizar el stock

* Ítems `PRODUCTO` y `PRODUCTO_PESABLE`: `nuevo_stock = stock_actual − cantidad_vendida`, dentro de la misma transacción. No permitir stock negativo.
* Ítems `PROMOCION`: descontar el stock de **cada producto componente** según `cantidad_por_combo × cantidad_de_combos`.

## 14.11. Paso 9 — Crear movimientos de stock

Por cada producto afectado (incluyendo cada componente de cada promoción vendida) crear un `MovimientoStock`:

```text
producto_id
usuario_id
tipo = VENTA
cantidad = -cantidad_vendida
fecha
```

Una promoción nunca genera un único movimiento agregado: genera un movimiento por cada componente.

## 14.12. Paso 10 — Registrar auditoría

Registrar en `Auditoria`: `usuario_id`, `accion = REGISTRAR_VENTA`, `entidad = VENTA`, `detalle` con información relevante (incluyendo medio de pago y caja), `fecha`.

## 14.13. Paso 11 — Confirmar la transacción

Solo después de completar correctamente Venta → Detalles → Stock → Movimientos → Auditoría, ejecutar `COMMIT`. La venta queda confirmada únicamente después del commit.

## 14.14. Manejo de errores

Toda la operación va protegida por `try/catch`. Ante cualquier error: `ROLLBACK` completo. Nunca debe existir una venta parcialmente registrada.

## 14.15. Respuesta del backend

Éxito:

```json
{
  "success": true,
  "ventaId": 1045,
  "total": 8400,
  "cajaId": 8,
  "medioPago": "Efectivo"
}
```

Errores posibles:

```json
{ "success": false, "error": "CAJA_NO_ABIERTA" }
```

```json
{ "success": false, "error": "MEDIO_PAGO_INVALIDO" }
```

```json
{ "success": false, "error": "PROMOCION_INACTIVA", "promocion": "Combo Desayuno" }
```

```json
{
  "success": false,
  "error": "STOCK_INSUFICIENTE",
  "producto": "Coca Cola 500ml",
  "stockDisponible": 1,
  "cantidadSolicitada": 2
}
```

```json
{
  "success": false,
  "error": "STOCK_INSUFICIENTE",
  "producto": "Jamón Crudo (pesable)",
  "stockDisponibleKg": 1.2,
  "cantidadSolicitadaKg": 2
}
```

## 14.16. Estado del frontend

Igual que en v1: el frontend solo limpia el carrito y muestra confirmación tras una respuesta exitosa del backend. Ante error, no limpia el carrito y muestra el motivo, permitiendo corregir.

## 14.17. Implementación recomendada

```javascript
const transaction = await sequelize.transaction();

try {
    // Validaciones y operaciones relacionadas
    // Todas utilizando { transaction }

    await transaction.commit();
    return resultado;
} catch (error) {
    await transaction.rollback();
    throw error;
}
```

No crear transacciones independientes para cada operación dentro del flujo de venta.

---

# 15. Módulo de Devoluciones y Anulaciones

## 15.1. Alcance

Disponible solo para `ADMIN`. Permite devolver total o parcialmente los productos/promociones de una venta ya confirmada. Una **anulación** es simplemente una devolución donde se seleccionan todas las líneas con su cantidad completa.

## 15.2. Flujo de uso

1. Buscar la venta original (por número de venta o desde un listado de ventas recientes/del día).
2. Mostrar el detalle de la venta, con la cantidad disponible para devolver por línea (`cantidad vendida − cantidad ya devuelta previamente en esa línea`).
3. El admin selecciona qué líneas y cuánta cantidad de cada una se devuelve (no puede superar lo disponible). Las promociones se devuelven completas (ver 5.8).
4. Opcionalmente, se registra un motivo.

## 15.3. Flujo transaccional

Sigue el mismo patrón que el registro de una venta (sección 14): una única transacción, todo o nada.

1. Validar rol `ADMIN`, que la venta exista, y que las cantidades a devolver no superen lo disponible por línea.
2. Dentro de la transacción:
   * Crear `Devolucion` (`venta_id`, `usuario_id`, `fecha`, `motivo`, `total`).
   * Crear `DetalleDevolucion` por cada línea devuelta, con `precio_unitario` tomado del `DetalleVenta` original (nunca el precio actual).
   * Generar `MovimientoStock` de tipo `DEVOLUCION` (cantidad positiva) por cada producto afectado — si la línea devuelta era una promoción, expandir por componente, igual que en la venta.
   * Actualizar `stock_actual` sumando la cantidad devuelta.
   * Registrar auditoría `REGISTRAR_DEVOLUCION`, indicando en `detalle` si fue total o parcial.
3. `COMMIT` o `ROLLBACK` completo, igual que en el registro de ventas.

## 15.4. Nota de consistencia con reportes

Los reportes y KPIs definidos en la sección 18 deben reflejar el efecto de las devoluciones: al calcular unidades vendidas e ingresos, restar las unidades y montos devueltos en el período analizado. Esto no agrega ninguna métrica nueva: es un ajuste necesario a las ya definidas, para que representen el ingreso/venta neta real.

---

# 16. Módulo de Stock

Sin cambios de fondo respecto a v1. La tabla de productos activos debe incluir además una columna que indique el `tipo_venta` (UNITARIO/PESABLE), y para productos `PESABLE` mostrar el stock en kilogramos.

```text
Código de barras
Nombre
Tipo (Unitario/Pesable)
Precio (por unidad o por kg)
Stock actual
Stock mínimo
Estado
```

Crear producto, ingreso de stock y ajuste de stock funcionan igual que en v1, respetando la unidad de medida (unidades o kg) según `tipo_venta`.

La gestión de Promociones vive como una pestaña adicional dentro de este módulo (sección 12.2).

---

# 17. Módulo de Reportes

Sin cambios de fondo respecto a v1: filtros temporales, agrupación por día/semana/mes y por horario (mañana/tarde/noche, con rangos horarios definidos y consistentes en todos los reportes).

---

# 18. KPIs y métricas

Se implementan exclusivamente las métricas ya definidas en la v1 (no se agregan métricas nuevas en esta versión):

* Top 10 productos más vendidos.
* Top 10 productos menos vendidos.
* Ingresos por producto (usando siempre `precio_unitario` histórico de `DetalleVenta`).
* Ingreso total del catálogo.
* Rotación de inventario (fórmula documentada explícitamente, sin usar precio actual).
* Día de la semana con mayores/menores ventas.
* Distribución porcentual de ventas por horario.
* Comparación semana actual vs. anterior, y mes actual vs. anterior.
* Cantidad promedio de productos por venta.

**Ajuste obligatorio (no es una métrica nueva):** todas estas métricas deben calcularse netas de devoluciones, según lo indicado en 15.4.

---

# 19. Exportación a Excel

Como mínimo, permitir exportar:

* Ventas.
* Detalle de ventas.
* Ventas agrupadas por producto.
* Ranking de productos.
* Ingresos por producto.
* Información temporal utilizada por los reportes.
* **Devoluciones y anulaciones.**
* **Cierres de caja (arqueos), con sus montos esperado/declarado/diferencia.**

La exportación debe respetar los filtros aplicados en pantalla.

---

# 20. Transacciones de base de datos

Las siguientes operaciones deben ejecutarse como una única transacción de Sequelize, todo o nada:

```text
Registrar venta
    (Venta + Detalles + Stock + Movimientos + Auditoría)

Registrar devolución/anulación
    (Devolucion + DetalleDevolucion + Stock + Movimientos + Auditoría)

Cierre de caja
    (actualización de Caja + Auditoría)
```

Si una parte falla, toda la operación debe revertirse. Nunca debe quedar un estado intermedio (ej: venta registrada pero stock no actualizado, o devolución registrada pero stock no repuesto).

---

# 21. API

```text
/api/auth
/api/productos
/api/promociones
/api/ventas
/api/devoluciones
/api/caja
/api/medios-pago
/api/stock
/api/reportes
/api/usuarios
/api/auditoria
```

Mantener la separación Route → Controller → Service → Model, sin lógica de negocio en los controladores.

---

# 22. Interfaz y diseño UX

## 22.1. Principio general

Las funcionalidades del Plan de Acción original (vender, buscar producto, cobrar) son más fundamentales que las agregadas en esta versión (arqueo, devoluciones, promociones, medios de pago). El diseño debe **ocultar la complejidad nueva a primera vista**: la pantalla de Ventas debe seguir siendo tan simple y rápida como en v1, y todo lo nuevo debe integrarse como funcionalidad secundaria, accesible pero no protagonista.

Aplicación concreta de este principio:

* **Caja**: se representa como un indicador discreto (ej. una franja fina en la parte superior: "Caja abierta desde 09:15 — inicial $5.000"), no como un módulo grande. Si no hay caja abierta, se reemplaza la pantalla de Ventas por un formulario mínimo de apertura — un solo campo (monto inicial) y un botón.
* **Devoluciones**: se accede desde un botón/enlace secundario dentro de Ventas (menor jerarquía visual que "COBRAR"), no como una nueva pestaña de navegación principal.
* **Promociones**: vive dentro de Stock, como pestaña adicional solo para ADMIN (sección 12.2), no en la pantalla de venta.
* **Medios de pago**: su selección en Ventas es un control simple (ej. un select) junto al total; su administración vive exclusivamente en Configuración.

## 22.2. Navegación principal

```text
┌───────────────────────────────────────────────────────┐
│                      Navegación                        │
├──────────┬───────────┬───────────────┬─────────────────┤
│ VENTAS   │   STOCK    │   REPORTES    │  CONFIGURACIÓN  │
└──────────┴───────────┴───────────────┴─────────────────┘
```

`CONFIGURACIÓN` solo es visible para `ADMIN`.

## 22.3. Estilo visual

Sistema de componentes: **shadcn/ui**. Estética inspirada en **Linear**:

* Paleta neutra (grises/zinc) con un único color de acento para acciones primarias.
* Tipografía sans-serif clara y legible, con buena jerarquía de tamaños.
* Espaciado generoso; evitar densidad visual en las pantallas de uso frecuente (Ventas).
* Bordes finos (1px) de bajo contraste, esquinas levemente redondeadas, sombras mínimas.
* Transiciones/microinteracciones sutiles (150–200ms), sin animaciones vistosas.
* Modo oscuro disponible como opción.

Excepción intencional: los botones de acciones primarias del flujo de venta (`COBRAR`, agregar producto) deben seguir siendo grandes y de alto contraste, priorizando velocidad de uso por sobre la minimalidad visual estricta — la estética Linear se aplica al detalle y la administración, nunca a costa de la regla ya establecida en v1 de "botones grandes para acciones importantes".

## 22.4. Patrones de interacción

* La búsqueda de producto puede implementarse como un campo de búsqueda rápida siempre enfocado/accesible (estilo command palette), consistente con que el lector de código de barras funciona como entrada de teclado.
* Las pantallas administrativas nuevas (Caja al cerrar, Devoluciones, Promociones, Configuración) pueden tener mayor densidad de información (tablas, formularios completos), ya que son de uso ocasional, no constante.

---

# 23. Ejecución local

Sin cambios respecto a v1.

```text
Encender computadora
       ↓
Windows inicia
       ↓
Node.js inicia automáticamente
       ↓
Express inicia
       ↓
SQLite queda disponible
       ↓
Usuario abre navegador
       ↓
http://localhost:XXXX
```

No utilizar Electron. Vite Dev Server en desarrollo; definir una estrategia clara para servir el frontend compilado en producción.

---

# 24. Desarrollo por etapas

NO implementar todo simultáneamente. Al finalizar cada etapa, comprobar que las anteriores sigan funcionando.

## Etapa 1 — Arquitectura
Estructura del proyecto, backend, frontend, Sequelize, SQLite, modelos, relaciones, migraciones, variables de entorno, estructura inicial de API.

## Etapa 2 — Base de datos
Implementar las 12 entidades de la sección 4, con sus primary/foreign keys, índices y restricciones de unicidad (incluyendo la unicidad cruzada `Producto.codigo_barras` / `Promocion.codigo_barras`). Probar migraciones desde una base vacía.

## Etapa 3 — Autenticación
Login, logout, hash de contraseñas, roles, autorización, usuario administrador inicial. Comprobar que un `EMPLEADO` no pueda acceder a operaciones administrativas ni siquiera llamando directamente a la API.

## Etapa 4 — Stock
Listado, búsqueda, creación (unitario/pesable), edición, ingreso, ajustes, stock mínimo, alertas, movimientos de stock.

## Etapa 5 — Caja y Medios de Pago
Apertura/cierre de caja, cálculo de efectivo esperado/declarado/diferencia, ABM de medios de pago en Configuración (activar/desactivar, garantizando al menos uno activo).

## Etapa 6 — Promociones
ABM de promociones (código de barras propio, componentes, precio promocional) dentro del módulo de Stock.

## Etapa 7 — Ventas
Búsqueda por nombre, entrada por código de barras (con las tres ramas: producto unitario, producto pesable, promoción), panel importe↔kg, detalle de venta, selección de medio de pago, validación de caja abierta, confirmación transaccional completa (sección 14). Probar especialmente transacciones, stock insuficiente (incluyendo componentes de promociones) y caja no abierta.

## Etapa 8 — Devoluciones y Anulaciones
Búsqueda de venta original, selección de líneas/cantidades a devolver, flujo transaccional (sección 15). Probar que no se pueda devolver más de lo vendido/disponible.

## Etapa 9 — Reportes
Consultas backend primero, interfaces después. Los 14 puntos de la v1, ajustados netos de devoluciones (18).

## Etapa 10 — Exportación Excel
Incluyendo devoluciones y cierres de caja. Comprobar que los datos exportados coincidan con los mostrados en pantalla y respeten los filtros.

## Etapa 11 — Auditoría
Completar todas las acciones listadas en 5.6. Interfaz para que el admin consulte el historial.

## Etapa 12 — Integración
Probar el flujo completo:

```text
Login
 ↓
Abrir caja
 ↓
Crear producto (unitario y pesable)
 ↓
Ingresar stock
 ↓
Crear una promoción
 ↓
Realizar una venta con producto unitario, producto pesable y promoción
 ↓
Stock disminuye (incluyendo componentes de la promoción)
 ↓
Movimientos registrados
 ↓
Venta registrada
 ↓
Auditoría registrada
 ↓
Registrar una devolución parcial de esa venta
 ↓
Stock repuesto correctamente
 ↓
Cerrar caja y verificar el arqueo
 ↓
Reporte actualizado (neto de la devolución)
 ↓
Exportar Excel
```

---

# 25. Pruebas mínimas

Además de las ya definidas en v1 (productos, stock, ventas, autenticación, reportes), agregar como mínimo:

### Productos por peso

* Ingresar un importe calcula correctamente la cantidad en kg, y viceversa.
* No se acepta cantidad fraccionaria para productos `UNITARIO`.
* El stock de un producto `PESABLE` se descuenta y repone en kilogramos con precisión decimal.

### Promociones

* El código de barras de una promoción no puede coincidir con el de ningún producto, y viceversa.
* Vender una promoción genera un `MovimientoStock` por cada producto componente, no uno agregado.
* La venta de una promoción conserva el precio histórico del combo aunque luego cambie `precio_promocional`.
* No se puede vender una promoción inactiva.

### Caja

* No se puede registrar una venta sin una caja abierta.
* No se puede abrir una segunda caja mientras haya una abierta.
* El cierre calcula correctamente el efectivo esperado considerando ventas y devoluciones en efectivo del período de esa caja.
* La diferencia se calcula correctamente ante montos declarados distintos al esperado.

### Medios de pago

* No se puede vender con un medio de pago inactivo.
* No se puede desactivar el último medio de pago activo.

### Devoluciones

* No se puede devolver más cantidad que la vendida menos lo ya devuelto previamente.
* Una devolución genera el `MovimientoStock` tipo `DEVOLUCION` correspondiente (por componente, si era una promoción).
* Un usuario `EMPLEADO` no puede registrar devoluciones, ni llamando directamente a la API.
* Los reportes reflejan el ingreso/unidades neto tras la devolución.

---

# 26. Decisiones fuera de alcance

Los siguientes puntos fueron considerados y **descartados explícitamente** para esta versión. El agente no debe implementarlos sin que se solicite:

* **Tipo de dato específico para dinero**: no se define un tratamiento especial; usar el criterio estándar del stack elegido.
* **Zona horaria**: no se define un tratamiento especial; usar la hora local del sistema.
* **Categorías/proveedor de producto**: no se implementa.
* **Backups de la base de datos**: no se implementa.
* **Recuperación de acceso admin** (usuario/contraseña olvidados): no se implementa.
* **Expiración de sesión / manejo de token**: no se implementa; mantener el mecanismo de sesión más simple posible.

---

# 27. Reglas importantes para el agente

1. No implementar funcionalidades que no estén especificadas sin justificar primero su necesidad.
2. No eliminar información histórica de ventas ni de devoluciones.
3. No almacenar contraseñas en texto plano.
4. No confiar únicamente en las restricciones del frontend para controlar permisos.
5. No modificar stock sin registrar un movimiento.
6. No reconstruir ventas ni devoluciones históricas utilizando el precio actual del producto o de la promoción.
7. Utilizar transacciones para operaciones que involucren múltiples modificaciones de datos (ventas, devoluciones, cierre de caja).
8. Mantener separada la lógica de negocio de las rutas y componentes visuales.
9. Evitar duplicación innecesaria de código.
10. Priorizar código simple y mantenible sobre abstracciones innecesarias.
11. No agregar KPIs que no estén definidos en este documento.
12. No implementar Electron.
13. El sistema es monousuario; no diseñar funcionalidades innecesarias para múltiples cajas o usuarios concurrentes.
14. Antes de implementar cada etapa, verificar que las etapas anteriores continúen funcionando.
15. Ante una decisión técnica no especificada, elegir la alternativa más simple y adecuada para una aplicación local monousuario, y documentar la decisión.
16. No permitir registrar ventas si no existe una caja abierta.
17. No permitir vender con un medio de pago inactivo.
18. Cada línea de promoción vendida o devuelta debe generar movimientos de stock individuales por producto componente, nunca un movimiento agregado sobre la promoción.
19. La pantalla de Ventas debe priorizar visualmente el flujo de venta rápida; las funcionalidades nuevas (caja, promociones, medios de pago, devoluciones) deben integrarse sin agregar ruido visual a esa pantalla (ver sección 22).
20. No implementar ninguno de los puntos listados en la sección 26 sin que se solicite explícitamente.

---

# 28. Criterio de finalización

El sistema será considerado funcional cuando un usuario pueda:

```text
Iniciar sesión
      ↓
Abrir caja
      ↓
Crear un producto unitario y un producto pesable
      ↓
Ingresar existencias
      ↓
Crear una promoción
      ↓
Realizar una venta con código de barras: un producto unitario,
un producto pesable (con cálculo importe↔kg) y una promoción
      ↓
Ver cómo disminuye el stock de todos los productos involucrados
      ↓
Consultar los movimientos generados
      ↓
Registrar una devolución parcial de esa venta
      ↓
Ver cómo se repone el stock correspondiente
      ↓
Cerrar caja y verificar el arqueo (efectivo esperado vs. declarado)
      ↓
Consultar la venta y la devolución en reportes (netos)
      ↓
Analizar los KPIs
      ↓
Exportar los resultados a Excel
```

Y un administrador pueda además:

```text
Crear usuarios
Cambiar precios
Administrar productos (unitarios y pesables)
Administrar promociones
Activar/desactivar medios de pago
Modificar stock
Autorizar devoluciones y anulaciones
Consultar auditoría
```

La aplicación debe funcionar completamente de manera local, utilizando Node.js + Express + Sequelize + SQLite en el backend, y React + Vite + shadcn/ui en el frontend.
