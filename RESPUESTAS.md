# RESPUESTAS - Trabajo Práctico N° 4

**Alumno**: Veron Maximo  
**App**: Biblioteca IPF

---

## Parte B · Estado, efectos y renderizado

### B1. El ciclo de vida de useLibros

#### a) Renders desde que se monta el Catálogo hasta que aparece la lista

**Render 1 (montaje inicial):**
- `libros`: [] (array vacío)
- `cargando`: true
- `error`: null
- **Qué se ve**: Pantalla "Cargando catálogo..."
- **Por qué**: useState inicializa con estos valores

**Render 2 (después de que obtenerLibros() resuelve ~800ms):**
- `libros`: [17 libros]
- `cargando`: false
- `error`: null
- **Qué se ve**: Lista de libros con "Vistos recientemente" arriba
- **Por qué**: El efecto ejecutó obtenerLibros() y actualizó el estado con setLibros()

**Total: 2 renders** (uno inicial con cargando=true, otro con los datos)

#### Cuando obtenerLibros() falla y se toca "Reintentar"

**Render 1 (montaje):**
- `cargando`: true, `libros`: [], `error`: null
- Se ve: "Cargando catálogo..."

**Render 2 (después de 800ms, falla la petición):**
- `cargando`: false, `libros`: [], `error`: "No se pudo conectar con la biblioteca."
- Se ve: Mensaje de error con botón "Reintentar"

**Render 3 (al tocar "Reintentar"):**
- `cargando`: true, `libros`: [], `error`: null
- Se ve: "Cargando catálogo..." nuevamente
- **Por qué**: reintentar() incrementa el estado `intento`, que está en el array de dependencias del useEffect. El efecto se limpia y se re-ejecuta.

**Render 4 (después de 800ms, si tiene éxito):**
- `cargando`: false, `libros`: [17 libros], `error`: null
- Se ve: Lista de libros

#### b) ¿Se desmonta el Catálogo al cambiar de pestaña o abrir un detalle?

**Al cambiar a la pestaña "Mis reservas":**
- **NO se desmonta**. Las pestañas en Expo Router mantienen los componentes montados para preservar el estado.
- **Limpieza del efecto**: Se ejecuta cuando el componente se desmonta O cuando cambian las dependencias.
- **Verificación**: Agregué temporalmente `console.log('cleanup')` en la limpieza del efecto de useLibros. Al cambiar de pestaña, NO se ejecuta.

**Al abrir un detalle (/libro/[isbn]):**
- **NO se desmonta**. El detalle se abre dentro del Stack de la tab "Catálogo", por lo que el Catálogo sigue montado debajo.
- **Limpieza del efecto**: Solo se ejecuta si cambia `intento` o si el componente se desmonta (lo cual no ocurre al navegar al detalle).

**Situaciones reales donde se ejecuta la limpieza:**
1. Cuando se llama `reintentar()` (cambia `intento`)
2. Si el componente se desmontara (ej: si las tabs usaran `unmountOnBlur: true`, pero no es el caso)

#### c) ¿Por qué no se puede pasar una función async directamente a useEffect?

```typescript
// ❌ INCORRECTO - No se puede hacer esto:
useEffect(async () => {
  const datos = await obtenerLibros();
  setLibros(datos);
}, []);
```

**Razón**: useEffect espera que la función retorne una función de limpieza (o undefined). Una función async retorna una Promise, no una función. React no sabe cómo manejar una Promise como cleanup.

**Cómo lo resolví** (src/hooks/useLibros.ts):

```typescript
useEffect(() => {
  let activo = true;
  setCargando(true);
  setError(null);

  obtenerLibros()
    .then((datos) => {
      if (activo) {
        setLibros(datos);
        setCargando(false);
      }
    })
    .catch((err: Error) => {
      if (activo) {
        setError(err.message);
        setCargando(false);
      }
    });

  return () => {
    activo = false; // Limpieza: marcar como inactivo
  };
}, [intento]);
```

Uso `.then()` y `.catch()` en lugar de async/await. La función de limpieza marca `activo = false` para evitar actualizar estado si el componente se desmontó antes de que termine la petición.

#### d) ¿Cómo implementé reintentar?

```typescript
const [intento, setIntento] = useState(0);

const reintentar = () => setIntento((i) => i + 1);

useEffect(() => {
  // ... lógica de obtención
}, [intento]); // intento en el array de dependencias
```

**Qué hace que se re-ejecute**: Al incrementar `intento`, React detecta que cambió una dependencia del useEffect y lo re-ejecuta.

**¿Por qué `intento` y no otro valor?**
- Necesito un valor que cambie cada vez que se llama `reintentar()`.
- Podría usar un timestamp o un contador, pero `intento` es más semántico.
- No uso un booleano (`reintentar: true/false`) porque necesito poder reintentar múltiples veces, y un booleano solo alternaría entre dos valores.
- `intento` es un número que siempre crece, garantizando que el efecto se re-ejecute.

---

### B2. La condición de carrera del buscador

#### Tabla completada

| Momento | Qué pasa | Sin limpieza: qué se ve | Con tu código: qué se ve |
|---------|----------|-------------------------|--------------------------|
| t = 0 ms | Escribe "bor" → se pide buscarLibros("bor"), que tarda 1400ms | Input: "bor" | Input: "bor" |
| t = 200 ms | Escribe "borges" → se pide buscarLibros("borges"), que tarda 300ms | Input: "borges" | Input: "borges" |
| t = 500 ms | Llega la respuesta de "borges" | Resultados de "borges" (correcto) | Resultados de "borges" (correcto) |
| t = 1400 ms | Llega la respuesta de "bor" | **Resultados de "bor"** (¡INCORRECTO! Se sobreescriben los de "borges") | **Resultados de "borges"** (se descarta la respuesta vieja) |

#### a) ¿Qué hace exactamente la limpieza de tu efecto?

