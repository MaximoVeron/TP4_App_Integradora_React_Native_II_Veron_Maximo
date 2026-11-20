import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Pila } from '../estructuras/Pila';
import { Cola } from '../estructuras/Cola';
import { ESPERAS_INICIALES, LIBROS } from '../data/libros';
import { DIAS_PRESTAMO, USUARIO_ACTUAL, SEGUNDOS_RECORDATORIO } from '../constants/biblioteca';
import type { Libro, Prestamo, ResultadoReserva, Aviso } from '../types';

/**
 * Estado global de la app.
 * Incluye préstamos, listas de espera, recientes, sesión y avisos.
 * También maneja las notificaciones locales (recordatorios y entregas).
 */
type AppContextType = {
  // Préstamos
  prestamos: Prestamo[];
  reservar: (libro: Libro) => ResultadoReserva;
  devolver: (isbn: string) => void;

  // Recordatorios de notificación
  programarRecordatorio: (isbn: string) => Promise<string | null>;
  cancelarRecordatorio: (isbn: string) => Promise<void>;

  // Vistos recientemente (Pila)
  agregarReciente: (libro: Libro) => void;
  recientes: Libro[];

  // Listas de espera (Cola por ISBN)
  listasEspera: Record<string, Cola<string>>;
  posicionEnEspera: (isbn: string) => number;

  // Mostrador: entregar al siguiente
  entregarAlSiguiente: (isbn: string) => Promise<void>;

  // Sesión del personal
  sesionActiva: boolean;
  usuarioSesion: string | null;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;

  // Avisos dentro de la app
  avisos: Aviso[];
  agregarAviso: (texto: string) => void;
  quitarAviso: (id: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

/**
 * Provider del contexto de la app.
 * Envuelve toda la aplicación y provee el estado global.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  // Préstamos activos
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);

  // Vistos recientemente (Pila)
  const [recientes, setRecientes] = useState<Pila<Libro>>(() => new Pila());

  // Listas de espera por ISBN (inicializadas con datos del catálogo)
  const [listasEspera, setListasEspera] = useState<Record<string, Cola<string>>>(() => {
    const inicial: Record<string, Cola<string>> = {};
    for (const [isbn, personas] of Object.entries(ESPERAS_INICIALES)) {
      inicial[isbn] = new Cola(personas);
    }
    return inicial;
  });

  // Sesión del personal
  const [sesionActiva, setSesionActiva] = useState(false);
  const [usuarioSesion, setUsuarioSesion] = useState<string | null>(null);

  // Avisos dentro de la app (cuando no hay notificaciones)
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  /**
   * Reservar un libro.
   * - Si hay ejemplares disponibles: préstamo por 7 días.
   * - Si no hay ejemplares: agregar a la lista de espera.
   * - No permite reservar dos veces el mismo libro.
   */
  const reservar = useCallback(
    (libro: Libro): ResultadoReserva => {
      // Verificar si ya tiene un préstamo activo
      const yaReservado = prestamos.some((p) => p.isbn === libro.isbn);
      if (yaReservado) {
        return { tipo: 'repetida' };
      }

      // Verificar si está en lista de espera
      const listaEsperaLibro = listasEspera[libro.isbn];
      if (listaEsperaLibro && listaEsperaLibro.aArray().includes(USUARIO_ACTUAL)) {
        return { tipo: 'repetida' };
      }

      if (libro.ejemplares > 0) {
        // Hay ejemplares: crear préstamo con vencimiento a 7 días
        const vence = Date.now() + DIAS_PRESTAMO * 24 * 60 * 60 * 1000;
        const nuevoPrestamo: Prestamo = {
          isbn: libro.isbn,
          vence,
          origen: 'estante',
          notificacionId: null,
        };
        setPrestamos((prev) => [...prev, nuevoPrestamo]);
        return { tipo: 'prestamo', vence };
      } else {
        // No hay ejemplares: agregar a lista de espera con Cola
        setListasEspera((prev) => {
          const lista = prev[libro.isbn] || new Cola<string>();
          const nuevaLista = new Cola(lista.aArray());
          nuevaLista.encolar(USUARIO_ACTUAL);
          return { ...prev, [libro.isbn]: nuevaLista };
        });
        const nuevaPosicion = (listasEspera[libro.isbn]?.tamanio || 0) + 1;
        return { tipo: 'espera', posicion: nuevaPosicion };
      }
    },
    [prestamos, listasEspera]
  );

  /**
   * Programar un recordatorio de devolución.
   * - Programa una notificación local a los 15 segundos (modo demo).
   * - Guarda el identificador en el préstamo para poder cancelarla después.
   * - Retorna el ID de la notificación o null si no se pudo programar.
   */
  const programarRecordatorio = useCallback(async (isbn: string): Promise<string | null> => {
    const libro = LIBROS.find((l) => l.isbn === isbn);
    if (!libro) return null;

    try {
      // Programar notificación local a los 15 segundos (demo)
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de devolución',
          body: `Tenés que devolver "${libro.titulo}" hoy.`,
        },
        // En modo demo: 15 segundos. En producción: DIAS_PRESTAMO días.
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: SEGUNDOS_RECORDATORIO,
          repeats: false,
        },
      });

      // Guardar el ID en el préstamo
      setPrestamos((prev) =>
        prev.map((p) => (p.isbn === isbn ? { ...p, notificacionId: id } : p))
      );

      return id;
    } catch {
      return null;
    }
  }, []);

  /**
   * Cancelar el recordatorio de un préstamo.
   * - Cancela la notificación programada.
   * - Limpia el ID del préstamo.
   */
  const cancelarRecordatorio = useCallback(async (isbn: string): Promise<void> => {
    // Buscar el préstamo y su notificación
    const prestamo = prestamos.find((p) => p.isbn === isbn);
    if (prestamo?.notificacionId) {
      await Notifications.cancelScheduledNotificationAsync(prestamo.notificacionId);
    }

    // Limpiar el ID
    setPrestamos((prev) =>
      prev.map((p) => (p.isbn === isbn ? { ...p, notificacionId: null } : p))
    );
  }, [prestamos]);

  /**
   * Devolver un libro.
   * - Cancela el recordatorio si existe.
   * - Elimina el préstamo.
   */
  const devolver = useCallback(
    async (isbn: string): Promise<void> => {
      // Cancelar notificación si existe
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.notificacionId) {
        await Notifications.cancelScheduledNotificationAsync(prestamo.notificacionId);
      }

      // Eliminar el préstamo
      setPrestamos((prev) => prev.filter((p) => p.isbn !== isbn));
    },
    [prestamos]
  );

  /**
   * Agregar un libro a los vistos recientemente.
   * Si ya existe en la pila, se elimina y se coloca en el tope.
   */
  const agregarReciente = useCallback((libro: Libro) => {
    setRecientes((prev) => {
      // Eliminar cualquier ocurrencia previa del libro (por ISBN)
      const arraySinDuplicados = prev.aArray().filter((l) => l.isbn !== libro.isbn);
      const nueva = new Pila(arraySinDuplicados);
      nueva.apilar(libro);
      // Mantener solo los últimos 10 (para tener más opciones)
      const array = nueva.aArray();
      if (array.length > 10) {
        return new Pila(array.slice(-10));
      }
      return nueva;
    });
  }, []);

  /**
   * Obtener la posición en la lista de espera de un libro.
   */
  const posicionEnEspera = useCallback(
    (isbn: string): number => {
      const lista = listasEspera[isbn];
      if (!lista) return 0;
      const array = lista.aArray();
      const index = array.indexOf(USUARIO_ACTUAL);
      return index === -1 ? 0 : index + 1;
    },
    [listasEspera]
  );

  /**
   * Entregar un libro al siguiente en la lista de espera.
   * - Desencola a la persona del frente.
   * - Si esa persona es el usuario actual, le envía una notificación
   *   (si tiene permiso) o un aviso dentro de la app (si no).
   */
  const entregarAlSiguiente = useCallback(async (isbn: string): Promise<void> => {
    const cola = listasEspera[isbn];
    if (!cola || cola.estaVacia()) return;

    // Desencolar a la persona del frente
    const persona = cola.desencolar();
    if (!persona) return;

    // Actualizar la lista de espera (nueva referencia para React)
    setListasEspera((prev) => {
      const nuevaCola = new Cola(cola.aArray());
      return { ...prev, [isbn]: nuevaCola };
    });

    // Si la persona del frente es el usuario actual, notificarle
    if (persona === USUARIO_ACTUAL) {
      const libro = LIBROS.find((l) => l.isbn === isbn);
      const titulo = libro?.titulo || 'tu libro';
      const mensaje = `Tu ejemplar de "${titulo}" está listo para retirar.`;

      // Verificar si tenemos permiso de notificaciones
      const { status } = await Notifications.getPermissionsAsync();

      if (status === 'granted') {
        // Enviar notificación local inmediata
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '¡Tu libro está listo!',
            body: mensaje,
          },
          trigger: null,
        });
      } else {
        // Sin permiso: mostrar aviso dentro de la app
        setAvisos((prev) => [
          ...prev,
          { id: Date.now().toString(), texto: mensaje },
        ]);
      }
    }
  }, [listasEspera]);

  /**
   * Iniciar sesión del personal.
   */
  const iniciarSesion = useCallback((usuario: string, clave: string): boolean => {
    if (usuario === 'biblioteca' && clave === 'ipf2026') {
      setSesionActiva(true);
      setUsuarioSesion(usuario);
      return true;
    }
    return false;
  }, []);

  /**
   * Cerrar sesión del personal.
   */
  const cerrarSesion = useCallback(() => {
    setSesionActiva(false);
    setUsuarioSesion(null);
  }, []);

  /**
   * Agregar un aviso dentro de la app.
   */
  const agregarAviso = useCallback((texto: string) => {
    const id = Date.now().toString();
    setAvisos((prev) => [...prev, { id, texto }]);
  }, []);

  /**
   * Quitar un aviso.
   */
  const quitarAviso = useCallback((id: string) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value: AppContextType = {
    prestamos,
    reservar,
    devolver,
    programarRecordatorio,
    cancelarRecordatorio,
    agregarReciente,
    recientes: recientes.aArray().slice(-3).reverse(), // Últimos 3, del más reciente al más antiguo
    listasEspera,
    posicionEnEspera,
    entregarAlSiguiente,
    sesionActiva,
    usuarioSesion,
    iniciarSesion,
    cerrarSesion,
    avisos,
    agregarAviso,
    quitarAviso,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook para acceder al contexto de la app.
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
}
