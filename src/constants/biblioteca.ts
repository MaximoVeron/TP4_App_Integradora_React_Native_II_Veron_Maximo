import type { Recurso } from '../types';

/**
 * Constantes de negocio de la biblioteca.
 */

/** Nombre de la persona que usa la app (se usa en las listas de espera). */
export const USUARIO_ACTUAL = 'Veron Maximo';

/** Días que dura un préstamo. */
export const DIAS_PRESTAMO = 7;

/** Modo demostración: el recordatorio llega a los 15 segundos. */
export const SEGUNDOS_RECORDATORIO = 15;

/** Cantidad de "Vistos recientemente" que muestra el Catálogo. */
export const CANTIDAD_RECIENTES = 3;

/** Espera del buscador antes de pedir resultados (debounce). */
export const MS_DEBOUNCE_BUSQUEDA = 300;

/** Canal de notificaciones de Android para los préstamos. */
export const CANAL_PRESTAMOS = 'prestamos';

/**
 * Credenciales fijas del personal (la consigna pide que estén en el código).
 * En una app real NUNCA se guardan claves en el código.
 */
export const CREDENCIALES_PERSONAL = {
  usuario: 'biblioteca',
  clave: 'ipf2026',
};

/** Textos de la pantalla previa a cada permiso ("Usamos tu [dato] para [beneficio]"). */
export const TEXTOS_PERMISO: Record<Recurso, { titulo: string; beneficio: string }> = {
  camara: {
    titulo: 'Cámara',
    beneficio: 'Usamos tu cámara para leer el código de barras del libro y abrir su ficha al instante.',
  },
  notificaciones: {
    titulo: 'Notificaciones',
    beneficio: 'Usamos las notificaciones para recordarte cuándo devolver un libro y avisarte cuando te toca uno.',
  },
};