En src/app/buscar.tsx:

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    let activo = true;
    setCargando(true);

    buscarLibros(texto)
      .then((datos) => {
        if (activo) { // Solo actualizar si el efecto sigue activo
          setResultados(datos);
          setCargando(false);
        }
      });

    return () => {
      activo = false; // Limpieza: marcar como inactivo
    };
  }, MS_DEBOUNCE_BUSQUEDA);

  return () => {
    clearTimeout(timeoutId); // Limpiar el timeout anterior
  };
}, [texto]);
```

**Qué hace la limpieza:**
1. **clearTimeout(timeoutId)**: Cancela el timeout anterior si el usuario sigue escribiendo (debounce).
2. **activo = false**: Cuando el efecto se re-ejecuta (porque cambió `texto`), la limpieza marca la petición anterior como inactiva. Cuando llegue la respuesta, la condición `if (activo)` será falsa y no actualizará el estado.

**¿En qué momento se ejecuta?**
- La limpieza del timeout se ejecuta inmediatamente cuando `texto` cambia (antes de que se ejecute el nuevo efecto).
- La limpieza del `activo = false` se ejecuta cuando el efecto anterior se "desmonta" (antes de que se ejecute el nuevo efecto).

#### b) ¿Funciona la solución del compañero?

```typescript
// Propuesta del compañero:
if (texto === q) setResultados(datos);
```

**NO funciona correctamente.** El problema es la clausura (closure):

- Cuando se ejecuta `buscarLibros("bor")`, la función `.then()` captura el valor de `q` en ese momento: "bor".
- Cuando se ejecuta `buscarLibros("borges")`, la función `.then()` captura el valor de `q`: "borges".
- Cuando llega la respuesta de "borges" (t=500ms), compara `texto` ("borges") con `q` ("borges") → coinciden, se actualiza. ✓
- Cuando llega la respuesta de "bor" (t=1400ms), compara `texto` ("borges") con `q` ("bor") → NO coinciden, no se actualiza. ✓

**En este caso específico, funciona.** Pero hay un problema: `q` y `texto` son el mismo valor (ambos vienen del estado). La comparación siempre será verdadera si la respuesta llega en orden, y falsa si llega desordenada.

**El problema real**: Si el usuario escribe "borges" y la respuesta de "borges" llega, actualiza. Luego escribe "borges2" y la respuesta de "borges2" llega, actualiza. Pero si la respuesta de "borges" llega DESPUÉS (por demora de red), compara "borges2" === "borges" → false, no actualiza. Funciona.

**Sin embargo**, si usamos `texto` (del estado) en lugar de `q` (parámetro capturado), el valor de `texto` dentro del `.then()` será el valor ACTUAL al momento de ejecutar el .then(), no el valor al momento de hacer la petición. Esto es incorrecto porque `texto` puede haber cambiado.

**La solución con `activo` es más robusta**: no depende de comparar valores, solo marca si el efecto sigue vigente.

#### c) ¿Qué pasa con la URL y el botón atrás?

**Con router.setParams:**
- La URL cambia a `/buscar?q=bor`, luego a `/buscar?q=borges`.
- El botón atrás NO apila pantallas, solo actualiza el parámetro.
- Al tocar atrás, vuelve a la pantalla anterior (Catálogo), no a `/buscar?q=bor`.

**Con router.push:**
- Cada cambio de texto apilaría una nueva pantalla: `/buscar?q=bor` → `/buscar?q=borges` → etc.
- El botón atrás navegaría por cada versión de la búsqueda.
- Esto es INCORRECTO para un buscador.

**¿Qué cambiaría si usara router.push?**
- Se acumularían pantallas en el Stack.
- El usuario tendría que tocar atrás múltiples veces para salir del buscador.
- La experiencia sería mala y confusa.

---

### B3. Mutar o reemplazar

#### a) ¿Qué muestra el texto después de tocar "Anotarme" tres veces?

```typescript
const [espera] = useState(() => new Cola<string>());

function anotarme() {
  espera.encolar('Ana');
}

return (
  <>
    <Text>Personas en espera: {espera.tamanio}</Text>
    <Button title="Anotarme" onPress={anotarme} />
  </>
);
```

**Respuesta**: Muestra "Personas en espera: 0" SIEMPRE, incluso después de tocar tres veces.

**¿Por qué?**
- `useState` solo re-renderiza cuando se llama al setter (el segundo elemento del array).
- En este código, se usa `const [espera] = ...`, sin setter.
- `espera.encolar('Ana')` muta el objeto Cola, pero React NO detecta el cambio porque el estado (la referencia al objeto) no cambió.
- React solo re-renderiza cuando cambia la referencia del estado, no cuando muta el contenido.

#### b) ¿Por qué el número "salta" a 3 cuando se escribe en el TextInput?

**Explicación**:
- Al escribir en el TextInput, se ejecuta otro `setState` (del TextInput controlado).
- Este `setState` dispara un re-render de TODO el componente.
- En el re-render, se lee `espera.tamanio` nuevamente, que ahora es 3 (porque se mutó 3 veces).
- El texto "salta" de 0 a 3 de golpe.

**¿Por qué un error que aparece "a veces" es peor que uno que aparece siempre?**
- Un error consistente (siempre aparece) es fácil de detectar y corregir.
- Un error intermitente (aparece "a veces" o "a veces no") es más difícil de debuggear porque:
  - Depende del timing de otros setState.
  - Puede pasar desapercibido en pruebas.
  - Es más difícil de reproducir.
- En este caso, el error aparece solo cuando hay OTRO setState que fuerza un re-render. Si no hay otro setState, el error nunca se ve (pero existe).

#### c) ¿Cómo resolví este problema en mi Context?

En src/context/AppContext.tsx:

```typescript
const [listasEspera, setListasEspera] = useState<Record<string, Cola<string>>>(() => {
  const inicial: Record<string, Cola<string>> = {};
  for (const [isbn, personas] of Object.entries(ESPERAS_INICIALES)) {
    inicial[isbn] = new Cola(personas);
  }
  return inicial;
});

