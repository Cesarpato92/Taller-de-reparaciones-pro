# PCEL MEDIC | Enterprise Workshop Management System

**PCEL MEDIC** es una solución ERP integral diseñada para la optimización operativa de centros de servicio técnico y talleres de reparaciones. El sistema automatiza el flujo de trabajo desde la recepción de activos hasta la entrega final, proporcionando herramientas avanzadas de gestión financiera y seguimiento en tiempo real.

## 🌟 Propuesta de Valor

- **Gestión Operativa de Alto Rendimiento**: Ciclo de vida completo de reparaciones con estados sincronizados, diagnósticos técnicos editables y registro automático de fechas de entrega.
- **Inteligencia Financiera Avanzada**: Módulo administrativo con gráficos de rendimiento y reportes diarios **expandibles** para un desglose detallado de equipos y ganancias por jornada.
- **Búsqueda y Recuperación de Datos**: Infraestructura de filtrado de alta velocidad para la localización instantánea de registros por cliente, identificación o equipo.
- **Documentación Automatizada**: Generación dinámica de comprobantes de servicio en formato PDF para garantizar trazabilidad y profesionalismo.
- **Interfaz de Usuario de Grado Profesional**: Layout optimizado con estética contemporánea, sombras suaves, bordes finos y aprovechamiento total del ancho de pantalla.

## 🛠️ Stack Tecnológico

### Arquitectura de Frontend
- **React 19 & Vite**: Motor principal para una interfaz reactiva y tiempos de carga ultrarrápidos.
- **Tailwind CSS**: Framework de diseño para una consistencia visual escalable y moderna.
- **Recharts & Custom SVG**: Visualización analítica de métricas financieras.
- **jsPDF Support**: Sistema integrado para la exportación de documentos oficiales.

### Infraestructura Backend
- **Node.js & Express**: API REST escalable con manejo robusto de errores y transacciones atómicas.
- **Supabase (PostgreSQL)**: Arquitectura de base de datos relacional con seguridad y persistencia en la nube.
- **Environment Management**: Gestión segura de variables de entorno para una configuración flexible.

## 📦 Despliegue y Configuración

### Prerrequisitos
- **Node.js**: Entorno de ejecución (v18.x recomendado).
- **Supabase Account**: Para la persistencia de datos.

### 1. Inicialización del Repositorio
```bash
git clone https://github.com/Cesarpato92/Taller-de-reparaciones-pro.git
cd Taller-de-reparaciones-pro
```

### 2. Configuración del Servidor (Backend)
```bash
cd backend
npm install
```
Configure las variables de entorno en un archivo `.env`:
```env
SUPABASE_URL=tu_endpoint_url
SUPABASE_KEY=tu_api_key_autenticada
PORT=10000
```
Ejecución:
```bash
npm run dev
```

### 3. Configuración del Cliente (Frontend)
```bash
cd ../frontend
npm install
```
Asegure que el archivo `.env` apunte al puerto correcto:
```env
VITE_API_URL=http://localhost:10000/api
```
Ejecución:
```bash
npm run dev
```

## 📐 Estándares de Diseño
El sistema implementa un **Layout de Grado Empresarial** con márgenes de seguridad de 30px y una separación modular de 20px, asegurando una experiencia de usuario ergonómica y profesional.

## 👥 Desarrollo y Autoría
- **Cesar Patiño** - *Arquitectura y Desarrollo Principal*

---
© 2026 **PCEL MEDIC** - Soluciones Tecnológicas de Vanguardia.

