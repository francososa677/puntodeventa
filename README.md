# 🛒 Sistema POS & Gestión de Almacén v2

Sistema integral de Punto de Venta (POS), Gestión de Inventario, Promociones y Auditoría para comercios y almacenes de barrio. Desarrollado con **Node.js + Express + Sequelize (SQLite)** en el Backend y **React + Vite + Tailwind CSS** en el Frontend.

---

## ⚡ Características Principales

* 💳 **Punto de Venta Reactivo (POS):**
  * Búsqueda unificada por código de barras (lectores USB) y por texto/nombre.
  * Soporte completo para **Productos Pesables** (cálculo automático `Importe ↔ Kilogramos`).
  * Gestión de **Promociones y Combos** multielemento.
  * Navegación 100% con teclado (`⬆` / `⬇` + `Enter` + cobro automático sin mouse).
  * Soporte para múltiples medios de pago (Efectivo, Débito, Crédito, Transferencia).
  * Emisión e impresión de tickets de venta.

* 📦 **Gestión de Stock e Inventario:**
  * Control de stock mínimo y alerta de faltantes.
  * Alta, edición, baja lógica y ajuste de productos y promociones.
  * Registro atómico de movimientos de inventario.

* 🔄 **Devoluciones & Reversiones:**
  * Reversión de ventas completas o parciales.
  * Reincorporación automática de stock a la base de datos.
  * Accesible para administradores y empleados.

* 📊 **Reportes y Analíticas:**
  * Dashboard interactivo con indicadores clave de rendimiento (KPIs).
  * Comparativas semanales y mensuales.
  * Ranking de rotación de productos.
  * Exportación de reportes a planillas Excel (`.xlsx`).

* 🔐 **Seguridad & Auditoría:**
  * Autenticación JWT con roles (ADMIN / EMPLEADO).
  * Transacciones atómicas en base de datos para garantizar integridad en SQLite.
  * Bitácora inalterable de auditoría operacional para todas las operaciones críticas.

---

## 🛠️ Stack Tecnológico

* **Backend:** Node.js, Express, Sequelize ORM, SQLite.
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
* **Reportes:** ExcelJS.

---

## 🚀 Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone <URL_DE_TU_REPOSITORIO>
cd puntoventa
```

### 2. Configurar el Backend
```bash
cd backend
npm install
node database/seed.js # Puebla la base de datos con usuarios y productos semilla
node server.js
```
El servidor backend se iniciará en `http://localhost:3001`.

### 3. Configurar el Frontend
```bash
cd ../frontend
npm install
npm run dev
```
La aplicación web se iniciará en `http://localhost:5173`.

---

## 🔑 Credenciales por Defecto (Entorno de Desarrollo)

* **Administrador:** Usuario `admin` / Contraseña `admin123`
* **Empleado:** Usuario `empleado` / Contraseña `empleado123`