// Al encolar:
const reservar = useCallback((libro: Libro) => {
  // ...
  setListasEspera((prev) => {
    const lista = prev[libro.isbn] || new Cola<string>();
    const nuevaLista = new Cola(lista.aArray()); // Crear nueva Cola
    nuevaLista.encolar('Veron Maximo');
    return { ...prev, [libro.isbn]: nuevaLista }; // Nueva referencia
  });
}, []);
```

**Mi solución**: Crear una NUEVA Cola a partir de la anterior, en lugar de mutar la existente. Esto cambia la referencia del estado, lo que dispara el re-render.

**Comparación con otras alternativas:**

| Alternativa | Ventaja | Costo |
|-------------|---------|-------|
| **Crear nueva Cola (mi solución)** | Simple, inmutable, fácil de entender | Cada cambio crea un nuevo objeto (costo de memoria) |
| **Contador de versión** | No crea objetos nuevos | Hay que mantener un estado adicional, más complejo |
| **useReducer** | Centraliza la lógica de actualización | Más verboso, requiere definir acciones |

**Mi elección**: Crear una nueva Cola es la solución más simple y clara. El costo de memoria es mínimo (solo se crea una Cola nueva cuando cambia la lista de espera, no en cada render).

---

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en tu app | Por qué ahí y no en otro lugar |
|------|----------------------|--------------------------------|
| **Texto del buscador** | Estado local de /buscar + URL (parámetro q) | Es efímero, solo existe en esa pantalla. La URL permite deep links y compartir búsquedas. No tiene sentido compartirlo con otras pantallas. |
| **Préstamos y reservas** | AppContext (estado global) | Los necesita múltiples pantallas: /reservas, /mostrador, /libro/[isbn] (para saber si ya reservó). Si estuviera en estado local de /reservas, otras pantallas no podrían acceder. |
| **Listas de espera** | AppContext (estado global) | Las necesita /libro/[isbn] (para mostrar posición), /reservas (para mostrar reservas en espera), /mostrador (para entregar). Es un dato compartido que cambia desde múltiples lugares. |
| **Vistos recientemente** | AppContext (Pila en estado global) | Los necesita /catalogo (para mostrar los 3 recientes) y /libro/[isbn] (para agregar al abrir). Si estuviera en estado local de /catalogo, se perdería al navegar. |
| **Sesión del personal** | AppContext (estado global) | La necesitan /login (para iniciar sesión), /mostrador (para verificar si hay sesión), y el header del Catálogo (para mostrar el link a /login solo si no hay sesión). |
| **Ejemplares disponibles de un libro** | Se calcula a partir de LIBROS (datos estáticos) y préstamos (AppContext) | No se guarda como estado separado para evitar inconsistencias. Se calcula como: `libro.ejemplares - préstamosActivos.filter(p => p.isbn === libro.isbn && p.origen === 'estante').length`. Si se guardara, habría que sincronizarlo con los préstamos, lo que es propenso a errores. |
| **Estado del permiso de cámara** | Hook usePermiso (estado local del componente /escanear y /permisos/camara) | Solo lo necesitan esas dos pantallas. No tiene sentido globalizarlo porque otras pantallas no lo usan. Además, el estado del permiso puede cambiar (la persona puede ir a Ajustes y cambiarlo), por lo que debe leerse en el momento. |
| **Identificador de la notificación programada** | Prestamo.notificacionId (AppContext) | Necesita persistir mientras el préstamo existe, y poder cancelarse desde /reservas. Si estuviera en estado local de /reservas, se perdería al cerrar la app. |

#### ¿Qué componentes se re-renderizan cuando cambia el value del Context?

**Todos los componentes que usan `useApp()`** se re-renderizan cuando cualquier valor del Context cambia.

**¿El Catálogo se re-renderiza al activar un recordatorio en otra pestaña?**
- **SÍ**, si usa `useApp()` para acceder a `recientes` (aunque no use `prestamos`).
- **Razón**: React re-renderiza TODO el componente cuando el Context cambia, aunque solo use una parte del value.

**¿Qué podría hacer para evitarlo?**
1. **Dividir el Context**: Crear `RecientesContext`, `PrestamosContext`, etc. Cada uno con su propio provider.
2. **useMemo en el value**: Memorizar las partes del value que no cambian.
3. **React.memo en los componentes**: Evita re-renderizados si las props no cambian (pero no ayuda con Context).

**¿Vale la pena en una app de este tamaño?**
- **NO**. La app es pequeña (menos de 20 pantallas), y los re-renderizados son rápidos.
- Dividir el Context agregaría complejidad innecesaria.
- Solo valdría la pena si hay un problema de performance medible (con React DevTools Profiler).
- En este caso, la simplicidad es más importante que la optimización prematura.

---

## Parte C · Navegación y rutas

### C1. La pila en tu app

#### Tabla de pilas

| # | Acción | Pilas resultantes (de base a tope) |
|---|--------|-----------------------------------|
| 1 | Abre la app | **Stack raíz**: [(tabs)] <br> **Stack de tab Catálogo**: [index] |
| 2 | Toca un libro del Catálogo | **Stack raíz**: [(tabs)] <br> **Stack de tab Catálogo**: [index, libro/9788497592208] |
| 3 | Toca "Reservar" | **Stack raíz**: [(tabs), reservar/9788497592208] <br> **Stack de tab Catálogo**: [index, libro/9788497592208] |
| 4 | Toca "Confirmar" | **Stack raíz**: [(tabs)] <br> **Stack de tab Mis reservas**: [reservas] <br> *(Se usa `router.replace` para ir a /reservas sin apilar)* |
| 5 | Toca atrás (Android) | **Stack raíz**: [(tabs)] <br> **Stack de tab Catálogo**: [index] <br> *(Vuelve al Catálogo porque el detalle ya no está en la pila)* |
| 6 | Toca la tab "Catálogo" | **Stack raíz**: [(tabs)] <br> **Stack de tab Catálogo**: [index] <br> *(No cambia, ya estaba en Catálogo)* |

#### a) ¿Qué método usaste en el paso 4?

**Método usado**: `router.replace('/(tabs)/reservas')`

**¿Por qué?**
- Quiero ir a /reservas SIN poder volver atrás a la confirmación.
- `replace` reemplaza la pantalla actual en la pila, por lo que /reservar/[isbn] desaparece.

**¿Qué habría pasado con otros métodos?**

| Método | Resultado | ¿Por qué no lo usé? |
|--------|-----------|---------------------|
| `push('/reservas')` | Apila /reservas encima de /reservar/[isbn]. Al tocar atrás, vuelve a la confirmación. | No quiero que el usuario pueda volver a la confirmación. |
| `replace('/reservas')` | Reemplaza /reservar/[isbn] con /reservas. Al tocar atrás, vuelve al detalle del libro. | ¡Esto es lo que quiero! |
| `dismissTo('/reservas')` | Cierra todos los modales hasta llegar a /reservas (o falla si no existe). | No es un modal, es una pantalla normal. |
| `back()` | Vuelve a la pantalla anterior (detalle del libro). | No quiero volver al detalle, quiero ir a /reservas. |

**Elegí `replace`** porque quiero ir a /reservas y eliminar la confirmación de la pila, pero manteniendo el resto del historial (detalle, catálogo).

#### b) En el paso 6, ¿qué pantalla ve la persona?

**Ve el Catálogo (index), NO el detalle.**

**¿Por qué?**
- En el paso 5, al tocar atrás desde /reservas, React Navigation necesita decidir a dónde ir.
- /reservas está en el Stack de la tab "Mis reservas". Al tocar atrás, se desmonta el Stack de "Mis reservas" y se muestra el Stack de la tab "Catálogo".
- El Stack de "Catálogo" tiene: [index] (porque en el paso 4 usé `replace` y eliminé el detalle).
- Por lo tanto, ve el Catálogo.

**¿Es el comportamiento correcto?**
- **SÍ**, es correcto para esta app.
- Después de confirmar una reserva, el usuario quiere ver sus reservas (/reservas).
- Si toca atrás, quiere volver al flujo principal (Catálogo), no a la confirmación ni al detalle.
- Es el flujo natural: Catálogo → Detalle → Reservar → Confirmar → Mis reservas → (atrás) → Catálogo.

---

### C2. El escáner que dispara de más

#### a) ¿Qué pasaría si llamara a router.push sin protección?

**Problema**: `onBarcodeScanned` se ejecuta muchas veces por segundo mientras el código está frente a la cámara.

**Sin protección**:
- Cada escaneo llamaría a `router.push('/libro/[isbn]')`.
- Se apilarían múltiples pantallas de detalle en el Stack.
- El usuario vería el mismo detalle muchas veces.
- Al tocar atrás, tendría que volver por cada pantalla apilada.
- Podría causar un crash si se apilan demasiadas pantallas.

**Relación con la cola de acciones de navegación del TP 2**:
- En el TP 2, vimos que las acciones de navegación se encolan.
- Si se llaman muchas veces en rápido, se procesan una tras otra.
- Esto causa el problema de apilar múltiples pantallas.

#### b) ¿Usé useState o useRef? ¿Por qué no alcanza con useState?

**Usé useState**:
```typescript
const [escaneado, setEscaneado] = useState(false);

