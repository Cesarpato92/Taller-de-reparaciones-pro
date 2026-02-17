# PCEL MEDIC | Enterprise Workshop Management System

**PCEL MEDIC** es una solución ERP integral diseñada para la optimización operativa de centros de servicio técnico y talleres de reparaciones. El sistema automatiza el flujo de trabajo desde la recepción de activos hasta la entrega final, proporcionando herramientas avanzadas de gestión financiera y seguimiento en tiempo real.

## 🌟 Propuesta de Valor

- **Gestión Operativa de Alto Rendimiento**: Ciclo de vida completo de reparaciones con estados sincronizados y diagnósticos técnicos editables.
- **Inteligencia Financiera**: Módulo administrativo dedicado para el análisis de márgenes, monitoreo de rendimiento diario y reportes históricos detallados.
- **Búsqueda y Recuperación de Datos**: Infraestructura de filtrado de alta velocidad para la localización instantánea de registros por cliente, identificación o equipo.
- **Documentación Automatizada**: Generación dinámica de comprobantes de servicio en formato PDF, garantizando trazabilidad y profesionalismo.
- **Interfaz de Usuario de Grado Profesional**: Layout optimizado para alta productividad, con una estética contemporánea, sombras suaves y aprovechamiento total del ancho de pantalla.

## 🛠️ Stack Tecnológico

### Arquitectura de Frontend
- **React 19 & Vite**: Motor principal para una interfaz reactiva y tiempos de carga ultrarrápidos.
- **Tailwind CSS**: Framework de diseño para una consistencia visual escalable.
- **Recharts**: Visualización analítica de métricas financieras.
- **jsPDF Support**: Sistema integrado para la exportación de documentos oficiales.

### Infraestructura Backend
- **Node.js & Express**: API REST escalable para el procesamiento de lógica de negocio.
- **Supabase (PostgreSQL)**: Arquitectura de base de datos relacional con seguridad de grado empresarial.
- **CORS & Environment Management**: Protocolos de seguridad y gestión de variables de entorno.

## 📦 Despliegue y Configuración

### Prerrequisitos
- **Node.js**: Entorno de ejecución (v18.x recomendado).
- **Supabase Account**: Para la persistencia de datos y autenticación.

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
PORT=5000
```
Ejecución en modo desarrollo:
```bash
npm run dev
```

### 3. Configuración del Cliente (Frontend)
```bash
cd ../frontend
npm install
npm run dev
```

## � Estándares de Diseño
El sistema implementa un **Layout Balanceado** con márgenes de seguridad de 30px y una separación modular de 20px, asegurando una experiencia de usuario ergonómica y visualmente descansada para entornos de uso intensivo.

## 👥 Desarrollo y Autoría
- **Cesar Patiño** - *Arquitectura y Desarrollo Principal*

---
© 2026 **PCEL MEDIC** - Soluciones Tecnológicas de Vanguardia.

