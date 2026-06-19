# Trafexia - Herramienta de Intercepción y Análisis de Tráfico de Red Móvil

Una potente aplicación de escritorio para interceptar, analizar y manipular tráfico HTTP/HTTPS desde dispositivos móviles. Construida con Electron, Vue 3 y TypeScript.

Trafexia proporciona herramientas completas para pruebas de seguridad de aplicaciones móviles, ingeniería inversa y depuración de APIs con características avanzadas como evasión de SSL pinning, respuestas simuladas (Mocking), redireccionamiento de tráfico (Map Rules) y más.

---

## ✨ Características Principales

### 🔐 Evasión de SSL/TLS (SSL Bypass)
- **Scripts de evasión integrados** - Soporta OkHttp3, Conscrypt, WebView, Flutter, React Native y más.
- **Parcheo de APK (APK Patching)** - Inyecta scripts de evasión directamente en los APK sin requerir dispositivos rooteados.
- **Integración con Frida Gadget** - Inyección de código dinámica utilizando Frida para hookeado en tiempo de ejecución.

### 📊 Análisis de Tráfico en Tiempo Real
- **Captura en vivo** - Intercepta y muestra solicitudes HTTP/HTTPS en tiempo real.
- **Visualización de línea de tiempo** - Observa la distribución y frecuencia de las solicitudes de manera gráfica.
- **Filtros avanzados** - Filtra por método HTTP, código de estado, host, ruta URL, etc.
- **Comparación de solicitudes (Diff)** - Interfaz de comparación de diferencias en paralelo entre solicitudes originales y modificadas.

### 🎯 Manipulación de Solicitudes
- **Redireccionamiento (Map Rules)** - Redirecciona solicitudes a diferentes URLs utilizando expresiones regulares (Regex).
- **Respuestas simuladas (Mock Responses)** - Crea respuestas falsas con códigos de estado, cabeceras (headers) y cuerpos (body) personalizados.
- **Creador de solicitudes (Composer)** - Crea y envía solicitudes HTTP personalizadas para realizar pruebas de APIs.
- **Control de velocidad (Throttling)** - Simula condiciones de red lentas o limitaciones de ancho de banda.

---

## 🚀 Guía de Inicio Rápido

### Requisitos Previos
- **Node.js** 18 o superior
- **Android SDK** (para funciones de parcheo de APK)
- **macOS / Windows / Linux**

### Instalación y Desarrollo
```bash
# Clonar el repositorio
git clone https://github.com/danieldev23/trafexia.git
cd trafexia

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Compilar para Producción
```bash
# Compilar para la plataforma actual
npm run build

# Compilar para macOS (Intel)
npm run build:mac

# Compilar para macOS (Apple Silicon - M1/M2/M3)
npm run build:mac-arm

# Compilar para Windows
npm run build:win
```
Los archivos ejecutables generados se guardarán en la carpeta `dist-electron/`.

---

## 📖 Guía de Configuración Móvil

### Configuración en Android

#### Paso 1: Configurar el Proxy
1. Abre **Ajustes** → **Wi-Fi**.
2. Mantén pulsada tu red conectada y selecciona **Modificar red**.
3. Toca en **Opciones avanzadas**.
4. Establece el **Proxy** en **Manual**.
5. Introduce la **IP del Proxy** y el **Puerto** (que se muestran en Trafexia).
6. Toca en **Guardar**.

#### Paso 2: Instalar el Certificado CA
1. Descarga el certificado CA desde la aplicación Trafexia (vía código QR o enlace directo).
2. Ve a **Ajustes** → **Seguridad** → **Credenciales de seguridad**.
3. Selecciona **Instalar desde almacenamiento**.
4. Elige el archivo de certificado descargado para completar la instalación.

---

### Configuración en iOS

#### Paso 1: Configurar el Proxy
1. Abre **Ajustes** → **Wi-Fi**.
2. Toca el icono **(i)** junto a tu red conectada.
3. Desplázate hacia abajo hasta **Configurar proxy** y selecciona **Manual**.
4. Introduce el **Servidor (IP)** y el **Puerto** indicados en Trafexia.
5. Toca en **Guardar**.

#### Paso 2: Instalar y confiar en el Certificado CA
1. Usa el dispositivo iOS para descargar el perfil del certificado CA usando el enlace de Trafexia.
2. Abre **Ajustes** → **Perfil descargado** e instálalo.
3. Ve a **Ajustes** → **General** → **Información** → **Ajustes de confianza de los certificados**.
4. Activa la confianza completa para el certificado de Trafexia CA.

---

## 🔒 Seguridad y Privacidad
- **Utiliza esta herramienta únicamente para el desarrollo y pruebas de seguridad en tus propios dispositivos o aplicaciones autorizadas.**
- **Asegúrate de desinstalar el certificado CA de tu dispositivo una vez finalizadas las pruebas.**
- No utilices esta herramienta para actividades ilegales o interceptación no autorizada de datos.

## 📄 Licencia
Este proyecto está licenciado bajo la **Trafexia Source-Available License**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