const handleBarcodeScanned = (data) => {
  if (escaneado) return; // No hacer nada si ya se escaneó
  setEscaneado(true);
  router.replace(`/libro/${data.data}`);
};
```

**¿Por qué un useState puesto en true NO alcanza?**
- En teoría, sí alcanza para este caso.
- El problema sería si `setEscaneado(true)` no se ejecuta antes del siguiente escaneo.
- Pero en la práctica, React actualiza el estado sincrónicamente dentro del mismo evento.
- **Sin embargo**, hay un problema: si el usuario vuelve al escáner (por ejemplo, si el ISBN no existe), `escaneado` sigue en `true` y no puede escanear de nuevo.

**Solución alternativa con useRef**:
```typescript
const escaneadoRef = useRef(false);

const handleBarcodeScanned = (data) => {
  if (escaneadoRef.current) return;
  escaneadoRef.current = true;
  router.replace(`/libro/${data.data}`);
};
```

**Ventaja de useRef**: No dispara re-renders, y es más rápido que useState.
**Desventaja**: No es reactivo, si necesitás mostrar algo en la UI basado en `escaneado`, tenés que combinarlo con useState.

**En mi caso**: Usé useState porque es suficiente y más simple. Si el ISBN no existe, permito volver a escanear después de 2 segundos:
```typescript
if (!libro) {
  setError('Este libro no está en nuestro catálogo.');
  setTimeout(() => setEscaneado(false), 2000);
}
```

#### c) ¿Por qué conviene replace para ir del escáner al detalle?

**Con `replace`**:
- Reemplaza /escanear con /libro/[isbn] en la pila.
- Al tocar atrás, vuelve al Catálogo (o a la pantalla anterior al escáner).
- Flujo: Catálogo → Escanear → Detalle → (atrás) → Catálogo.

**Con `push`**:
- Apila /libro/[isbn] encima de /escanear.
- Al tocar atrás, vuelve al escáner.
- Flujo: Catálogo → Escanear → Detalle → (atrás) → Escanear → (atrás) → Catálogo.

**¿Qué vería la persona al tocar atrás si usara push?**
- Volvería al escáner.
- Esto es INCORRECTO porque ya escaneó el libro y quiere ver el detalle.
- No tiene sentido volver al escáner después de ver el detalle.

**Por eso uso `replace`**: El escáner es un "paso intermedio" que desaparece después de escanear.

#### d) Si el ISBN leído no está en el catálogo, ¿qué hace mi app?

**En src/app/escanear.tsx**:
```typescript
const libro = LIBROS.find((l) => l.isbn === isbn);
if (!libro) {
  setError('Este libro no está en nuestro catálogo.');
  setTimeout(() => setEscaneado(false), 2000);
  return;
}
```

**Qué hace**:
1. Muestra un mensaje de error: "Este libro no está en nuestro catálogo."
2. Espera 2 segundos.
3. Permite volver a escanear (`setEscaneado(false)`).

**¿Cómo evito que el mismo aviso aparezca diez veces seguidas?**
- Uso el flag `escaneado` para bloquear múltiples escaneos.
- Después de mostrar el error, espero 2 segundos antes de permitir escanear de nuevo.
- Esto evita que el mismo código se escanee 10 veces en un segundo y muestre 10 mensajes de error.

---

### C3. Deep links y rutas protegidas

#### Tabla de deep links

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de tu código lo decide |
|------|-------------------|----------------------------|----------------------------------|
| `bibliotecaipf://libro/9788497592208` | Detalle de "Cien años de soledad" | Stack raíz: [(tabs), libro/9788497592208] <br> Stack de tab Catálogo: [index] | src/app/libro/[isbn].tsx - Renderiza el detalle si el ISBN existe |
| `bibliotecaipf://libro/123` | Mensaje "ISBN inválido" con link al Catálogo | Stack raíz: [(tabs), libro/123] <br> Stack de tab Catálogo: [index] | src/app/libro/[isbn].tsx - Valida que el ISBN tenga 13 dígitos |
| `bibliotecaipf://buscar?q=borges` | Buscador con resultados de "borges" | Stack raíz: [(tabs), buscar] <br> Stack de tab Catálogo: [index] | src/app/buscar.tsx - Lee el parámetro q de la URL |
| `bibliotecaipf://mostrador` (sin sesión) | Pantalla de login | Stack raíz: [(tabs), login] | src/app/_layout.tsx - Stack.Screen para /mostrador. Si no hay sesión, debe mostrar /login (falta implementar protección) |
| `bibliotecaipf://reserva` | Pantalla "Mis reservas" | Stack raíz: [(tabs)] <br> Stack de tab Mis reservas: [reservas] | src/app/reserva.tsx - Redirect a /(tabs)/reservas |
| `bibliotecaipf://escanear` (cámara bloqueada) | Pantalla de permisos de cámara | Stack raíz: [(tabs), permisos/camara] | src/app/escanear.tsx - Si !permiso.granted, muestra botón para pedir permiso |

#### ¿Por qué /libro/123 llega a tu pantalla de detalle?

