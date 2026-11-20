# Resumen del Proyecto - Biblioteca IPF

## Estructura del Proyecto

```
reactalgo/
├── src/
│   ├── app/                          # Rutas de la app (Expo Router)
│   │   ├── _layout.tsx               # Layout raíz con AppProvider
│   │   ├── (tabs)/                   # Pestañas principales
│   │   │   ├── _layout.tsx           # Layout de tabs
│   │   │   ├── index.tsx             # Catálogo (pantalla principal)
│   │   │   └── reservas.tsx          # Mis reservas
│   │   ├── libro/
│   │   │   └── [isbn].tsx            # Detalle de libro
│   │   ├── buscar.tsx                # Buscador con debounce
│   │   ├── escanear.tsx              # Escáner de código de barras
│   │   ├── reservar/
│   │   │   └── [isbn].tsx            # Confirmación de reserva (modal)
│   │   ├── permisos/
│   │   │   └── [recurso].tsx         # Pantalla de permisos (modal)
│   │   ├── login.tsx                 # Login del personal (modal)
│   │   ├── mostrador.tsx             # Panel de personal
│   │   ├── reserva.tsx               # Redirect a /reservas
│   │   └── +not-found.tsx            # Pantalla 404
│   │
│   ├── components/                   # Componentes reutilizables
│   │   ├── TarjetaLibro.tsx          # Tarjeta de libro para listas
│   │   ├── PantallaCarga.tsx         # Indicador de carga
│   │   └── PantallaError.tsx         # Pantalla de error con retry
│   │
│   ├── hooks/                        # Hooks personalizados
│   │   ├── useLibros.ts              # Carga catálogo con estados
│   │   └── usePermiso.ts             # Maneja permisos (cámara/notificaciones)
│   │
│   ├── context/
│   │   └── AppContext.tsx            # Estado global (préstamos, reservas, sesión)
│   │
│   ├── estructuras/                  # Estructuras de datos
│   │   ├── Pila.ts                   # Pila LIFO para "Vistos recientemente"
│   │   └── Cola.ts                   # Cola FIFO para listas de espera
│   │
│   ├── lib/
│   │   └── api.ts                    # API simulada (obtenerLibros, buscarLibros)
│   │
│   ├── data/
│   │   └── libros.ts                 # 17 libros de ejemplo
│   │
│   ├── types/
│   │   └── index.ts                  # Tipos TypeScript
│   │
│   └── constants/
│       ├── tema.ts                   # Colores, espaciados, tipografía
│       └── biblioteca.ts             # Constantes de negocio
│
├── app.json                          # Configuración de Expo
├── package.json                      # Dependencias
├── tsconfig.json                     # Configuración TypeScript
├── eslint.config.js                  # Configuración ESLint
├── README.md                         # Documentación principal
└── RESPUESTAS.md                     # Respuestas a las Partes B-E
```

## Funcionalidades Implementadas

### 1. Catálogo con Estados (✓)
- **Archivo**: `src/app/(tabs)/index.tsx`
- **Hook**: `src/hooks/useLibros.ts`
- Muestra: cargando, error (con reintentar), vacío, lista de libros
- "Vistos recientemente" con Pila (últimos 3)

### 2. Buscador con Debounce (✓)
- **Archivo**: `src/app/buscar.tsx`
- Lee parámetro `q` de la URL
- Debounce de 300ms
- Manejo de condiciones de carrera (flag `activo`)

### 3. Detalle de Libro Validado (✓)
- **Archivo**: `src/app/libro/[isbn].tsx`
- Valida ISBN (13 dígitos)
- Valida que el libro exista
- Agrega a "Vistos recientemente"

### 4. Escáner de Código de Barras (✓)
- **Archivo**: `src/app/escanear.tsx`
- Lee EAN-13
- Previene múltiples escaneos con flag `escaneado`
- Permite ingresar ISBN manualmente
- Manejo de ISBN no encontrado

### 5. Reserva con Pila/Cola (✓)
- **Archivo**: `src/app/reservar/[isbn].tsx`
- **Context**: `src/context/AppContext.tsx`
- Si hay ejemplares: préstamo por 7 días
- Si no hay: lista de espera con Cola
- No permite reservar dos veces

### 6. Mis Reservas (✓)
- **Archivo**: `src/app/(tabs)/reservas.tsx`
- Muestra préstamos activos
- Muestra reservas en espera (posición)
- Interruptor "Recordarme" (pendiente de implementar notificaciones)
- Botón "Devolver"

### 7. Permisos (✓)
- **Archivo**: `src/app/permisos/[recurso].tsx`
- **Hook**: `src/hooks/usePermiso.ts`
- 4 estados: cargando, concedido, preguntable, bloqueado
- Botón "Continuar" o "Abrir Ajustes"

### 8. Login y Mostrador (✓)
- **Archivos**: `src/app/login.tsx`, `src/app/mostrador.tsx`
- Credenciales: biblioteca / ipf2026
- Mostrador muestra libros con lista de espera
- Botón "Entregar al siguiente"

### 9. Navegación (✓)
- Tabs: Catálogo y Mis reservas
- Modales: reservar, permisos, login
- Redirect: /reserva → /reservas
- 404: +not-found.tsx

## Estructuras de Datos

### Pila (LIFO)
- **Uso**: Vistos recientemente
- **Métodos**: apilar(), desapilar(), verTope(), estaVacia(), tamanio, aArray()
- **Campos privados**: #items

### Cola (FIFO)
- **Uso**: Listas de espera
- **Métodos**: encolar(), desencolar(), verFrente(), estaVacia(), tamanio, aArray()
- **Optimizada**: Sin shift(), usa índices (#inicio, #fin)

## Context Global

**AppContext** provee:
- `prestamos`: Array de préstamos activos
- `listasEspera`: Record<ISBN, Cola<string>>
- `recientes`: Array de últimos 3 libros vistos
- `sesionActiva`: Boolean de sesión del personal
- `avisos`: Array de avisos dentro de la app

## Buenas Prácticas Aplicadas

✓ TypeScript sin `any`  
✓ ESLint sin errores  
✓ Componentes declarados a nivel de módulo  
✓ StyleSheet.create en todos los archivos  
✓ Efectos con limpieza  
✓ FlatList con keyExtractor (ISBN)  
✓ Estados de pantalla (cargando, error, vacío)  
✓ Accesibilidad (accessibilityRole, áreas táctiles 44x44)  
✓ Mensajes en español  
✓ Sin console.log  
✓ Organización de carpetas según consigna  

## Próximos Pasos para Completar

1. **Notificaciones**: Implementar programación de recordatorios
2. **Mostrador**: Implementar lógica de "Entregar al siguiente"
3. **Persistencia**: Agregar AsyncStorage (desafío opcional)
4. **Tests**: Agregar tests de Pila y Cola (desafío opcional)
5. **Modo oscuro**: Implementar con useColorScheme (desafío opcional)

## Comandos Útiles

```bash
# Iniciar app
npx expo start

# Verificar tipos
npx tsc --noEmit

# Ejecutar lint
npx eslint src --ext .ts,.tsx

# Diagnosticar problemas
npx expo-doctor
```

## Credenciales de Prueba

**Personal de biblioteca:**
- Usuario: `biblioteca`
- Clave: `ipf2026`

## Deep Links de Prueba

```
bibliotecaipf://
bibliotecaipf://libro/9788497592208
bibliotecaipf://buscar?q=borges
bibliotecaipf://escanear
bibliotecaipf://reservas
bibliotecaipf://login
bibliotecaipf://mostrador
```
