# Biblioteca IPF

**Trabajo Práctico N° 4 — App integradora: React Native II**

Alumno: **Veron Maximo**  
Instituto Politécnico Formosa  
Tecnicatura Superior en Desarrollo de Software Multiplataforma

## Descripción

App de biblioteca desarrollada con React Native y Expo que permite:
- Consultar el catálogo de libros
- Buscar por título o autor
- Escanear códigos de barras EAN-13
- Reservar libros y gestionar listas de espera
- Recibir recordatorios de devolución
- Panel de personal para entregar libros

## Versión del SDK

- **Expo SDK**: 58.0.26
- **React Native**: 0.88.1
- **Expo Router**: 58.0.32

## Cómo ejecutar el proyecto

### Requisitos previos
- Node.js 18+ instalado
- npm o yarn
- Expo Go app instalada en tu teléfono (opcional, para probar en dispositivo real)

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npx expo start
```

### Opciones de ejecución

```bash
# En navegador web
npx expo start --web

# En Android
npx expo start --android

# En iOS
npx expo start --ios
```

Luego escaneá el código QR con la app Expo Go (Android) o la cámara (iOS).

## Estructura de carpetas src/app

```
src/app/
├── _layout.tsx              # Layout raíz con AppProvider y configuración de notificaciones
├── (tabs)/                  # Pestañas principales
│   ├── _layout.tsx          # Layout de pestañas (Catálogo + Mis reservas)
│   ├── index.tsx            # Catálogo: lista de libros con vistos recientemente
│   └── reservas.tsx         # Mis reservas: préstamos y listas de espera
├── libro/
│   └── [isbn].tsx           # Detalle de un libro específico
├── buscar.tsx               # Buscador por título o autor (con debounce)
├── escanear.tsx             # Escáner de código de barras EAN-13
├── reservar/
│   └── [isbn].tsx           # Confirmación de reserva (modal)
├── permisos/
│   └── [recurso].tsx        # Pantalla previa de permisos (cámara/notificaciones)
├── login.tsx                # Login del personal (modal)
├── mostrador.tsx            # Panel de personal para entregar libros
├── reserva.tsx              # Redirect: /reserva → /reservas
└── +not-found.tsx           # Pantalla 404
```

### Navegadores

- **Stack raíz**: _layout.tsx principal
  - Contiene todas las pantallas excepto las de pestañas
  - Modales: reservar/[isbn], permisos/[recurso], login
- **Stack de la tab (tabs)**: (tabs)/_layout.tsx
  - Pestañas: Catálogo y Mis reservas
  - Dentro del Catálogo: libro/[isbn] (detalle)
- **Tab Navigator**: (tabs)/_layout.tsx
  - Catálogo (index.tsx)
  - Mis reservas (reservas.tsx)

## Configuración de app.json

### Plugins configurados

```json
"plugins": [
  "expo-router",
  ["expo-splash-screen", {
    "backgroundColor": "#208AEF",
    "image": "./assets/images/splash-icon.png",
    "imageWidth": 76
  }],
  ["expo-camera", {
    "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrir su ficha al instante.",
    "microphonePermission": false,
    "recordAudioAndroid": false
  }],
  ["expo-notifications", {
    "color": "#208AEF"
  }]
]
```

**Justificación:**
- **expo-camera**: Necesario para escanear códigos de barras
- **expo-notifications**: Necesario para recordatorios de devolución
- **microphonePermission: false**: La app NO graba audio, solo usa la cámara para códigos
- **recordAudioAndroid: false**: Evita pedir permisos de micrófono en Android

### blockedPermissions

```json
"blockedPermissions": [
  "android.permission.RECORD_AUDIO",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO"
]
```

**Justificación:**
La app NO necesita:
- **RECORD_AUDIO**: Solo escanea códigos visuales, no graba audio
- **Location**: No usa geolocalización
- **Storage/Media**: No accede a fotos ni archivos del dispositivo

Estos permisos están bloqueados para cumplir con el principio de mínimo privilegio.

## Tabla de permisos

| Recurso | Módulo | Cuándo se pide | Alternativa sin permiso |
|---------|--------|----------------|-------------------------|
| Cámara | expo-camera | Antes de escanear (pantalla /permisos/camara) | Ingresar ISBN manualmente |
| Notificaciones | expo-notifications | Al activar "Recordarme" en un préstamo | Mostrar avisos dentro de la app (/reservas) |

## Deep links de prueba

Con el scheme `bibliotecaipf`, los deep links son:

```
bibliotecaipf://                          → Catálogo
bibliotecaipf://libro/9788497592208      → Detalle de Cien años de soledad
bibliotecaipf://libro/123                → Detalle con ISBN inválido (mensaje de error)
bibliotecaipf://buscar?q=borges          → Búsqueda de "borges"
bibliotecaipf://escanear                 → Escáner de código de barras
bibliotecaipf://reservas                 → Mis reservas
bibliotecaipf://login                    → Login del personal
bibliotecaipf://mostrador                → Mostrador (requiere sesión)
bibliotecaipf://reserva                  → Redirect a /reservas
bibliotecaipf://ruta-inexistente         → Pantalla 404
```

## Estructuras de datos

### Pila (src/estructuras/Pila.ts)
- **Uso**: Vistos recientemente
- **Implementación**: LIFO con array y campos privados (#items)
- **Métodos**: apilar(), desapilar(), verTope(), estaVacia(), tamanio, aArray()

### Cola (src/estructuras/Cola.ts)
- **Uso**: Listas de espera de libros
- **Implementación**: FIFO optimizada con índices (sin shift())
- **Métodos**: encolar(), desencolar(), verFrente(), estaVacia(), tamanio, aArray()

## Context global

**AppContext** (src/context/AppContext.tsx) provee:
- Préstamos activos
- Listas de espera por ISBN
- Vistos recientemente (Pila)
- Sesión del personal
- Avisos dentro de la app

El provider está en el layout raíz (_layout.tsx).

## Credenciales de prueba

**Personal de biblioteca:**
- Usuario: `biblioteca`
- Clave: `ipf2026`

## Libros con ISBN real

Los dos primeros libros del catálogo tienen ISBN reales para probar el escáner:
1. **Cien años de soledad** - ISBN: 9788497592208
2. **El principito** - ISBN: 9788478887194

Reemplazá estos ISBN por los de tus libros reales si querés probar con ellos.

## Modo demostración

- **Recordatorios**: Se programan a los 15 segundos (en vez de 7 días) para pruebas rápidas
- **Notificaciones**: Requieren development build para ver el texto de propósito personalizado

## Desarrollo

### Comandos útiles

```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Ejecutar lint
npm run lint

# Diagnosticar problemas
npx expo-doctor

# Limpiar caché
npx expo start --clear
```

## Notas técnicas

- **Typed Routes**: Habilitado en app.json (experiments.typedRoutes)
- **React Compiler**: Habilitado para optimización automática
- **Sin expo-permissions**: Usa los hooks específicos de cada módulo
- **Sin console.log**: Código limpio para entrega
- **Accesibilidad**: Botones con accessibilityRole y áreas táctiles mínimas de 44x44

## Licencia

Este proyecto es parte del Trabajo Práctico N° 4 de la materia React Native II del Instituto Politécnico Formosa.