**Respuesta**: Porque Expo Router hace matching de rutas basado en la estructura de carpetas. Cualquier URL que coincida con `/libro/[isbn]` se dirige a esa pantalla, sin importar si el ISBN existe.

**¿De quién es la responsabilidad?**
- **De la pantalla** (src/app/libro/[isbn].tsx).
- La pantalla debe validar que el ISBN sea válido (13 dígitos) y que el libro exista.
- Si no es válido o no existe, debe mostrar un mensaje de error claro.

---

### C4. Foco, montaje y primer plano

#### a) ¿Qué evento detecta cada herramienta?

| Herramienta | Qué evento detecta |
|-------------|-------------------|
| `useEffect` con `[]` | Se ejecuta UNA VEZ cuando el componente se monta. No se ejecuta al volver a enfocar. |
| `useFocusEffect` | Se ejecuta cada vez que la pantalla recibe foco (cuando se vuelve visible). |
| `AppState` | Detecta cambios en el estado de la app: `active` (primer plano), `background` (segundo plano), `inactive` (transición). |

#### b) La persona sale a Ajustes, habilita notificaciones y vuelve

**¿Cuál se entera?**
- **`AppState`**: Detecta que la app pasó a `background` (al salir a Ajustes) y luego a `active` (al volver).
- **`useFocusEffect`**: NO se ejecuta porque la pantalla no perdió el foco (solo la app pasó a segundo plano).
- **`useEffect` con `[]`**: NO se ejecuta porque el componente ya estaba montado.

**¿Y si va a la pestaña Catálogo y vuelve a "Mis reservas"?**
- **`useFocusEffect`**: Se ejecuta cuando la pestaña "Mis reservas" recibe foco.
- **`AppState`**: NO detecta cambio (la app sigue en primer plano).
- **`useEffect` con `[]`**: NO se ejecuta (el componente sigue montado).

#### c) ¿Cuál usé en mi app?

**En mi app**: No usé ninguna de estas herramientas explícitamente para verificar el estado de notificaciones.

**¿Por qué?**
- El estado del permiso se guarda en el hook `usePermiso` y se actualiza cuando se solicita el permiso.
- Si la persona va a Ajustes y cambia el permiso, la app NO se entera automáticamente.
- **Problema**: Si la persona desactiva las notificaciones en Ajustes y vuelve, la app sigue pensando que tiene permiso.

**Caso en que mi pantalla muestra un estado viejo**:
- La persona activa "Recordarme" en un préstamo.
- Sale a Ajustes y desactiva las notificaciones de la app.
- Vuelve a la app.
- La app sigue mostrando el interruptor activado, pero las notificaciones no llegan.

**Cómo lo resolvería**:
- Usar `AppState` para detectar cuando la app vuelve a primer plano.
- Volver a consultar el estado del permiso con `Notifications.getPermissionsAsync()`.
- Actualizar el estado local si cambió.

---

## Parte D · Permisos en tu app

### D1. Recorrido completo de la cámara

#### Android 14, app recién instalada

| # | Acción | Qué muestra tu app | status | canAskAgain |
|---|--------|-------------------|--------|-------------|
| 1 | Toca "Escanear" por primera vez | Pantalla /permisos/camara con botón "Continuar" | undetermined | true |
| 2 | "Continuar" → "No permitir" | Vuelve al Catálogo (o a donde estaba) | denied | true |
| 3 | Toca "Escanear" otra vez | Pantalla /permisos/camara con botón "Continuar" | denied | true |
| 4 | "Continuar" → "No permitir" | Vuelve al Catálogo | denied | false (en Android 14, después de 2 rechazos) |
| 5 | Toca "Escanear" otra vez | Pantalla /permisos/camara con botón "Abrir Ajustes" | denied | false |
| 6 | "Abrir Ajustes" → habilita cámara → vuelve | Pantalla /escanear con la cámara activa | granted | true |

#### a) Recorrido en iOS

**Diferencia principal**: En iOS, solo hay UNA oportunidad de pedir permiso. Después de rechazar, queda bloqueado.

| # | Acción | status | canAskAgain | Diferencia con Android |
|---|--------|--------|-------------|------------------------|
| 1 | Toca "Escanear" | undetermined | true | Igual |
| 2 | "No permitir" | denied | **false** | En iOS, no se puede volver a preguntar |
| 3 | Toca "Escanear" otra vez | denied | false | Muestra "Abrir Ajustes" directamente |

**¿En qué paso cambia el resultado?**
- En el paso 3 (iOS) vs paso 5 (Android).
- En iOS, después del primer rechazo, ya no se puede pedir permiso desde la app.
- En Android, se puede pedir dos veces antes de bloquear.

#### b) Línea que decide entre "Continuar" y "Abrir Ajustes"

En src/app/permisos/[recurso].tsx:
```typescript
const textoBoton = estado === 'bloqueado' ? 'Abrir Ajustes' : 'Continuar';
```

**¿Qué campo usa?**
- Usa `estado`, que se calcula en `usePermiso`:
```typescript
if (permisoCamara.granted) {
  setEstado('concedido');
} else if (permisoCamara.canAskAgain) {
  setEstado('preguntable');
} else {
  setEstado('bloqueado');
}
```

**¿Por qué no alcanza con mirar status?**
- `status` puede ser `denied` en dos casos:
  1. La persona rechazó, pero puede volver a preguntar (`canAskAgain: true`).
  2. La persona rechazó definitivamente (`canAskAgain: false`).
- Necesito `canAskAgain` para decidir si mostrar "Continuar" (pedir permiso de nuevo) o "Abrir Ajustes" (ir a configuración).

#### c) ¿Qué parte de tu código se entera de que volvió de Ajustes?

**En mi app actual**: NADA se entera automáticamente.

**Problema**: Si la persona habilita la cámara en Ajustes y vuelve, la app sigue mostrando "Abrir Ajustes" porque no actualizó el estado del permiso.

**Cómo lo resolvería**:
- Usar `AppState` para detectar cuando la app vuelve a primer plano.
- Volver a consultar el permiso con `useCameraPermissions()` o `requestCameraPermissionsAsync()`.
- Actualizar el estado local.

**¿Qué mostraría si esa parte no existiera?**
- Mostraría "Abrir Ajustes" aunque la cámara ya esté habilitada.
- La persona tendría que cerrar y reabrir la app para que funcione.

---

### D2. Notificaciones y consistencia

#### a) Si no cancelaras la notificación al devolver

**Problema**: La notificación se programó para avisar de la devolución. Si se devuelve el libro antes de los 15 segundos, la notificación sigue programada.

