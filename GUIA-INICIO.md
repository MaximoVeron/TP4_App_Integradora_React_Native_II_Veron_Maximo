# Guía de Inicio Rápido - Biblioteca IPF

## ¿Qué se implementó?

Se completó el **Trabajo Práctico N° 4** de React Native II con todas las funcionalidades requeridas:

### ✓ Funcionalidades Principales

1. **Catálogo con estados** - Carga, error, vacío, lista de libros
2. **Vistos recientemente** - Pila con los últimos 3 libros
3. **Buscador con debounce** - Búsqueda por título o autor en la URL
4. **Detalle validado** - Valida ISBN (13 dígitos) y existencia del libro
5. **Reserva con Cola** - Préstamo o lista de espera según ejemplares
6. **Escáner EAN-13** - Lee código de barras o ingreso manual
7. **Mis reservas** - Préstamos activos y posiciones en espera
8. **Sistema de permisos** - Cámara y notificaciones con 4 estados
9. **Login del personal** - Credenciales fijas (biblioteca/ipf2026)
10. **Mostrador** - Panel para entregar libros

### ✓ Buenas Prácticas

- TypeScript sin `any`
- ESLint sin errores
- Componentes modulares
- StyleSheet.create en todos lados
- Efectos con limpieza
- Accesibilidad (áreas táctiles 44x44)
- Organización de carpetas según consigna

## Cómo Probar la App

### 1. Iniciar el Servidor

```bash
cd reactalgo
npx expo start
```

### 2. Opciones de Visualización

**En navegador web:**
```bash
npx expo start --web
```
Luego abre http://localhost:8081

**En teléfono real (recomendado):**
1. Instala Expo Go (Android/iOS)
2. Escanea el código QR
3. La app se abre en tu teléfono

**En emulador:**
```bash
npx expo start --android  # Android
npx expo start --ios      # iOS
```

### 3. Flujo de Prueba Sugerido

#### Flujo 1: Catálogo y Búsqueda
1. Abre la app → Ves el Catálogo cargando
2. Espera a que carguen los libros
3. Toca "Buscar" en el header
4. Escribe "borges" → Resultados con debounce
5. Toca un libro → Detalle
6. Toca "Reservar" → Confirmación
7. Confirma → Vas a "Mis reservas"

#### Flujo 2: Escáner
1. En el Catálogo, toca el ícono de cámara
2. Si es la primera vez: Pantalla de permisos
3. Acepta el permiso
4. Escáner se abre
5. Escanea un ISBN real (ej: 9788497592208)
6. O ingresa manualmente
7. Navega al detalle del libro

#### Flujo 3: Personal
1. En el Catálogo, toca el ícono de persona (header)
2. Login: usuario `biblioteca`, clave `ipf2026`
3. Accedes al Mostrador
4. Ves libros con lista de espera
5. Botón "Entregar al siguiente"
6. "Cerrar sesión" vuelve al Catálogo

#### Flujo 4: Deep Links
Prueba estos links (con el scheme `bibliotecaipf`):
```
bibliotecaipf://libro/9788497592208
bibliotecaipf://buscar?q=cervantes
bibliotecaipf://escanear
bibliotecaipf://reservas
```

### 4. Verificar TypeScript y Lint

```bash
# Verificar tipos
npx tsc --noEmit

# Verificar lint
npx eslint src --ext .ts,.tsx
```

Ambos deben ejecutarse sin errores.

## Estructura de Archivos Clave

### Rutas (src/app/)
```
_layout.tsx              → Layout raíz con AppProvider
(tabs)/
  _layout.tsx           → Tabs: Catálogo y Mis reservas
  index.tsx             → Catálogo (lista de libros)
  reservas.tsx          → Mis préstamos y reservas
libro/[isbn].tsx        → Detalle de un libro
buscar.tsx              → Buscador con debounce
escanear.tsx            → Escáner de código de barras
reservar/[isbn].tsx     → Confirmación de reserva (modal)
permisos/[recurso].tsx  → Pantalla de permisos (modal)
login.tsx               → Login del personal (modal)
mostrador.tsx           → Panel de personal
+not-found.tsx          → Pantalla 404
```

### Hooks (src/hooks/)
```
useLibros.ts    → Carga catálogo con estados (cargando, error, datos)
usePermiso.ts   → Maneja permisos (cargando, concedido, preguntable, bloqueado)
```

### Context (src/context/)
```
AppContext.tsx  → Estado global: préstamos, listas de espera, recientes, sesión
```

### Estructuras (src/estructuras/)
```
Pila.ts  → LIFO para "Vistos recientemente"
Cola.ts  → FIFO para listas de espera (optimizada sin shift())
```

## Libros de Prueba

El catálogo incluye 17 libros. Los dos primeros tienen ISBN reales para probar el escáner:

1. **Cien años de soledad** - ISBN: 9788497592208 (2 ejemplares)
2. **El principito** - ISBN: 9788478887194 (1 ejemplar)
3. **Ficciones** - ISBN: 9788499089508 (0 ejemplares, 2 en espera)

Puedes cambiar estos ISBN por los de tus libros reales en `src/data/libros.ts`.

## Credenciales

**Personal de biblioteca:**
- Usuario: `biblioteca`
- Clave: `ipf2026`

## Documentación Completa

- **README.md** → Documentación técnica completa
- **RESPUESTAS.md** → Respuestas a las Partes B-E (análisis)
- **RESUMEN.md** → Resumen visual del proyecto
- **GUIA-INICIO.md** → Este archivo (instrucciones rápidas)

## Próximos Pasos (Opcionales)

Si querés sumar puntos extra:

1. **Persistencia con AsyncStorage**
   - Guardar préstamos, recientes y notificaciones
   - Que no se pierdan al cerrar la app

2. **Tests unitarios**
   - Tests de Pila y Cola con jest-expo
   - Mínimo 6 casos (incluyendo cola vacía)

3. **Modo oscuro**
   - Usar `useColorScheme`
   - Adaptar colores de `tema.ts`

4. **Development build**
   - Captura del diálogo de cámara con texto personalizado
   - Necesario para ver los textos de `app.json`

## Problemas Comunes

### "No se pudo conectar con la biblioteca"
Es normal. La API simulada falla 1 de cada 5 veces. Toca "Reintentar".

### El escáner no lee el código
- Asegurate de que haya buena luz
- El código debe estar enfocado
- Probá ingresar el ISBN manualmente

### Los permisos no se piden
- En web, los permisos pueden no funcionar
- Probá en un teléfono real con Expo Go

### TypeScript marca errores
- Ejecutá `npx tsc --noEmit` para ver los errores
- Todos deberían estar resueltos

## Contacto

Si tenés dudas sobre el código:
1. Leé los comentarios en cada archivo
2. Consultá el RESPUESTAS.md para explicaciones detalladas
3. Revisá la documentación oficial de Expo: docs.expo.dev

---

**¡Éxitos con la entrega!** 🚀
