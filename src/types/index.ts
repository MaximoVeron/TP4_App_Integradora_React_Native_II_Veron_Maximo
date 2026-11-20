/**
 * Tipos compartidos de toda la app.
 * El tipo `Libro` viene dado por la consigna (se copia tal cual).
 */

export type Libro = {
  isbn: string;        // 13 dígitos, sin guiones
  titulo: string;
  autor: string;
  anio: number;
  ejemplares: number;  // ejemplares en el estante al iniciar la app
};

/**
 * Un préstamo activo de la persona usuaria.
 * - `vence`: fecha de devolución en milisegundos (Date.now() + 7 días).
 * - `origen`: 'estante' si se tomó un ejemplar disponible; 'espera' si llegó
 *   desde la lista de espera (lo entregó el mostrador). Solo los de 'estante'
 *   descuentan ejemplares disponibles.
 * - `notificacionId`: id del recordatorio programado, o null si está apagado.
 */
export type Prestamo = {
  isbn: string;
  vence: number;
  origen: 'estante' | 'espera';
  notificacionId: string | null;
};

/** Resultado de intentar reservar un libro. */
export type ResultadoReserva =
  | { tipo: 'prestamo'; vence: number }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'repetida' };

/** Aviso que se muestra dentro de la app (cuando no hay notificaciones). */
export type Aviso = {
  id: string;
  texto: string;
};

/** Recursos del teléfono que la app usa. */
export type Recurso = 'camara' | 'notificaciones';

/**
 * Los cuatro estados de un permiso:
 * cargando → todavía no sabemos nada.
 * concedido → la persona aceptó.
 * preguntable → no aceptó, pero podemos mostrar el diálogo del sistema.
 * bloqueado → el sistema ya no muestra el diálogo: solo queda ir a Ajustes.
 */
export type EstadoPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado';