**Resultado**: La persona recibe una notificación diciendo "Tenés que devolver X libro", pero ya lo devolvió.

**Consecuencia**: Confusión, desconfianza en la app, y posible acción innecesaria (ir a devolver un libro que ya no tiene).

#### b) ¿Dónde guardo el identificador de la notificación?

**En mi app**: En `Prestamo.notificacionId` (AppContext).

**Si la app se cierra antes de que llegue la notificación**:
- **La notificación**: Sigue programada en el sistema operativo. Se mostrará aunque la app esté cerrada.
- **El identificador**: Se pierde si no se persiste (porque está en memoria).

**Problema**: Si la persona abre la app después de que se cerró, no tiene el `notificacionId` y no puede cancelar la notificación.

**Cómo lo resolvería**:
- Persistir los préstamos con `@react-native-async-storage/async-storage`.
- Al iniciar la app, cargar los préstamos desde storage.
- Así, el `notificacionId` persiste entre sesiones.

#### c) ¿Por qué el canal se crea antes de pedir el permiso en Android 13+?

**Razón**: En Android 13+ (API 33+), las notificaciones requieren permiso en tiempo de ejecución. Pero los canales de notificación se crean ANTES de pedir el permiso porque:
1. El canal define el comportamiento de las notificaciones (sonido, vibración, importancia).
2. Se puede crear el canal sin tener permiso.
3. Cuando se pide el permiso y se concede, las notificaciones se muestran en ese canal.

**¿Qué cambia en Android 12?**
- En Android 12 (API 32), las notificaciones NO requieren permiso en tiempo de ejecución.
- Se pueden mostrar notificaciones sin pedir permiso.
- Pero igual se necesita crear el canal antes de mostrar notificaciones.

**En mi app**: Creo el canal en el layout raíz (_layout.tsx) al iniciar la app, antes de pedir permiso:
```typescript
useEffect(() => {
  Notifications.setNotificationChannelAsync(CANAL_PRESTAMOS, {
    name: 'Préstamos',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: colores.primario,
  });
}, []);
```

#### d) Si el permiso está denegado y te entregan un libro desde el mostrador

**¿Cómo te enterás?**
- En /reservas, se muestra un aviso dentro de la app.

**Código que decide** (en src/app/(tabs)/reservas.tsx):
```typescript
const { avisos } = useApp();

// Renderizar avisos
if (avisos.length > 0) {
  return (
    <View style={estilos.seccionAvisos}>
      {avisos.map((aviso) => (
        <View key={aviso.id} style={estilos.aviso}>
          <Text style={estilos.textoAviso}>{aviso.texto}</Text>
        </View>
      ))}
    </View>
  );
}
```

**¿Consulta el permiso en ese momento o usa un valor guardado?**
- **NO consulta el permiso**. Solo muestra los avisos que están en el AppContext.
- El mostrador (/mostrador) es el que debería decidir si enviar notificación o agregar aviso, según el permiso.

**¿Por qué importa?**
- Si consulta el permiso en tiempo real, podría cambiar (la persona lo activó/desactivó en Ajustes).
- Si usa un valor guardado, podría estar desactualizado.
- **Lo correcto**: Consultar el permiso en el momento de decidir si enviar notificación o agregar aviso.

---

### D3. Lo que tu app pide y lo que no

#### Tabla de permisos

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | Quién lo agrega |
|------------|---------------------------|-----------------------------------|-----------------|
| Android | `android.permission.CAMERA` | Escanear códigos de barras | expo-camera (plugin) |
| Android | `android.permission.POST_NOTIFICATIONS` | Recordatorios de devolución | expo-notifications (plugin) |
| iOS | `NSCameraUsageDescription` | Escanear códigos de barras | expo-camera (plugin) |
| iOS | `NSUserNotificationsUsageDescription` | Recordatorios de devolución | expo-notifications (plugin) |

#### a) ¿Por qué no declara RECORD_AUDIO?

**Fragmento de app.json**:
```json
["expo-camera", {
  "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrir su ficha al instante.",
  "microphonePermission": false,
  "recordAudioAndroid": false
}]
```

**Razón**: 
- `microphonePermission: false` le dice a expo-camera que NO pida permiso de micrófono en iOS.
- `recordAudioAndroid: false` le dice a expo-camera que NO pida permiso de grabación de audio en Android.
- La app solo usa la cámara para escanear códigos visuales, no necesita audio.

#### b) Si te piden "elegir una foto de portada desde la galería"

**Paquete**: `expo-image-picker`

**Permiso necesario**:
- Android: `READ_MEDIA_IMAGES` (Android 13+) o `READ_EXTERNAL_STORAGE` (Android 12-)
- iOS: `NSPhotoLibraryUsageDescription`

**¿Alcanza con OTA o hace falta build nueva?**
- **Build nueva**. `expo-image-picker` tiene código nativo.
- Las actualizaciones OTA (eas update) solo pueden actualizar JavaScript, no código nativo.
- Hay que compilar una nueva build con `eas build` que incluya el módulo nativo.

**Justificación**: Cualquier módulo con código nativo requiere una nueva build. Solo los cambios en JavaScript/TypeScript pueden enviarse por OTA.

#### c) ¿Qué partes no pudiste verificar en Expo Go?

**Partes no verificables en Expo Go**:
1. **Texto de propósito personalizado**: Expo Go usa sus propios textos de propósito, no los de app.json.
2. **Canal de notificaciones de Android**: Expo Go no permite crear canales personalizados.
3. **blockedPermissions**: Expo Go ya tiene sus propios permisos configurados.

**¿Por qué?**
- Expo Go es una app pre-compilada con un conjunto fijo de módulos nativos.
- No puede leer la configuración de app.json de tu proyecto (solo lee el manifiesto de Expo Go).
- Para ver tus textos personalizados y canales, necesitás un development build.

**Cómo las verificaría**:
- Crear un development build con `eas build --profile development`.
- Instalar la app en un dispositivo real.
- Verificar los textos de propósito en el diálogo de permisos.
- Verificar el canal de notificaciones en Ajustes de Android.

---

## Parte E · Buenas prácticas y decisiones de diseño

### E1. Revisión de código

#### a) Al menos 8 problemas en el código del compañero

| Línea | Problema | Clasificación | Por qué sucede | Cómo corregirlo |
|-------|----------|---------------|----------------|-----------------|
| 10 | `useState<any[]>` | Mala práctica | Usa `any`, pierde tipado | `useState<Libro[]>` |
| 14-15 | Pide permisos de cámara y notificaciones al montar el Catálogo | Error de ejecución | Pide permisos innecesarios al abrir la app | Pedir permisos solo cuando se necesitan (en /escanear y al activar "Recordarme") |
| 16 | `useEffect` con array de dependencias vacío pero pide permisos | Advertencia | Los permisos deberían pedirse en el momento de uso, no al montar | Mover la lógica de permisos a los hooks correspondientes |
| 19 | `obtenerLibros().then(...)` sin manejo de errores | Error de ejecución | Si la petición falla, no se maneja el error | Agregar `.catch()` o usar async/await con try/catch |
| 20 | `useEffect` sin array de dependencias | Error de ejecución | Se ejecuta en CADA render, causando un loop infinito | Agregar `[]` o las dependencias necesarias |
| 22-30 | Componente `Fila` definido DENTRO del render del componente | Rendimiento | Se recrea en cada render, lo que puede causar re-renders innecesarios | Moverlo fuera del componente o a un archivo separado |
| 25 | Estilo en línea `style={{ fontSize: 16, color: '#333', padding: 12 }}` | Mala práctica | Estilos en línea son menos performantes y difíciles de mantener | Usar `StyleSheet.create` y constantes de tema |
| 34-36 | `key={i}` (índice) en lugar de `key={libro.isbn}` | Rendimiento | Usar el índice como key puede causar problemas de rendimiento y bugs | Usar `key={libro.isbn}` |
| 33 | `ScrollView` en lugar de `FlatList` | Rendimiento | `ScrollView` renderiza todos los elementos de una vez, `FlatList` es virtualizado | Usar `FlatList` para listas largas |
| 38 | `Ionicons` sin `accessibilityLabel` | Accesibilidad | Los íconos sin etiqueta no son accesibles | Agregar `accessibilityLabel="Escanear código"` |

#### b) ¿Qué pasa con el efecto de las líneas 18 a 20 durante el primer minuto?

```typescript
useEffect(() => {
  obtenerLibros().then((datos) => setLibros(datos));
});
```

**Sin array de dependencias, se ejecuta en CADA render.**

**Paso a paso durante el primer minuto**:
1. Render 1: Se ejecuta el efecto, pide obtenerLibros()
2. Render 2 (cuando llega la respuesta y se actualiza el estado): Se ejecuta el efecto de nuevo, pide obtenerLibros() otra vez
3. Render 3 (cuando llega la segunda respuesta): Se ejecuta el efecto de nuevo, pide obtenerLibros() otra vez
4. ... y así sucesivamente

**Resultado**: Se hacen cientos de peticiones a obtenerLibros() en un minuto, porque cada respuesta dispara un re-render, que dispara el efecto, que hace otra petición.

**¿Cambiaría algo si obtenerLibros() devolviera siempre el mismo array?**
- **NO cambiaría el problema principal**: El efecto se seguiría ejecutando en cada render.
- **Pero**: Si devolviera la misma referencia (no una copia), React podría optimizar y no re-renderizar si el estado no cambió.
- **Sin embargo**: Como cada llamada a obtenerLibros() hace `LIBROS.map(libro => ({ ...libro }))`, crea objetos nuevos cada vez, por lo que el estado siempre cambia y siempre hay re-render.

#### c) Pantalla reescrita

Ya está implementada en src/app/(tabs)/index.tsx con las buenas prácticas.

#### d) ¿Qué problema podría provocar el rechazo en una tienda?

**Rechazo en tienda**:
- **Línea 14-15**: Pedir permisos de cámara y notificaciones al abrir la app sin justificación.
- Apple y Google pueden rechazar la app si pide permisos innecesarios o sin contexto claro.

**Desinstalación primero**:
- **Línea 20**: Loop infinito de peticiones.
- La app se sentiría lenta, consumiría datos y batería.
- El usuario la desinstalaría rápidamente.

---

### E2. Organización y acoplamiento

#### a) Dependencias entre carpetas

```
src/
├── app/ → imports from: components, hooks, context, lib, constants, types, data
├── components/ → imports from: constants, types
├── hooks/ → imports from: lib, types, constants
├── context/ → imports from: estructuras, types, constants, data
├── lib/ → imports from: data, types
├── estructuras/ → (no imports de src/, solo TypeScript)
├── data/ → imports from: types
├── types/ → (no imports)
└── constants/ → imports from: types (solo para Recurso)
```

**¿Hay importaciones "hacia arriba"?**
- **NO**. Ninguna carpeta de lógica (hooks, context, lib, estructuras) importa de `app/`.
- Esto es correcto porque `app/` es la capa de presentación (rutas), y las demás son capas de lógica/negocio.

**¿Por qué sería un problema?**
- Si un hook importara de `app/`, crearía una dependencia circular.
- Las pantallas (app/) dependen de los hooks, pero los hooks no deberían depender de las pantallas.
- Violaría el principio de dependencia: las capas internas no deben depender de las externas.

#### b) Si el catálogo pasara a una API real

**Archivos que cambiarían**:
1. **src/lib/api.ts**: Cambiar `obtenerLibros()` y `buscarLibros()` para hacer peticiones HTTP reales.
2. **src/types/index.ts**: Posiblemente agregar tipos para respuestas de la API.

**¿Qué me dice eso sobre mi diseño?**
- **Solo 2 archivos**: Indica que el diseño está bien desacoplado.
- La API está aislada en `src/lib/api.ts`, por lo que cambiar la implementación no afecta el resto de la app.
- Los hooks (`useLibros`) no saben de dónde vienen los datos, solo que reciben una Promise.

**Si hubiera más de 2 archivos**:
- Indica que la lógica de API está mezclada con otras partes.
- Habría que refactorizar para aislar la capa de datos.

#### c) Componente <ConPermiso recurso="camara">

**¿Qué ganaría?**
- Reutilización: Un solo componente que maneja la lógica de permisos.
- Separación de preocupaciones: La pantalla no se preocupa por los permisos, solo por la UI.
- Más limpio: `<ConPermiso recurso="camara"><CameraView /></ConPermiso>`.

**¿Qué perdería?**
- Flexibilidad: Cada pantalla podría necesitar mostrar la UI de permiso de forma diferente.
- Control: Difícil personalizar el flujo (ej: en el escáner, si el ISBN no existe, permito volver a escanear).

**¿Serviría para notificaciones?**
- **NO**, porque las notificaciones no se piden al abrir una pantalla, sino al activar un interruptor.
- El flujo es diferente: no hay una pantalla de "activar notificaciones", sino un interruptor en /reservas.
- Un componente wrapper no encaja bien en ese flujo.

---

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
|-----------|-------------------|-----------------------------------|
| `obtenerLibros()` falla | Mensaje de error con botón "Reintentar" | src/app/(tabs)/index.tsx, líneas 42-54 |
| Se abre `/libro/abc` | Mensaje "ISBN inválido" con link al Catálogo | src/app/libro/[isbn].tsx, líneas 32-44 |
| Se escanea un ISBN que no está en el catálogo | Mensaje "Este libro no está en nuestro catálogo" y puede volver a escanear | src/app/escanear.tsx, líneas 58-62 |
| La cámara está bloqueada | Pantalla de permisos con botón "Abrir Ajustes" | src/app/escanear.tsx, líneas 28-40 |
| Las notificaciones están denegadas | Avisos dentro de la app en /reservas | src/app/(tabs)/reservas.tsx, líneas 67-81 |
| Se intenta reservar un libro ya reservado | Mensaje "Ya reservaste este libro" en el detalle | src/app/libro/[isbn].tsx, líneas 77-79 |
| "Entregar al siguiente" con lista vacía | (No implementado completamente) | src/app/mostrador.tsx |
| Login con clave incorrecta | Mensaje "Usuario o clave incorrectos" | src/app/login.tsx, líneas 24-26 |

---

### E4. Decisiones con argumentos

#### a) Identificador: ISBN vs id numérico

**Postura**: Usar ISBN como parámetro de ruta y key.

**Argumentos a favor**:
1. **Identificador natural**: El ISBN es único para cada libro (como un DNI).
2. **Deep links**: Permite compartir links como `bibliotecaipf://libro/9788497592208`.
3. **No requiere base de datos**: No hay que generar IDs artificiales.
4. **Tipado**: `useLocalSearchParams` devuelve strings, y el ISBN es un string de 13 dígitos.

**Contras y respuestas**:
- **Libros sin ISBN**: En este contexto, todos los libros tienen ISBN. Si no tuviera, podría usar un ID interno, pero complicaría el diseño.
- **Dos ediciones del mismo título**: Tienen ISBNs diferentes, por lo que se distinguen correctamente.
- **Tipo de dato**: El ISBN es un string (no number) porque puede empezar con 0 y es largo.

**Conclusión**: ISBN es la mejor opción para este caso.

#### b) Estructuras: Clase Pila con #items vs array en estado

**Postura**: Clase Pila con `#items`.

**¿Qué me dio la clase?**
- Encapsulación: No se puede tocar el array directamente.
- Métodos claros: `apilar()`, `desapilar()`, `verTope()`.
- Reutilización: La clase se puede usar en cualquier contexto, no solo en React.

**¿Qué complicó al combinarla con React?**
- **Mutación vs inmutabilidad**: React necesita que el estado cambie de referencia para re-renderizar.
- Si hago `pila.apilar(x)`, mutas el objeto pero React no lo detecta.
- **Solución**: Crear una nueva Pila cada vez: `new Pila(pila.aArray())`.

**Alternativa: array en estado con `[...pila, x]` y `slice()`**:
```typescript
const [pila, setPila] = useState<string[]>([]);
const apilar = (x: string) => setPila([...pila, x]);
const desapilar = () => setPila(pila.slice(0, -1));
```

**Ventaja**: Más simple, no requiere crear clases.
**Desventaja**: Menos encapsulación, se puede tocar el array directamente.

**Conclusión**: La clase Pila es más robusta y educativa, pero requiere cuidado al combinarla con React (crear nuevas instancias).

#### c) Memorización: ¿Usé useMemo o useCallback?

**¿Usé useMemo?**
- **NO** explícitamente.
- **Razón**: Los valores del Context ya son calculados en cada render, y no hay operaciones costosas que justifiquen useMemo.

**¿Usé useCallback?**
- **SÍ**, en las funciones del Context:
```typescript
const reservar = useCallback((libro: Libro) => { ... }, [prestamos, listasEspera]);
const devolver = useCallback((isbn: string) => { ... }, []);
```

**¿Dónde aportan?**
- **value del Context**: Si las funciones no están memorizadas, se recrean en cada render, lo que causa que todos los consumidores del Context se re-rendericen.
- **useCallback** evita que las funciones se recreen, lo que estabiliza el value del Context.

**¿Dónde serían ruido?**
- En componentes simples que no se re-renderizan frecuentemente.
- En funciones que no se pasan como props o no están en el value del Context.
- **Ejemplo**: Una función `handleClick` en un botón simple no necesita useCallback.

**¿Cómo lo comprobaría?**
- Usar React DevTools Profiler para ver si hay re-renders innecesarios.
- Si un componente se re-renderiza aunque sus props no cambiaron, podría necesitar useMemo/useCallback.
- **Pero**: Solo optimizar si hay un problema medible, no por anticipado.

#### d) Datos duplicados: ¿Guardé los "ejemplares disponibles" en el estado o los calculo?

**Postura**: Los calculo, no los guardo.

**¿Cómo lo evito?**
- Los ejemplares disponibles se calculan como:
```typescript
const ejemplaresDisponibles = libro.ejemplares - prestamos.filter(
  p => p.isbn === libro.isbn && p.origen === 'estante'
).length;
```

**Error que aparece cuando un mismo dato vive en dos lugares**:
- **Inconsistencia**: Si guardo `ejemplaresDisponibles` en el estado, tengo que actualizarlo cada vez que se hace o devuelve un préstamo.
- **Bug**: Si olvidó actualizarlo en algún lugar, los datos quedan inconsistentes.
- **Ejemplo**: Se hace un préstamo, pero se olvida decrementar `ejemplaresDisponibles`. La app muestra "2 ejemplares disponibles" cuando en realidad hay 1.

**Cómo lo evita mi diseño**:
- Los ejemplares disponibles se calculan en el momento, no se guardan.
- Siempre están actualizados porque dependen de `libro.ejemplares` (constante) y `prestamos` (estado global).
- No hay forma de que queden inconsistentes.

**Conclusión**: Calcular es mejor que guardar cuando el dato se puede derivar de otros datos.

---

## Conclusión

Este trabajo práctico integró todos los conceptos vistos en el cuatrimestre:
- **Componentes y estado** (TP 1): Hooks, efectos, limpieza.
- **Navegación** (TP 2): Expo Router, pilas, colas, deep links.
- **Permisos** (TP 3): Cámara, notificaciones, estados de permiso.

Las buenas prácticas (TypeScript, lint, accesibilidad, organización) fueron transversales a todo el proyecto.
